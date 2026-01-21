import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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
    
    const patterns = [];
    const prices = data.prices.map(d => d.value);
    
    // Find local maxima
    const peaks = [];
    for (let i = 2; i < prices.length - 2; i++) {
      if (prices[i] > prices[i-1] && 
          prices[i] > prices[i-2] &&
          prices[i] > prices[i+1] &&
          prices[i] > prices[i+2]) {
        peaks.push({ 
          price: prices[i], 
          index: i,
          date: data.prices[i].date
        });
      }
    }
    
    // Look for head and shoulders pattern
    for (let i = 0; i < peaks.length - 2; i++) {
      const leftShoulder = peaks[i];
      const head = peaks[i + 1];
      const rightShoulder = peaks[i + 2];
      
      if (head.price > leftShoulder.price && 
          head.price > rightShoulder.price &&
          Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.05) {
        patterns.push({
          leftShoulder,
          head,
          rightShoulder
        });
      }
    }
    
    return patterns;
  };

  const renderChart = (data, title) => {
    if (!data?.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      return (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-200 mb-4">{title}</h3>
          <div>No data available</div>
        </div>
      );
    }

    const patterns = detectPatterns(data);

    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-200 mb-4">{title} - {symbol}</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.prices}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                interval={Math.floor(data.prices.length / 5)}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(26,26,26,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4ade80" 
                dot={false} 
                strokeWidth={2}
              />
              {patterns.map((pattern, i) => (
                <React.Fragment key={i}>
                  <ReferenceLine
                    x={pattern.leftShoulder.date}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    label={{
                      value: 'LS',
                      position: 'top',
                      fill: "#22c55e"
                    }}
                  />
                  <ReferenceLine
                    x={pattern.head.date}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    label={{
                      value: 'H',
                      position: 'top',
                      fill: "#22c55e"
                    }}
                  />
                  <ReferenceLine
                    x={pattern.rightShoulder.date}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    label={{
                      value: 'RS',
                      position: 'top',
                      fill: "#22c55e"
                    }}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {patterns.length === 0 && (
          <div className="mt-4 text-gray-400">
            No head and shoulders patterns detected in this timeframe
          </div>
        )}
        {patterns.length > 0 && (
          <div className="mt-4 text-white">
            <div className="font-semibold">Head and Shoulders Pattern Detected!</div>
            <div className="text-sm text-gray-300 mt-2">
              This classic reversal pattern suggests a potential trend change.
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading.long && isLoading.short && isLoading.veryShort) {
    return <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-200 mb-4">Loading pattern analysis for {symbol}...</h3>
    </div>;
  }

  if (error) {
    return <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-200 mb-4">Error: {error}</h3>
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