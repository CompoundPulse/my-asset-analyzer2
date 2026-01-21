import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  handlePatternFetch, 
  handleShortPatternFetch, 
  handleVeryShortPatternFetch
} from './stockUtils';

import {
  findSwings,
  linearRegression,
  calculateFit,
  getTrendLineValueAtIndex,
  isWithinTolerance,
  createTrendLines,
  createTargetLines,
  enhanceChartDataWithPatternPoints
} from './patternUtils';

// This component focuses ONLY on the rectangle patterns

const detectRectanglePatterns = (data, timeframe) => {
  if (!data || data.length < 20) return []; // Need sufficient data for patterns
  
  const patterns = [];
  const swings = findSwings(data, timeframe);
  
  // Detect Rectangle Patterns
  const detectRectangles = () => {
    if (swings.length < 4) return [];
    
    const rectanglePatterns = [];
    
    // Get sequences of alternating highs and lows
    for (let startIdx = 0; startIdx < swings.length - 3; startIdx++) {
      // We need at least 2 highs and 2 lows for a rectangle
      let recPoints = swings.slice(startIdx, startIdx + Math.min(10, swings.length - startIdx));
      
      // Make sure we have alternating highs and lows
      const highs = recPoints.filter(p => p.type === 'high');
      const lows = recPoints.filter(p => p.type === 'low');
      
      if (highs.length < 2 || lows.length < 2) continue;
      
      // Calculate average highs and lows
      const avgHigh = highs.reduce((sum, p) => sum + p.value, 0) / highs.length;
      const avgLow = lows.reduce((sum, p) => sum + p.value, 0) / lows.length;
      
      // Check if highs and lows are relatively consistent (rectangle requires flat lines)
      const highVariation = highs.reduce((sum, p) => sum + Math.pow(p.value - avgHigh, 2), 0) / highs.length;
      const lowVariation = lows.reduce((sum, p) => sum + Math.pow(p.value - avgLow, 2), 0) / lows.length;
      
      // Convert to coefficient of variation
      const highCV = Math.sqrt(highVariation) / avgHigh;
      const lowCV = Math.sqrt(lowVariation) / avgLow;
      
      // Rectangle requires relatively flat lines
      if (highCV > 0.02 || lowCV > 0.02) continue;
      
      // Calculate rectangle height
      const rectangleHeight = avgHigh - avgLow;
      
      // Check if rectangle has sufficient height relative to price
      if (rectangleHeight / avgLow < 0.02) continue;
      
      // Calculate rectangle width
      const firstPoint = recPoints[0];
      const lastPoint = recPoints[recPoints.length - 1];
      const rectangleWidth = lastPoint.index - firstPoint.index;
      
      // Rectangle should be wider than tall
      if (rectangleWidth < 5) continue;
      
      // Determine if this is a bullish or bearish rectangle
      // Based on preceding trend
      let direction = "neutral";
      if (startIdx > 3) {
        const priorData = data.slice(Math.max(0, startIdx - 10), startIdx);
        const priorTrend = priorData[0].value < priorData[priorData.length - 1].value ? "bullish" : "bearish";
        direction = priorTrend === "bullish" ? "bullish" : "bearish";
      }
      
      // Calculate completion status
      const minPatternsRequired = 4; // At least 2 touches on each line
      const completion = Math.min(100, Math.round((recPoints.length / minPatternsRequired) * 100));
      
      // Determine if a breakout has occurred
      const currentPrice = data[data.length - 1].value;
      let completionStatus = "Developing";
      let target = null;
      
      if (completion >= 100) {
        if (currentPrice > avgHigh * 1.01) {
          completionStatus = "Bullish Breakout";
          target = avgHigh + rectangleHeight;
        } else if (currentPrice < avgLow * 0.99) {
          completionStatus = "Bearish Breakdown";
          target = avgLow - rectangleHeight;
        } else {
          completionStatus = "Consolidating";
        }
      }
      
      rectanglePatterns.push({
        type: direction === "bullish" ? "bullish_rectangle" : "bearish_rectangle",
        name: `${direction.charAt(0).toUpperCase() + direction.slice(1)} Rectangle`,
        description: `A ${direction} continuation pattern where price consolidates between parallel support and resistance levels before continuing in the ${direction === "bullish" ? "upward" : "downward"} direction.`,
        points: {
          highs,
          lows
        },
        lines: {
          resistance: { slope: 0, intercept: avgHigh },
          support: { slope: 0, intercept: avgLow }
        },
        upTarget: avgHigh + rectangleHeight,
        downTarget: avgLow - rectangleHeight,
        target,
        completionStatus,
        completion,
        direction,
        color: direction === "bullish" ? "#22c55e" : "#ef4444", // Green for bullish, red for bearish
        patternHeight: rectangleHeight
      });
      
      // Skip ahead to avoid overlapping rectangles
      startIdx += 3;
    }
    
    return rectanglePatterns;
  };
  
  // Detect rectangle patterns
  const rectanglePatterns = detectRectangles();
  
  // Sort patterns by completion and recency
  rectanglePatterns.sort((a, b) => {
    // First compare by completion percentage
    if (a.completion !== b.completion) {
      return b.completion - a.completion; // Higher completion first
    }
    
    return 0; // Equal priority
  });
  
  // Limit the number of patterns to avoid overloading the chart
  return rectanglePatterns.slice(0, 3);
};

const RectanglePatternDetector = ({ symbol }) => {
  const [longTermData, setLongTermData] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const [veryShortTermData, setVeryShortTermData] = useState(null);
  const [isLoading, setIsLoading] = useState({
    long: true,
    short: true,
    veryShort: true
  });
  const [error, setError] = useState(null);
  const [patterns, setPatterns] = useState({
    long: [],
    short: [],
    veryShort: []
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
    setPatterns({
      long: [],
      short: [],
      veryShort: []
    });
    setIsLoading({
      long: true,
      short: true,
      veryShort: true
    });
    
    console.log(`RectanglePatternDetector: Loading data for symbol ${symbol}`);
    setError('');
    
    // Fetch 200-day data
    handlePatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, long: state })),
      setError,
      setHistoricalData: (data) => {
        setLongTermData(data);
        if (data && data.prices) {
          const patternsFound = detectRectanglePatterns(data.prices, 'long');
          setPatterns(prev => ({
            ...prev,
            long: patternsFound
          }));
          
          console.log(`LONG-TERM: Found ${patternsFound.length} rectangle patterns`);
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
          const patternsFound = detectRectanglePatterns(data.prices, 'medium');
          setPatterns(prev => ({
            ...prev,
            short: patternsFound
          }));
          
          console.log(`MEDIUM-TERM: Found ${patternsFound.length} rectangle patterns`);
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
          const patternsFound = detectRectanglePatterns(data.prices, 'short');
          setPatterns(prev => ({
            ...prev,
            veryShort: patternsFound
          }));
          
          console.log(`SHORT-TERM: Found ${patternsFound.length} rectangle patterns`);
        }
      }
    });
  }, [symbol]); // Re-run this effect whenever symbol changes

  const renderChart = (data, chartPatterns, title) => {
    if (!data?.prices || data.prices.length === 0) {
      return (
        <div className="bg-gradient-to-br from-black via-emerald-950 to-black rounded-lg p-4 mb-6 border-2 border-emerald-400/30 shadow-lg shadow-emerald-400/10">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 mb-4">{title}</h3>
          <div className="text-emerald-200">No data available</div>
        </div>
      );
    }

    const chartData = data.prices;
    const hasPatterns = chartPatterns.length > 0;
    
    console.log(`${title}: Rendering ${chartPatterns.length} rectangle patterns`);
    
    // Add pattern information to each data point
    const enhancedChartData = enhanceChartDataWithPatternPoints(chartData, chartPatterns);

    // Get all trendlines and target lines for rendering
    const allTrendLines = chartPatterns.flatMap(pattern => createTrendLines(pattern, chartData));
    const allTargetLines = chartPatterns.flatMap(pattern => createTargetLines(pattern));
    
    // Analysis summary text
    const renderAnalysisSummary = () => {
      return (
        <div className="mt-6 text-white bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900 p-5 rounded-lg border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <div className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-400 mb-3">Rectangle Pattern Analysis for {symbol}:</div>
          
          {!hasPatterns ? (
            <div className="text-gray-400 italic px-4 py-2 bg-black/30 rounded-md">
              No rectangle patterns detected in this timeframe. Rectangle patterns require price to consolidate between horizontal support and resistance levels.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 mt-4">
              {chartPatterns.map((pattern, idx) => (
                <div 
                  key={`pattern-${idx}`} 
                  className="bg-black/50 rounded-lg overflow-hidden border-2"
                  style={{ borderColor: pattern.color }}
                >
                  <div 
                    className="p-3 text-center font-bold text-lg"
                    style={{ backgroundColor: pattern.color + '20', color: pattern.color }}
                  >
                    {pattern.name} • {pattern.direction?.toUpperCase()} • {pattern.completionStatus || `${pattern.completion}% Complete`}
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Pattern explanation */}
                    {pattern.description && (
                      <div className="text-gray-300 text-sm italic">
                        {pattern.description}
                      </div>
                    )}
                  
                    {/* Pattern details - Improved layout with better spacing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-black/30 rounded-md">
                        <div className="font-semibold mb-2 text-emerald-200 border-b border-emerald-500/20 pb-1">
                          Pattern Details
                        </div>
                        <div className="space-y-2">
                          {/* Standard terminology for pattern completion */}
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-100/80">Pattern Status:</span>
                            <span className="font-bold" style={{ color: pattern.color }}>
                              {pattern.completionStatus}
                            </span>
                          </div>
                          
                          {/* Price Target */}
                          {pattern.target && (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-100/80">Target Price:</span>
                              <span className="font-bold" style={{ color: pattern.color }}>
                                ${pattern.target.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {/* Pattern Height */}
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-100/80">Pattern Height:</span>
                            <span className="font-medium text-gray-300">
                              ${pattern.patternHeight.toFixed(2)} (${(pattern.patternHeight / data.prices[data.prices.length - 1].value * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Pattern Trading Strategy - Updated with better colors */}
                      <div className="p-3 bg-black/30 rounded-md">
                        <div className="font-semibold mb-2 text-teal-200 border-b border-teal-500/20 pb-1">
                          Trading Strategy
                        </div>
                        <div className="text-white/90 text-sm">
                          {(() => {
                            // Generate specific trading strategy based on pattern type and completion
                            const isRectBullish = pattern.type === "bullish_rectangle";
                            return <div>
                              <p className={`font-medium ${isRectBullish ? "text-green-300" : "text-red-300"} mb-1`}>Entry:</p>
                              <p>{isRectBullish ? "Long above resistance" : "Short below support"} at <span className="font-bold text-white">${isRectBullish ? pattern.lines.resistance.intercept.toFixed(2) : pattern.lines.support.intercept.toFixed(2)}</span></p>
                              <p className="font-medium text-amber-300 mt-2 mb-1">Target:</p>
                              <p><span className="font-bold text-white">${pattern.target ? pattern.target.toFixed(2) : (isRectBullish ? pattern.upTarget.toFixed(2) : pattern.downTarget.toFixed(2))}</span></p>
                              <p className="font-medium text-amber-300 mt-2 mb-1">Stop Loss:</p>
                              <p>{isRectBullish ? "Below support" : "Above resistance"} at <span className="font-bold text-white">${isRectBullish ? pattern.lines.support.intercept.toFixed(2) : pattern.lines.resistance.intercept.toFixed(2)}</span></p>
                            </div>;
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Pattern Key Points */}
                    <div className="p-3 bg-black/30 rounded-md">
                      <div className="font-semibold mb-2 text-emerald-200 border-b border-emerald-500/20 pb-1">
                        Pattern Key Points
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-md text-white font-bold bg-opacity-20 col-span-3" style={{ backgroundColor: pattern.color + '20' }}>
                          Resistance
                        </div>
                        <div className="p-1 col-span-3 font-medium text-white">
                          ${pattern.lines.resistance.intercept.toFixed(2)}
                        </div>
                        <div className="p-2 rounded-md text-white font-bold bg-opacity-20 col-span-3" style={{ backgroundColor: pattern.color + '20' }}>
                          Support
                        </div>
                        <div className="p-1 col-span-3 font-medium text-white">
                          ${pattern.lines.support.intercept.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 mt-2 bg-gradient-to-r from-black/40 via-emerald-900/20 to-black/40 rounded-md border border-white/10 flex items-center justify-between">
                      <span className="font-semibold text-white bg-clip-text" style={{ color: pattern.direction === 'bullish' ? '#4ade80' : pattern.direction === 'bearish' ? '#f87171' : '#a78bfa' }}>
                        {pattern.direction.toUpperCase()} BIAS
                      </span>
                      <span className="ml-2 text-white/80">{pattern.completion < 100 
                        ? `Watch for ${pattern.direction === 'bullish' ? 'breakout above resistance' : 'breakdown below support'} → $${pattern.target ? pattern.target.toFixed(2) : 'price target'}`
                        : `${pattern.completionStatus} - monitor for continuation`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 p-4 rounded-md bg-gradient-to-r from-emerald-900/10 to-green-900/10 border border-emerald-700/20">
            <div className="text-emerald-100 text-sm">
              <span className="text-emerald-400 font-bold">About Rectangle Patterns:</span> Rectangles form when price consolidates between two parallel horizontal levels. They represent a pause in the trend and typically lead to a continuation in the direction of the preceding trend.
              <p className="mt-2">
                The price target after a breakout is typically the height of the rectangle projected from the breakout point. Rectangle patterns are highly reliable when they form after a strong trend.
              </p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-gradient-to-br from-black via-emerald-950 to-black rounded-lg p-4 mb-6 border-2 border-emerald-400/30 shadow-lg shadow-emerald-400/10">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 mb-4">{title} - {symbol}</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enhancedChartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(16,185,129,0.7)"
                tick={{ fill: 'rgba(16,185,129,0.7)' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                interval={Math.floor(chartData.length / 7)}
                axisLine={{ stroke: 'rgba(16,185,129,0.4)' }}
              />
              <YAxis 
                stroke="rgba(16,185,129,0.7)"
                tick={{ fill: 'rgba(16,185,129,0.7)' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                domain={['auto', 'auto']}
                padding={{ top: 10, bottom: 10 }}
                axisLine={{ stroke: 'rgba(16,185,129,0.4)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  border: '2px solid rgba(16,185,129,0.6)',
                  borderRadius: '8px',
                  color: '#10b981',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [`$${parseFloat(value).toFixed(2)}`, name]}
              />
              
              {/* Main price line */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  
                  if (!payload.patternPoints || payload.patternPoints.length === 0) return null;
                  
                  // This point is a pattern point, render special marker with improved visibility
                  return payload.patternPoints.map((pp, idx) => (
                    <g key={idx}>
                      {/* Outer glow effect */}
                      <circle cx={cx} cy={cy} r={8} fill="rgba(0,0,0,0.7)" />
                      {/* Main point circle */}
                      <circle cx={cx} cy={cy} r={6} fill={pp.color} stroke="#fff" strokeWidth={1.5} />
                      {/* Label with better background for visibility */}
                      <rect 
                        x={cx - 10} 
                        y={cy - 22} 
                        width={20} 
                        height={16} 
                        fill="rgba(0,0,0,0.8)" 
                        stroke={pp.color}
                        strokeWidth={1}
                        rx={3} 
                      />
                      <text 
                        x={cx} 
                        y={cy - 11} 
                        textAnchor="middle" 
                        fill={pp.color} 
                        fontWeight="bold" 
                        fontSize={10}
                      >
                        {pp.label}
                      </text>
                    </g>
                  ));
                }}
                activeDot={{ stroke: '#ffffff', strokeWidth: 2, r: 6, fill: '#10b981' }}
                strokeWidth={2}
                name="Price"
              />
              
              {/* Render trendlines */}
              {allTrendLines.map((line, index) => {
                // Safe check to ensure chart data exists at these indexes
                const startIdx = line.points[0].index;
                const endIdx = line.points[1].index;
                
                if (startIdx < 0 || startIdx >= chartData.length || endIdx < 0 || endIdx >= chartData.length) {
                  return null; // Skip if indices are invalid
                }
                
                return (
                  <Line
                    key={`line-${index}`}
                    name={line.label}
                    data={[
                      { date: chartData[startIdx].date, value: line.points[0].value },
                      { date: chartData[endIdx].date, value: line.points[1].value }
                    ]}
                    type="linear"
                    dataKey="value"
                    stroke={line.color}
                    strokeWidth={1.5}
                    strokeDasharray={line.dashed ? "5 5" : "0"}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                );
              })}
              
              {/* Render target reference lines */}
              {allTargetLines.map((target, tIdx) => (
                <ReferenceLine
                  key={`target-${tIdx}`}
                  y={target.value}
                  stroke={target.color}
                  strokeDasharray={target.dashed ? "5 5" : "0"}
                  strokeWidth={1.5}
                  label={{
                    value: target.label,
                    position: 'right',
                    fill: target.color,
                    fontSize: 10,
                    fontWeight: 'bold',
                    backgroundColor: '#000',
                    padding: 5
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {renderAnalysisSummary()}
      </div>
    );
  };

  if (isLoading.long && isLoading.short && isLoading.veryShort) {
    return (
      <div className="bg-gradient-to-br from-black via-emerald-950 to-black rounded-lg p-8 border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 mb-6">Loading rectangle patterns for {symbol}...</h3>
        <div className="flex justify-center items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md bg-emerald-400 animate-pulse"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-emerald-400 relative z-10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-black via-emerald-950 to-black rounded-lg p-8 border-2 border-red-500 shadow-lg shadow-red-500/30">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-4">Error</h3>
        <p className="text-white font-medium bg-black/50 p-4 rounded-lg border border-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-950 p-4 rounded-lg">
      {renderChart(longTermData, patterns.long, "Rectangle Patterns (200-Day)")}
      {renderChart(shortTermData, patterns.short, "Rectangle Patterns (40-Day)")}
      {renderChart(veryShortTermData, patterns.veryShort, "Rectangle Patterns (10-Day)")}
    </div>
  );
};

export default RectanglePatternDetector;