import React, { useState, useEffect } from 'react';
import TVPatternChart from './TVPatternChart';
import { TV, TVTooltip, TVChartContainer, TVChartLoading, TVChartEmpty, COLORS } from './RechartsTheme';
// recharts kept for non-chart renders only
import { handlePatternFetch, handleShortPatternFetch, handleVeryShortPatternFetch } from './stockUtils';

const HeadAndShouldersDetector = ({ symbol }) => {
  const [longTermData, setLongTermData] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const [veryShortTermData, setVeryShortTermData] = useState(null);
  const [isLoading, setIsLoading] = useState({
    long: true,
    short: true,
    veryShort: true
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) {
      setError('No symbol selected. Please select a stock symbol from the main view.');
      setIsLoading({
        long: false,
        short: false,
        veryShort: false
      });
      return;
    }

    // Reset state when symbol changes
    setLongTermData(null);
    setShortTermData(null);
    setVeryShortTermData(null);
    setIsLoading({
      long: true,
      short: true,
      veryShort: true
    });

    console.log(`HeadAndShouldersDetector: Loading data for symbol ${symbol}`);
    setError('');
    
    // Fetch 200-day data
    handlePatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, long: state })),
      setError,
      setHistoricalData: setLongTermData
    });

    // Fetch 40-day data
    handleShortPatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, short: state })),
      setError,
      setHistoricalData: setShortTermData
    });
    
    // Fetch 10-day data
    handleVeryShortPatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, veryShort: state })),
      setError,
      setHistoricalData: setVeryShortTermData
    });
  }, [symbol]); // Re-run this effect when symbol changes

  const detectPatterns = (data) => {
    if (!data || !Array.isArray(data.prices) || data.prices.length < 5) return [];
    
    const priceData = data.prices;
    const prices = priceData.map(d => d.value);
    const patterns = [];
    
    // Find local maxima (peaks)
    const peaks = [];
    for (let i = 2; i < prices.length - 2; i++) {
      if (prices[i] > prices[i-1] && prices[i] > prices[i-2] &&
          prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
        peaks.push({ price: prices[i], index: i, date: priceData[i].date, value: prices[i] });
      }
    }

    // Find local minima (troughs) between two indices
    const findTrough = (fromIdx, toIdx) => {
      let minVal = Infinity, minIdx = -1;
      for (let i = fromIdx + 1; i < toIdx; i++) {
        if (prices[i] < minVal) { minVal = prices[i]; minIdx = i; }
      }
      return minIdx >= 0 ? { index: minIdx, value: minVal, date: priceData[minIdx].date } : null;
    };
    
    // Look for head and shoulders
    for (let i = 0; i < peaks.length - 2; i++) {
      const leftShoulder  = peaks[i];
      const head          = peaks[i + 1];
      const rightShoulder = peaks[i + 2];
      
      if (head.price > leftShoulder.price && 
          head.price > rightShoulder.price &&
          Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.05) {

        // Find troughs on either side of the head
        const leftTrough  = findTrough(leftShoulder.index, head.index);
        const rightTrough = findTrough(head.index, rightShoulder.index);

        // Neckline: line connecting the two troughs
        let necklinePoints = null;
        if (leftTrough && rightTrough) {
          // Extend neckline across the full pattern
          necklinePoints = [
            { date: leftTrough.date,  value: leftTrough.value },
            { date: rightTrough.date, value: rightTrough.value },
          ];
        }

        // Pattern height and target
        const necklineAvg = leftTrough && rightTrough 
          ? (leftTrough.value + rightTrough.value) / 2 
          : (leftShoulder.price + rightShoulder.price) / 2;
        const patternHeight = head.price - necklineAvg;
        const target = necklineAvg - patternHeight;

        patterns.push({
          leftShoulder:  { ...leftShoulder,  value: leftShoulder.price },
          head:          { ...head,          value: head.price },
          rightShoulder: { ...rightShoulder, value: rightShoulder.price },
          leftTrough,
          rightTrough,
          necklinePoints,
          target,
          patternHeight,
        });
      }
    }
    
    // Score and keep only the best 2 patterns
    // Score: prefer recent patterns + better shoulder symmetry
    patterns.sort((a, b) => {
      const symA = 1 - Math.abs(a.leftShoulder.price - a.rightShoulder.price) / a.head.price;
      const symB = 1 - Math.abs(b.leftShoulder.price - b.rightShoulder.price) / b.head.price;
      const recencyA = a.rightShoulder.index;
      const recencyB = b.rightShoulder.index;
      // Weight: 60% recency, 40% symmetry
      return (recencyB * 0.6 + symB * 0.4) - (recencyA * 0.6 + symA * 0.4);
    });

    return patterns.slice(0, 2);
  };

  const renderChart = (data, title) => {
    if (!data?.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      return (
        <div style={{backgroundColor:"#1E222D"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#D1D4DC",padding:"10px 14px",borderBottom:"1px solid #2A2E39"}}>{title}</div>
          <div>No data available</div>
        </div>
      );
    }

    const patterns = detectPatterns(data);

    return (
      <>
        <TVPatternChart
          data={data.prices}
          title={title}
          symbol={symbol}
          height={320}
          markers={patterns.flatMap(pattern => [
            { time: pattern.leftShoulder.date,  label: 'LS', color: '#26A69A', position: 'above' },
            { time: pattern.head.date,          label: 'H',  color: '#EF5350', position: 'above' },
            { time: pattern.rightShoulder.date, label: 'RS', color: '#26A69A', position: 'above' },
            pattern.leftTrough  ? { time: pattern.leftTrough.date,  label: 'LT', color: '#FF9800', position: 'below' } : null,
            pattern.rightTrough ? { time: pattern.rightTrough.date, label: 'RT', color: '#FF9800', position: 'below' } : null,
          ].filter(Boolean))}
          slopeLines={patterns.flatMap((pattern, pIdx) => {
            const lines = [];
            const col = pIdx === 0 ? '#EF5350' : '#FF9800';
            // Neckline: gold dashed through both troughs
            if (pattern.necklinePoints) {
              lines.push({ points: pattern.necklinePoints, color: '#F5C518', width: 2, dashed: true });
            }
            // Peak connector: LS → H → RS (subtle, same color as pattern)
            lines.push({
              points: [
                { date: pattern.leftShoulder.date,  value: pattern.leftShoulder.value },
                { date: pattern.head.date,          value: pattern.head.value },
                { date: pattern.rightShoulder.date, value: pattern.rightShoulder.value },
              ],
              color: col, width: 1.5, dashed: false,
            });
            // Left valley line: LS → LT
            if (pattern.leftTrough) {
              lines.push({
                points: [
                  { date: pattern.leftShoulder.date, value: pattern.leftShoulder.value },
                  { date: pattern.leftTrough.date,   value: pattern.leftTrough.value },
                ],
                color: col, width: 1, dashed: false,
              });
            }
            // Right valley line: H → RT → RS
            if (pattern.rightTrough) {
              lines.push({
                points: [
                  { date: pattern.head.date,          value: pattern.head.value },
                  { date: pattern.rightTrough.date,   value: pattern.rightTrough.value },
                  { date: pattern.rightShoulder.date, value: pattern.rightShoulder.value },
                ],
                color: col, width: 1, dashed: false,
              });
            }
            return lines;
          })}
          priceLines={patterns.slice(0,1).filter(p => p.target).map(p => ({
            value: p.target,
            color: '#EF5350',
            label: `↓ Target $${p.target.toFixed(2)}`,
            dashed: true,
            width: 1,
          }))}
        />
      {patterns.length === 0 ? (
        <div style={{padding:'10px 14px',fontSize:12,color:'#4C525E'}}>No H&S patterns detected in this timeframe.</div>
      ) : (
        <div style={{borderTop:'1px solid #2A2E39',padding:'10px 14px'}}>
          {patterns.map((p, i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,padding:'4px 0',borderBottom:i < patterns.length-1 ? '1px solid #2A2E39':'none'}}>
              <span style={{color:'#787B86'}}>
                Pattern {i+1} · LS: <span style={{color:'#D1D4DC'}}>${p.leftShoulder.value.toFixed(2)}</span>
                {' '}H: <span style={{color:'#EF5350',fontWeight:600}}>${p.head.value.toFixed(2)}</span>
                {' '}RS: <span style={{color:'#D1D4DC'}}>${p.rightShoulder.value.toFixed(2)}</span>
              </span>
              {p.target && <span style={{color:'#EF5350',fontWeight:600}}>Target ${p.target.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      )}
      </>
    );
  };

  if (isLoading.long && isLoading.short && isLoading.veryShort) {
    return <div style={{backgroundColor:"#1E222D",border:"1px solid #2A2E39",borderRadius:6,padding:16}}>
      <div style={{fontSize:12,fontWeight:600,color:"#D1D4DC",padding:"10px 14px",borderBottom:"1px solid #2A2E39"}}>Loading pattern analysis for {symbol}...</div>
    </div>;
  }

  if (error) {
    return <div style={{backgroundColor:"#1E222D",border:"1px solid #2A2E39",borderRadius:6,padding:16}}>
      <div style={{fontSize:12,fontWeight:600,color:"#D1D4DC",padding:"10px 14px",borderBottom:"1px solid #2A2E39"}}>Error: {error}</div>
    </div>;
  }

  return (
    <div>
      {renderChart(longTermData, "Head & Shoulders Pattern (200-Day)")}
      {renderChart(shortTermData, "Head & Shoulders Pattern (40-Day)")}
      {renderChart(veryShortTermData, "Head & Shoulders Pattern (10-Day)")}
    </div>
  );
};

export default HeadAndShouldersDetector;