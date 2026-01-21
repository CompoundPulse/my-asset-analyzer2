// Updated ChartPatternVisualizer with fixed rendering
import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';
import { 
  handlePatternFetch, 
  handleShortPatternFetch, 
  handleVeryShortPatternFetch
} from './stockUtils';
import { detectChartPatterns, ensureCorrectDateRange, getTrendLineValueAtIndex } from './patternDetection';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  TimeScale,
  annotationPlugin
);

const ChartPatternVisualizer = ({ symbol }) => {
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
  
  // Create refs for charts to handle proper destruction
  const longTermChartRef = useRef(null);
  const shortTermChartRef = useRef(null);
  const veryShortTermChartRef = useRef(null);

  // Data fetching
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
    
    console.log(`ChartPatternVisualizer: Loading data for symbol ${symbol}`);
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
  }, [symbol]);

  // Pattern detection for long-term data
  useEffect(() => {
    if (longTermData && longTermData.prices && longTermData.prices.length > 0) {
      console.log("Processing long-term data:", longTermData.prices.length, "data points");
      try {
        // Apply date range filtering to ensure exactly 200 days
        const timeframeAdjustedData = ensureCorrectDateRange(longTermData, 200);
        console.log("Adjusted long-term data:", timeframeAdjustedData.prices.length, "data points");
        
        const patternsFound = detectChartPatterns(timeframeAdjustedData.prices, 'long');
        setLongTermData(timeframeAdjustedData); // Update with filtered data
        setPatterns(prev => ({
          ...prev,
          long: patternsFound
        }));
        console.log(`LONG-TERM: Found ${patternsFound.length} patterns`);
      } catch (err) {
        console.error("Error detecting long-term patterns:", err);
      }
    }
  }, [longTermData]);

  // Pattern detection for medium-term data
  useEffect(() => {
    if (shortTermData && shortTermData.prices && shortTermData.prices.length > 0) {
      console.log("Processing medium-term data:", shortTermData.prices.length, "data points");
      try {
        // Apply date range filtering to ensure exactly 40 days
        const timeframeAdjustedData = ensureCorrectDateRange(shortTermData, 40);
        console.log("Adjusted medium-term data:", timeframeAdjustedData.prices.length, "data points");
        
        const patternsFound = detectChartPatterns(timeframeAdjustedData.prices, 'medium');
        setShortTermData(timeframeAdjustedData); // Update with filtered data
        setPatterns(prev => ({
          ...prev,
          short: patternsFound
        }));
        console.log(`MEDIUM-TERM: Found ${patternsFound.length} patterns`);
      } catch (err) {
        console.error("Error detecting medium-term patterns:", err);
      }
    }
  }, [shortTermData]);

  // Pattern detection for short-term data
  useEffect(() => {
    if (veryShortTermData && veryShortTermData.prices && veryShortTermData.prices.length > 0) {
      console.log("Processing short-term data:", veryShortTermData.prices.length, "data points");
      try {
        // Apply date range filtering to ensure exactly 10 days
        const timeframeAdjustedData = ensureCorrectDateRange(veryShortTermData, 10);
        console.log("Adjusted short-term data:", timeframeAdjustedData.prices.length, "data points");
        
        const patternsFound = detectChartPatterns(timeframeAdjustedData.prices, 'short');
        setVeryShortTermData(timeframeAdjustedData); // Update with filtered data
        setPatterns(prev => ({
          ...prev,
          veryShort: patternsFound
        }));
        console.log(`SHORT-TERM: Found ${patternsFound.length} patterns`);
      } catch (err) {
        console.error("Error detecting short-term patterns:", err);
      }
    }
  }, [veryShortTermData]);

  // Analysis content (pattern information display)
  const analysisContent = (chartPatterns) => {
    if (!chartPatterns || chartPatterns.length === 0) {
      return (
        <div className="mt-4 text-white bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-5 rounded-lg border-2 border-amber-500/30">
          <div className="font-bold text-xl text-amber-300 mb-2">Chart Pattern Analysis for {symbol}:</div>
          <div className="text-gray-400 italic px-4 py-2 bg-black/30 rounded-md">
            No chart patterns detected in this timeframe.
          </div>
        </div>
      );
    }
    
    return (
      <div className="mt-4 text-white bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-5 rounded-lg border-2 border-amber-500/30">
        <div className="font-bold text-xl text-amber-300 mb-2">Chart Pattern Analysis for {symbol}:</div>
        
        <div className="grid grid-cols-1 gap-3 mt-2">
          {chartPatterns.map((pattern, idx) => {
            // Determine the most relevant price for the pattern based on pattern type
            let patternPrice = 0;
            let priceLabel = "";
            
            // Extract the most relevant price point and date based on pattern type
            let patternDate = null;
            
            if (pattern.type.includes('head_and_shoulders')) {
              if (pattern.type === 'head_and_shoulders') {
                patternPrice = pattern.points.head?.value || 0;
                patternDate = pattern.points.head?.date;
                priceLabel = "Head";
              } else { // inverse head and shoulders
                patternPrice = pattern.points.head?.value || 0;
                patternDate = pattern.points.head?.date;
                priceLabel = "Head";
              }
            } else if (pattern.type.includes('double_top')) {
              patternPrice = pattern.points.secondPeak?.value || 0;
              patternDate = pattern.points.secondPeak?.date;
              priceLabel = "Second Peak";
            } else if (pattern.type.includes('double_bottom')) {
              patternPrice = pattern.points.secondTrough?.value || 0;
              patternDate = pattern.points.secondTrough?.date;
              priceLabel = "Second Trough";
            } else if (pattern.type.includes('triangle')) {
              // For triangles, use the midpoint of recent high and low
              const highs = pattern.points.highs || [];
              const lows = pattern.points.lows || [];
              if (highs.length > 0 && lows.length > 0) {
                const latestHigh = highs[highs.length - 1];
                const latestLow = lows[lows.length - 1];
                patternPrice = (latestHigh.value + latestLow.value) / 2;
                // Use the more recent date between the latest high and low
                patternDate = new Date(latestHigh.date) > new Date(latestLow.date) ? 
                  latestHigh.date : latestLow.date;
                priceLabel = "Current Zone";
              }
            } else if (pattern.type.includes('rectangle')) {
              // For rectangles, use the midpoint of resistance and support
              // And the most recent point's date
              if (pattern.lines.resistance && pattern.lines.support) {
                patternPrice = (pattern.lines.resistance.intercept + pattern.lines.support.intercept) / 2;
                
                // Get the most recent point's date
                const allPoints = [...(pattern.points.highs || []), ...(pattern.points.lows || [])];
                if (allPoints.length > 0) {
                  const sortedPoints = [...allPoints].sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                  );
                  patternDate = sortedPoints[0].date;
                }
                
                priceLabel = "Rectangle Middle";
              }
            } else if (pattern.type.includes('wedge')) {
              // For wedges, use the midpoint of recent high and low
              const highs = pattern.points.highs || [];
              const lows = pattern.points.lows || [];
              if (highs.length > 0 && lows.length > 0) {
                const latestHigh = highs[highs.length - 1];
                const latestLow = lows[lows.length - 1];
                patternPrice = (latestHigh.value + latestLow.value) / 2;
                // Use the more recent date between the latest high and low
                patternDate = new Date(latestHigh.date) > new Date(latestLow.date) ? 
                  latestHigh.date : latestLow.date;
                priceLabel = "Current Zone";
              }
            } else if (pattern.type.includes('pennant')) {
              // For pennants, use the mast end if available
              patternPrice = pattern.points.mastEnd?.value || 0;
              patternDate = pattern.points.mastEnd?.date;
              priceLabel = "Mast End";
            }
            
            // Format the price and date for display
            const priceDisplay = patternPrice ? `${patternPrice.toFixed(2)}` : '';
            
            // Format date if available
            const dateDisplay = patternDate ? new Date(patternDate).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric'
            }) : '';
            
            // Additional key price points for the detail section
            const keyPricePoints = [];
            
            // Function to add a price point with date
            const addPricePoint = (label, point) => {
              if (!point) return;
              
              const formattedDate = point.date ? new Date(point.date).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
              }) : '';
              
              keyPricePoints.push({
                label,
                value: point.value,
                date: formattedDate
              });
            };
            
            if (pattern.type.includes('head_and_shoulders')) {
              addPricePoint("Head", pattern.points.head);
              addPricePoint("Left Shoulder", pattern.points.leftShoulder);
              addPricePoint("Right Shoulder", pattern.points.rightShoulder);
              if (pattern.lines.neckline) keyPricePoints.push({ label: "Neckline", value: pattern.lines.neckline.intercept });
            } else if (pattern.type.includes('double_top')) {
              addPricePoint("First Peak", pattern.points.firstPeak);
              addPricePoint("Second Peak", pattern.points.secondPeak);
              addPricePoint("Trough", pattern.points.trough);
            } else if (pattern.type.includes('double_bottom')) {
              addPricePoint("First Trough", pattern.points.firstTrough);
              addPricePoint("Second Trough", pattern.points.secondTrough);
              addPricePoint("Peak", pattern.points.peak);
            } else if (pattern.type.includes('triangle') || pattern.type.includes('wedge')) {
              const highs = pattern.points.highs || [];
              const lows = pattern.points.lows || [];
              if (highs.length > 0) addPricePoint("Latest High", highs[highs.length - 1]);
              if (lows.length > 0) addPricePoint("Latest Low", lows[lows.length - 1]);
              if (pattern.points.apex) {
                // Apex doesn't usually have a date, so add it differently
                keyPricePoints.push({ label: "Apex", value: pattern.points.apex.value });
              }
            } else if (pattern.type.includes('rectangle')) {
              if (pattern.lines.resistance) keyPricePoints.push({ label: "Resistance", value: pattern.lines.resistance.intercept });
              if (pattern.lines.support) keyPricePoints.push({ label: "Support", value: pattern.lines.support.intercept });
              
              // Add the most recent high and low points with dates
              const highs = pattern.points.highs || [];
              const lows = pattern.points.lows || [];
              if (highs.length > 0) addPricePoint("Latest Resistance Touch", highs[highs.length - 1]);
              if (lows.length > 0) addPricePoint("Latest Support Touch", lows[lows.length - 1]);
            } else if (pattern.type.includes('pennant')) {
              addPricePoint("Mast Start", pattern.points.mastStart);
              addPricePoint("Mast End", pattern.points.mastEnd);
              if (pattern.points.apex) {
                // Apex doesn't usually have a date, so add it differently
                keyPricePoints.push({ label: "Apex", value: pattern.points.apex.value });
              }
            }
            
            return (
              <div 
                key={`pattern-${idx}`} 
                className="bg-black/50 rounded-lg overflow-hidden border-2"
                style={{ borderColor: pattern.color }}
              >
                <div 
                  className="p-2 text-center font-bold"
                  style={{ 
                    backgroundColor: pattern.color + '20', 
                    color: pattern.color,
                    cursor: 'pointer'
                  }}
                >
                  {pattern.name} {priceDisplay && `(${priceDisplay}${dateDisplay ? ` - ${dateDisplay}` : ''})`} • {pattern.direction?.toUpperCase()} • {pattern.completionStatus || `${pattern.completion}% Complete`}
                </div>
                
                <div className="p-3">
                  {pattern.description && (
                    <div className="text-gray-300 text-sm italic mb-2">
                      {pattern.description}
                    </div>
                  )}
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-2 bg-black/30 rounded-md">
                      <div className="font-semibold mb-1 text-amber-200">
                        Pattern Details
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-amber-100/80">Status:</span>
                          <span className="font-bold" style={{ color: pattern.color }}>
                            {pattern.completionStatus}
                          </span>
                        </div>
                        
                        {/* Show Key Price Points */}
                        {keyPricePoints.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="text-amber-100/80 mb-1">Key Price Levels:</div>
                            {keyPricePoints.map((point, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-amber-100/60">{point.label}:</span>
                                <span className="font-bold" style={{ color: pattern.color }}>
                                  ${point.value.toFixed(2)} {point.date && 
                                    <span className="font-normal text-xs ml-1 text-amber-100/40">
                                      ({point.date})
                                    </span>
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {pattern.target && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="flex justify-between">
                              <span className="text-amber-100/80">Target:</span>
                              <span className="font-bold" style={{ color: pattern.color }}>
                                ${pattern.target.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-2 bg-black/30 rounded-md">
                      <div className="font-semibold mb-1 text-orange-200">
                        Trading Strategy
                      </div>
                      <div className="text-white/90 text-sm">
                        {pattern.direction === "bullish" ? (
                          <div className="text-green-300">
                            Look for confirmation and potential long entry
                          </div>
                        ) : pattern.direction === "bearish" ? (
                          <div className="text-red-300">
                            Watch for confirmation and potential short entry
                          </div>
                        ) : (
                          <div className="text-purple-300">
                            Monitor for breakout direction
                          </div>
                        )}
                        
                        {pattern.patternHeight && (
                          <div className="mt-2 text-amber-200">
                            Pattern Height: ${pattern.patternHeight.toFixed(2)} ({(pattern.patternHeight / patternPrice * 100).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Chart.js rendering function with proper variable scope
const renderChart = (data, chartPatterns, title, chartRef) => {
  if (!data?.prices || data.prices.length === 0) {
    return (
      <div className="bg-gradient-to-br from-black via-slate-800 to-gray-900 rounded-lg p-4 mb-6 border-2 border-orange-400/30 shadow-lg shadow-orange-400/10">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-400 mb-4">{title}</h3>
        <div className="text-orange-200">No data available</div>
      </div>
    );
  }

  const chartData = data.prices;
  const hasPatterns = chartPatterns && chartPatterns.length > 0;
  
  // Calculate min and max values for Y-axis scaling
  const priceValues = chartData.map(d => d.value);
  const dataMin = Math.min(...priceValues);
  const dataMax = Math.max(...priceValues);
  const padding = (dataMax - dataMin) * 0.1; // 10% padding

  // Define valid y-range to filter out outliers - FIXED: Define these variables at the correct scope
  const validYMin = dataMin - (padding * 2);
  const validYMax = dataMax + (padding * 2);
  
  const isValidDataPoint = (value) => {
    return value !== null && !isNaN(value) && isFinite(value) && 
           value >= validYMin && value <= validYMax;
  };

  // Format dates for x-axis labels
  const formattedDates = chartData.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // Create datasets
  const datasets = [
    {
      label: 'Price',
      data: chartData.map(d => d.value),
      borderColor: '#ffa94d',
      backgroundColor: 'rgba(255, 169, 77, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#ffa94d',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      tension: 0.1,
      fill: false
    }
  ];

  // Add pattern visualizations - using simpler approach for better stability
  if (hasPatterns) {
    // Add key pattern points
    chartPatterns.forEach((pattern, patternIdx) => {
      // Extract all points from this pattern
      const allPoints = [];
      
      // Helper function to add points from a point collection
      const addPatternPoints = (pointsArray, type) => {
        if (!pointsArray || !Array.isArray(pointsArray)) return;
        pointsArray.forEach(point => {
          if (point && point.index >= 0 && point.index < chartData.length && 
              isValidDataPoint(point.value)) {
            allPoints.push({
              index: point.index,
              value: point.value,
              type: type
            });
          }
        });
      };
      
      // Helper to add a single point
      const addSinglePoint = (point, type) => {
        if (point && point.index >= 0 && point.index < chartData.length && 
            isValidDataPoint(point.value)) {
          allPoints.push({
            index: point.index,
            value: point.value,
            type: type
          });
        }
      };
      
      // Add individual points from patterns
      if (pattern.type.includes('head_and_shoulders')) {
        addSinglePoint(pattern.points.head, 'Head');
        addSinglePoint(pattern.points.leftShoulder, 'Left Shoulder');
        addSinglePoint(pattern.points.rightShoulder, 'Right Shoulder');
        addSinglePoint(pattern.points.leftTrough, 'Left Trough');
        addSinglePoint(pattern.points.rightTrough, 'Right Trough');
      } 
      else if (pattern.type.includes('double_top') || pattern.type.includes('double_bottom')) {
        addSinglePoint(pattern.points.firstPeak, 'First Peak');
        addSinglePoint(pattern.points.secondPeak, 'Second Peak');
        addSinglePoint(pattern.points.trough, 'Trough');
        addSinglePoint(pattern.points.firstTrough, 'First Trough');
        addSinglePoint(pattern.points.secondTrough, 'Second Trough');
        addSinglePoint(pattern.points.peak, 'Peak');
      }
      else if (pattern.type.includes('triangle') || pattern.type.includes('wedge')) {
        addPatternPoints(pattern.points.highs, 'High');
        addPatternPoints(pattern.points.lows, 'Low');
      }
      else if (pattern.type.includes('rectangle')) {
        addPatternPoints(pattern.points.highs, 'Resistance');
        addPatternPoints(pattern.points.lows, 'Support');
      }
      else if (pattern.type.includes('pennant')) {
        addSinglePoint(pattern.points.mastStart, 'Mast Start');
        addSinglePoint(pattern.points.mastEnd, 'Mast End');
        addPatternPoints(pattern.points.highs, 'High');
        addPatternPoints(pattern.points.lows, 'Low');
      }
      
      // Create a sparse array for pattern points
      if (allPoints.length > 0) {
        // Create point datasets
        const pointData = Array(chartData.length).fill(null);
        allPoints.forEach(point => {
          if (point.index >= 0 && point.index < pointData.length) {
            pointData[point.index] = point.value;
          }
        });
        
        // Add the dataset
        datasets.push({
          label: `${pattern.name} Points`,
          data: pointData,
          borderColor: 'transparent',
          backgroundColor: pattern.color,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointStyle: 'circle',
          showLine: false,
          // Store pattern information on the dataset for tooltip
          patternInfo: {
            name: pattern.name,
            direction: pattern.direction,
            target: pattern.target,
            points: allPoints
          }
        });
      }
      
      // Add trendlines for patterns with lines
      if (pattern.lines) {
        // Helper function to create trendline data
        const createTrendlineData = (line, label) => {
          if (!line || line.slope === undefined || line.intercept === undefined) return;
          
          const lineData = Array(chartData.length).fill(null);
          for (let i = 0; i < chartData.length; i++) {
            const value = line.slope * i + line.intercept;
            if (isValidDataPoint(value)) {
              lineData[i] = value;
            }
          }
          
          // Only add the line dataset if there are valid points
          if (lineData.some(v => v !== null)) {
            datasets.push({
              label: `${pattern.name} ${label}`,
              data: lineData,
              borderColor: pattern.color,
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [5, 5],
              pointRadius: 0,
              tension: 0,
              fill: false,
              patternInfo: {
                name: pattern.name,
                lineType: label,
                direction: pattern.direction,
                target: pattern.target
              }
            });
          }
        };
        
        // Add specific trendlines based on pattern type
        if (pattern.lines.resistance) createTrendlineData(pattern.lines.resistance, 'Resistance');
        if (pattern.lines.support) createTrendlineData(pattern.lines.support, 'Support');
        if (pattern.lines.neckline) createTrendlineData(pattern.lines.neckline, 'Neckline');
      }
    });
  }

  // Configure Chart.js options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        labels: formattedDates,
        grid: {
          color: 'rgba(255,170,60,0.1)'
        },
        ticks: {
          color: 'rgba(255,170,60,0.7)',
          maxRotation: title.includes("200-Day") ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        min: dataMin - padding,
        max: dataMax + padding,
        grid: {
          color: 'rgba(255,170,60,0.1)'
        },
        ticks: {
          color: 'rgba(255,170,60,0.7)',
          callback: (value) => `$${value.toFixed(2)}`
        }
      }
    },
    interaction: {
      mode: 'nearest',  // Only trigger for the nearest item
      intersect: true,  // Only trigger when directly hovering over a point
      axis: 'xy'        // Consider both x and y dimensions for "nearest"
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderWidth: 2,
        cornerRadius: 6,
        padding: 12,
        callbacks: {
          title: (ctx) => {
            if (ctx.length === 0) return '';
            
            if (ctx[0].dataIndex >= 0 && ctx[0].dataIndex < chartData.length) {
              return new Date(chartData[ctx[0].dataIndex].date).toLocaleDateString();
            }
            return '';
          },
          label: (ctx) => {
            if (ctx.raw === null) return null;
            
            // Price data tooltip
            if (ctx.datasetIndex === 0) {
              return `Price: $${ctx.raw.toFixed(2)}`;
            }
            
            // Pattern point tooltip
            if (ctx.dataset.label.includes('Points') && ctx.dataset.patternInfo) {
              const patternInfo = ctx.dataset.patternInfo;
              
              // Find the specific point information
              const pointInfo = patternInfo.points.find(p => 
                p.index === ctx.dataIndex && Math.abs(p.value - ctx.raw) < 0.001
              );
              
              if (pointInfo) {
                return [
                  `${patternInfo.name} (${patternInfo.direction?.toUpperCase() || 'PATTERN'})`,
                  `${pointInfo.type}: $${ctx.raw.toFixed(2)}`,
                  patternInfo.target ? `Target: $${patternInfo.target.toFixed(2)}` : ''
                ].filter(line => line); // Remove empty lines
              }
              
              return `${patternInfo.name} Point: $${ctx.raw.toFixed(2)}`;
            }
            
            // Trendline tooltip
            if (ctx.dataset.patternInfo) {
              const lineInfo = ctx.dataset.patternInfo;
              return [
                `${lineInfo.name} (${lineInfo.direction?.toUpperCase() || 'PATTERN'})`,
                `${lineInfo.lineType}: $${ctx.raw.toFixed(2)}`,
                lineInfo.target ? `Target: $${lineInfo.target.toFixed(2)}` : ''
              ].filter(line => line); // Remove empty lines
            }
            
            // Fallback tooltip
            return `${ctx.dataset.label}: $${ctx.raw.toFixed(2)}`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  // Add target price annotations if they exist
  if (hasPatterns) {
    options.plugins.annotation = {
      annotations: {}
    };
    
    chartPatterns.forEach((pattern, idx) => {
      if (pattern.target && !isNaN(pattern.target) && 
          pattern.target >= validYMin && pattern.target <= validYMax) {
        options.plugins.annotation[`target-${idx}`] = {
          type: 'line',
          yMin: pattern.target,
          yMax: pattern.target,
          borderColor: pattern.color,
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            content: `Target: $${pattern.target.toFixed(2)}`,
            position: 'end',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: pattern.color,
            font: {
              size: 10,
              weight: 'bold'
            }
          }
        };
      }
    });
  }

  return (
    <div className="bg-gradient-to-br from-black via-slate-800 to-gray-900 rounded-lg p-4 mb-6 border-2 border-amber-500/30 shadow-lg shadow-amber-400/10">
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-4">{title} - {symbol}</h3>
      <div className="h-96">
        <Line 
          ref={chartRef}
          data={{
            labels: formattedDates,
            datasets
          }}
          options={options}
          id={`chart-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
        />
      </div>
      
      {analysisContent(chartPatterns)}
    </div>
  );
};

  if (isLoading.long && isLoading.short && isLoading.veryShort) {
    return (
      <div className="bg-gradient-to-br from-black via-slate-800 to-gray-900 rounded-lg p-8 border-2 border-amber-500/30 shadow-lg shadow-amber-500/10">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-6">Loading chart pattern analysis for {symbol}...</h3>
        <div className="flex justify-center items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md bg-amber-400 animate-pulse"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-amber-400 relative z-10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-black via-slate-800 to-gray-900 rounded-lg p-8 border-2 border-red-500 shadow-lg shadow-red-500/30">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-4">Error</h3>
        <p className="text-white font-medium bg-black/50 p-4 rounded-lg border border-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-4 rounded-lg">
      {renderChart(longTermData, patterns.long, "Chart Patterns (200-Day)", longTermChartRef)}
      {renderChart(shortTermData, patterns.short, "Chart Patterns (40-Day)", shortTermChartRef)}
      {renderChart(veryShortTermData, patterns.veryShort, "Chart Patterns (10-Day)", veryShortTermChartRef)}
    </div>
  );
};

export default ChartPatternVisualizer;