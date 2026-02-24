import React, { useState, useEffect } from 'react';
// recharts replaced by TVPatternChart
import TVPatternChart from './TVPatternChart';
import { handlePatternFetch, handleShortPatternFetch, handleVeryShortPatternFetch } from './stockUtils';
import { chartPatternAnalysisWithHarmonics as chartPatternAnalysis } from './chartPatternAnalysis';

const AdvancedPatternDetector = ({ symbol }) => {
  const [longTermData, setLongTermData] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const [veryShortTermData, setVeryShortTermData] = useState(null);
  const [isLoading, setIsLoading] = useState({
    long: true,
    short: true,
    veryShort: true
  });
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState({
    long: null,
    short: null,
    veryShort: null
  });

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
    setAnalysis({
      long: null,
      short: null,
      veryShort: null
    });
    setIsLoading({
      long: true,
      short: true,
      veryShort: true
    });
    
    console.log(`AdvancedPatternDetector: Loading data for symbol ${symbol}`);
    setError('');
    
    // Fetch 200-day data
    handlePatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, long: state })),
      setError,
      setHistoricalData: (data) => {
        setLongTermData(data);
        if (data && data.prices) {
          const analysisResult = chartPatternAnalysis.analyzeChart(data.prices, 'long');
          setAnalysis(prev => ({
            ...prev,
            long: analysisResult
          }));
          // Debug log for harmonic patterns
          if (analysisResult?.harmonicPatterns && analysisResult.harmonicPatterns.length > 0) {
            console.log("FOUND HARMONIC PATTERNS (LONG):", analysisResult.harmonicPatterns);
          }
        }
      }
    });

    // Fetch 40-day data
    handleShortPatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, short: state })),
      setError,
      setHistoricalData: (data) => {
        setShortTermData(data);
        if (data && data.prices) {
          const analysisResult = chartPatternAnalysis.analyzeChart(data.prices, 'medium');
          setAnalysis(prev => ({
            ...prev,
            short: analysisResult
          }));
          // Debug log for harmonic patterns
          if (analysisResult?.harmonicPatterns && analysisResult.harmonicPatterns.length > 0) {
            console.log("FOUND HARMONIC PATTERNS (MEDIUM):", analysisResult.harmonicPatterns);
          }
        }
      }
    });
    
    // Fetch 10-day data
    handleVeryShortPatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, veryShort: state })),
      setError,
      setHistoricalData: (data) => {
        setVeryShortTermData(data);
        if (data && data.prices) {
          const analysisResult = chartPatternAnalysis.analyzeChart(data.prices, 'short');
          setAnalysis(prev => ({
            ...prev,
            veryShort: analysisResult
          }));
          // Debug log for harmonic patterns
          if (analysisResult?.harmonicPatterns && analysisResult.harmonicPatterns.length > 0) {
            console.log("FOUND HARMONIC PATTERNS (SHORT):", analysisResult.harmonicPatterns);
          }
        }
      }
    });
  }, [symbol]); // Re-run this effect whenever symbol changes

  const renderChart = (data, analysisData, title) => {
    if (!data?.prices || data.prices.length === 0) {
      return (
        <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-lg p-4 mb-6 border-2 border-yellow-400 shadow-lg shadow-yellow-400/20">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-4">{title}</h3>
          <div className="text-yellow-200">No data available</div>
        </div>
      );
    }

    const chartData = data.prices;

    // Create trend line coordinates
    const createTrendLine = (trendLine, data) => {
      if (!trendLine) return [];
      
      const points = [];
      for (let i = 0; i < data.length; i++) {
        points.push({
          date: data[i].date,
          trendValue: trendLine.slope * i + trendLine.intercept
        });
      }
      return points;
    };
    
    let uptrendData = [];
    let downtrendData = [];
    
    if (analysisData?.trendLines) {
      if (analysisData.trendLines.uptrend) {
        uptrendData = createTrendLine(analysisData.trendLines.uptrend, chartData);
      }
      
      if (analysisData.trendLines.downtrend) {
        downtrendData = createTrendLine(analysisData.trendLines.downtrend, chartData);
      }
    }

    // Prepare support and resistance lines
    const supportLines = analysisData?.supportResistance?.support || [];
    const resistanceLines = analysisData?.supportResistance?.resistance || [];
    
    // Get head and shoulders patterns
    const hsPatterns = analysisData?.headAndShoulders || [];
    const invHsPatterns = analysisData?.inverseHeadAndShoulders || [];
    
    // Create neckline points from head and shoulders
    const createNeckline = (pattern) => {
      if (!pattern.neckline) return [];
      
      return [
        {
          date: pattern.leftShoulder.date,
          necklineValue: pattern.neckline.slope * pattern.leftShoulder.index + pattern.neckline.intercept
        },
        {
          date: pattern.rightShoulder.date,
          necklineValue: pattern.neckline.slope * pattern.rightShoulder.index + pattern.neckline.intercept
        }
      ];
    };
    
    let necklineData = [];
    let invNecklineData = [];
    
    if (hsPatterns.length > 0) {
      necklineData = createNeckline(hsPatterns[0]);
    }
    
    if (invHsPatterns.length > 0) {
      invNecklineData = createNeckline(invHsPatterns[0]);
    }

    // Set up Fibonacci levels if available
    let fibonacciLevels = [];
    if (analysisData?.fibonacciLevels?.levels) {
      fibonacciLevels = analysisData.fibonacciLevels.levels;
    }
    
    // Set up moving averages if available
    let shortMA = [];
    let longMA = [];
    if (analysisData?.maCrossover) {
      if (analysisData.maCrossover.shortMA) {
        shortMA = analysisData.maCrossover.shortMA;
      }
      if (analysisData.maCrossover.longMA) {
        longMA = analysisData.maCrossover.longMA;
      }
    }

    // Prepare harmonic patterns visualization
    const harmonic = analysisData?.harmonicPatterns || [];
    const hasHarmonicPatterns = harmonic.length > 0;

    // Log detected harmonic patterns to console for debugging
    if (harmonic.length > 0) {
      console.log(`Found ${harmonic.length} harmonic patterns in ${title}:`, harmonic);
    }

    // Generate colors for different harmonic pattern types
    const getHarmonicColor = (patternType) => {
      if (patternType.includes('gartley')) return '#ff00ff'; // Magenta
      if (patternType.includes('butterfly')) return '#00ffff'; // Cyan
      if (patternType.includes('bat')) return '#ff8000'; // Orange
      if (patternType.includes('crab')) return '#00ff00'; // Green
      return '#ffffff'; // Default
    };

    // Make harmonic patterns more prominent
    const enhanceHarmonicDisplay = (pattern) => {
      // Generate a more visible ID for pattern
      const patternName = pattern.name || pattern.type.replace(/(bullish|bearish)_/, '');
      const isBullish = pattern.type.includes('bullish');
      
      // Add debug message to console with exact points
      console.log(`${patternName} pattern details:`, {
        type: pattern.type,
        points: pattern.points,
        ratios: pattern.ratios
      });
      
      return {
        color: getHarmonicColor(pattern.type),
        name: patternName.toUpperCase(),
        direction: isBullish ? 'Bullish' : 'Bearish',
        pattern: pattern
      };
    };

    // Ensure each detected pattern gets enhanced
    const enhancedHarmonicPatterns = harmonic.map(pattern => enhanceHarmonicDisplay(pattern));

    // Function to create line points for harmonic patterns
    const createHarmonicLines = (pattern) => {
      if (!pattern || !pattern.points) return [];
      
      const { X, A, B, C, D } = pattern.points;
      return [
        { date: X.date, harmonicValue: X.value },
        { date: A.date, harmonicValue: A.value },
        { date: B.date, harmonicValue: B.value },
        { date: C.date, harmonicValue: C.value },
        { date: D.date, harmonicValue: D.value }
      ];
    };

    // Analysis summary text
    const renderAnalysisSummary = () => {
      if (!analysisData) return null;
      
      return (
        <div className="mt-6 text-yellow-300 bg-gradient-to-r from-gray-900 via-black to-gray-900 p-5 rounded-lg border-2 border-yellow-500 shadow-lg shadow-yellow-500/20">
          <div className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-3">Analysis Summary for {symbol}:</div>
          
          <div className="ml-4 mt-3 space-y-2">
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'#787B86',fontSize:12}}>Trend:</span>
              <span style={{
                color: analysisData.trend?.trend === 'bullish' ? '#26A69A' : analysisData.trend?.trend === 'bearish' ? '#EF5350' : '#787B86',
                fontWeight: 600,
                fontSize: 12,
              }}>
                {analysisData.trend?.trend?.toUpperCase()}
                {analysisData.trend?.strength > 0 ? ` · ${analysisData.trend?.strength === 2 ? 'Strong' : 'Moderate'}` : ''}
              </span>
            </div>
            
             {/* Moving Average crossovers */}
            {analysisData.maCrossover?.crossovers.length > 0 && 
              analysisData.maCrossover.crossovers.slice(-1)[0].type === 'golden_cross' && (
              <div className="flex items-center">
                <span className="bg-gradient-to-r from-yellow-600 to-yellow-300 text-black font-bold px-3 py-1 rounded-md mr-2">SIGNAL</span>
                <span className="text-yellow-300 font-bold">
                  Golden Cross detected on {new Date(analysisData.maCrossover.crossovers.slice(-1)[0].date).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {analysisData.maCrossover?.crossovers.length > 0 && 
              analysisData.maCrossover.crossovers.slice(-1)[0].type === 'death_cross' && (
              <div className="flex items-center">
                <span className="bg-gradient-to-r from-red-700 to-red-500 text-white font-bold px-3 py-1 rounded-md mr-2">WARNING</span>
                <span className="text-red-400 font-bold">
                  Death Cross detected on {new Date(analysisData.maCrossover.crossovers.slice(-1)[0].date).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {/* Fibonacci Retracement */}
            {analysisData.fibonacciLevels?.levels?.length > 0 && (
              <div className="text-yellow-300">
                Key Fibonacci: {analysisData.fibonacciLevels.isUptrend ? 'Uptrend' : 'Downtrend'} retracement
              </div>
            )}
            
            {hsPatterns.length > 0 && (
              <div className="text-red-500 font-bold">
                Head and Shoulders detected 
                ({hsPatterns[0].reliability} reliability) 
                {hsPatterns[0].completion > 0 && 
                  ` - ${hsPatterns[0].completion.toFixed(1)}% complete`}
              </div>
            )}
            
            {invHsPatterns.length > 0 && (
              <div className="text-green-400">
                Inverse Head and Shoulders detected 
                ({invHsPatterns[0].reliability} reliability)
                {invHsPatterns[0].completion > 0 && 
                  ` - ${invHsPatterns[0].completion.toFixed(1)}% complete`}
              </div>
            )}
            
            {supportLines.length > 0 && (
              <div>
                Support Levels: {supportLines.slice(0, 2).map((level, i) => 
                  `S${i+1}: $${level.price.toFixed(2)}${level.hasActedAsBoth ? ' (S/R)' : ''}`).join(', ')}
              </div>
            )}
            
            {resistanceLines.length > 0 && (
              <div>
                Resistance Levels: {resistanceLines.slice(0, 2).map((level, i) => 
                  `R${i+1}: $${level.price.toFixed(2)}${level.hasActedAsBoth ? ' (S/R)' : ''}`).join(', ')}
              </div>
            )}
            
            {analysisData.trendLines?.uptrend && (
              <div className="text-green-400">
                Uptrend line detected ({analysisData.trendLines.uptrend.reliability} reliability)
              </div>
            )}
            
            {analysisData.trendLines?.downtrend && (
              <div className="text-red-500">
                Downtrend line detected ({analysisData.trendLines.downtrend.reliability} reliability)
              </div>
            )}
            
            {/* Enhanced Harmonic Patterns section */}
            {enhancedHarmonicPatterns.length > 0 && (
              <div className="mt-4 p-3 bg-black/50 rounded-lg border-2 border-yellow-400 shadow-lg shadow-yellow-400/20">
                <div className="font-bold text-2xl text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-3">
                  Harmonic Patterns Detected
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {enhancedHarmonicPatterns.map((pattern, idx) => (
                    <div key={`harmonic-card-${idx}`} 
                      className="rounded-md overflow-hidden border"
                      style={{ borderColor: pattern.color }}
                    >
                      <div className="p-2 font-bold text-lg text-center text-white"
                        style={{ backgroundColor: pattern.color + "90" }}>
                        {pattern.name} PATTERN ({pattern.direction})
                      </div>
                      <div className="p-3 bg-black/70 text-white">
                        <div className="text-sm mb-1">
                          This is a <span className="font-bold" style={{ color: pattern.color }}>{pattern.name}</span> pattern 
                          with a <span className="font-bold" style={{ color: pattern.direction === 'Bullish' ? '#10b981' : '#ef4444' }}>
                            {pattern.direction.toLowerCase()}
                          </span> bias.
                        </div>
                        <div className="text-xs text-yellow-200 italic">
                          Look for the labeled X-A-B-C-D points on the chart.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <>
        <TVPatternChart
          data={chartData}
          title={title}
          symbol={symbol}
          height={320}
          extraSeries={[
            ...(shortMA.length > 0 ? [{ data: shortMA, color: '#FF9800', name: '50MA', width: 1.5 }] : []),
            ...(longMA.length > 0  ? [{ data: longMA,  color: '#60A5FA', name: '200MA', width: 1.5, dashed: true }] : []),
            ...(uptrendData.length > 0   ? [{ data: uptrendData.map(p=>({date:p.date,value:p.trendValue})).filter(p=>p.value!=null),   color: '#26A69A', name: 'Uptrend',   width: 1.5 }] : []),
            ...(downtrendData.length > 0 ? [{ data: downtrendData.map(p=>({date:p.date,value:p.trendValue})).filter(p=>p.value!=null), color: '#EF5350', name: 'Downtrend', width: 1.5 }] : []),
          ]}
          priceLines={[
            ...fibonacciLevels
              .filter(l => l.ratio !== 0 && l.ratio !== 1)
              .map(l => ({ value: l.price, color: '#F5C518', label: `Fib ${l.ratio}`, dashed: true })),
            ...supportLines.map((l, i) => ({
              value: l.price, color: l.hasActedAsBoth ? '#8BC34A' : '#26A69A',
              label: `S${i+1}`, width: l.reliability === 'high' ? 2 : 1, dashed: l.reliability !== 'high',
            })),
            ...resistanceLines.map((l, i) => ({
              value: l.price, color: l.hasActedAsBoth ? '#FF6B35' : '#EF5350',
              label: `R${i+1}`, width: l.reliability === 'high' ? 2 : 1, dashed: l.reliability !== 'high',
            })),
          ]}
          markers={[
            ...(hsPatterns.length > 0 ? [
              { time: hsPatterns[0].leftShoulder.date,  label: 'LS', color: '#EF5350', position: 'above' },
              { time: hsPatterns[0].head.date,          label: 'H',  color: '#EF5350', position: 'above' },
              { time: hsPatterns[0].rightShoulder.date, label: 'RS', color: '#EF5350', position: 'above' },
            ] : []),
            ...(invHsPatterns.length > 0 ? [
              { time: invHsPatterns[0].leftShoulder.date,  label: 'LS', color: '#26A69A', position: 'below' },
              { time: invHsPatterns[0].head.date,          label: 'H',  color: '#26A69A', position: 'below' },
              { time: invHsPatterns[0].rightShoulder.date, label: 'RS', color: '#26A69A', position: 'below' },
            ] : []),
            ...harmonic.flatMap(pattern => {
              const color = getHarmonicColor(pattern.type);
              return ['X','A','B','C','D']
                .filter(k => pattern.points?.[k])
                .map(k => ({
                  time: pattern.points[k].date,
                  label: k,
                  color,
                  position: ['X','B','D'].includes(k) ? 'below' : 'above',
                }));
            }),
          ]}
          slopeLines={[
            // H&S peak connector + gold neckline
            ...(hsPatterns.length > 0 ? [
              { points: [
                  { date: hsPatterns[0].leftShoulder.date,  value: hsPatterns[0].leftShoulder.value },
                  { date: hsPatterns[0].head.date,          value: hsPatterns[0].head.value },
                  { date: hsPatterns[0].rightShoulder.date, value: hsPatterns[0].rightShoulder.value },
                ], color: '#EF5350', width: 1.5, dashed: false },
              ...(necklineData.length >= 2 ? [{
                points: necklineData.map(p => ({ date: p.date, value: p.necklineValue })).filter(p => p.value != null),
                color: '#F5C518', width: 2, dashed: true,
              }] : []),
            ] : []),
            // Inv H&S peak connector + gold neckline
            ...(invHsPatterns.length > 0 ? [
              { points: [
                  { date: invHsPatterns[0].leftShoulder.date,  value: invHsPatterns[0].leftShoulder.value },
                  { date: invHsPatterns[0].head.date,          value: invHsPatterns[0].head.value },
                  { date: invHsPatterns[0].rightShoulder.date, value: invHsPatterns[0].rightShoulder.value },
                ], color: '#26A69A', width: 1.5, dashed: false },
              ...(invNecklineData.length >= 2 ? [{
                points: invNecklineData.map(p => ({ date: p.date, value: p.necklineValue })).filter(p => p.value != null),
                color: '#F5C518', width: 2, dashed: true,
              }] : []),
            ] : []),
            // Harmonic XABCD zigzag connector
            ...harmonic.map(pattern => ({
              points: ['X','A','B','C','D']
                .filter(k => pattern.points?.[k])
                .map(k => ({ date: pattern.points[k].date, value: pattern.points[k].value })),
              color: getHarmonicColor(pattern.type),
              width: 2,
              dashed: false,
            })).filter(s => s.points.length >= 2),
          ]}
        />
        {renderAnalysisSummary()}
      </>
    );
  };


  if (isLoading.long && isLoading.short && isLoading.veryShort) {
    return (
      <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-lg p-8 border-2 border-yellow-500 shadow-lg shadow-yellow-400/20">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-6">Loading pattern analysis for {symbol}...</h3>
        <div className="flex justify-center items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md bg-yellow-400 animate-pulse"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-400 relative z-10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-lg p-8 border-2 border-red-500 shadow-lg shadow-red-500/30">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-4">Error</h3>
        <p className="text-white font-medium bg-black/50 p-4 rounded-lg border border-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 p-4 rounded-lg">
      {renderChart(longTermData, analysis.long, "Pattern Analysis (200-Day)")}
      {renderChart(shortTermData, analysis.short, "Pattern Analysis (40-Day)")}
      {renderChart(veryShortTermData, analysis.veryShort, "Pattern Analysis (10-Day)")}
    </div>
  );
};

export default AdvancedPatternDetector;