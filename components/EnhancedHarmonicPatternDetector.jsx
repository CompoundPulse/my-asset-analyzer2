import React, { useState, useEffect } from 'react';
// recharts replaced by TVPatternChart
import TVPatternChart from './TVPatternChart';
import { 
  handlePatternFetch, 
  handleShortPatternFetch, 
  handleVeryShortPatternFetch
} from './stockUtils';
import { chartPatternAnalysisWithHarmonics } from './chartPatternAnalysis';

// Helper function to detect harmonic patterns across the entire chart
const detectHarmonicPatterns = (data, timeframe) => {
  if (!data || data.length < 5) return [];
  
  // Find swing highs and lows
  const findSwings = (priceData) => {
    if (!priceData || priceData.length < 5) return [];
    
    const prices = priceData.map(d => d.value);
    const swings = [];
    
    // Use more relaxed criteria for shorter timeframes
    let windowSize = 2; // Default window size
    
    // For shorter timeframes, use smaller windows to catch more recent movements
    if (timeframe === 'short') {
      windowSize = 1; // Smaller window for short timeframe
    }
    
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      // Local high (peak)
      let isHigh = true;
      for (let j = 1; j <= windowSize; j++) {
        if (prices[i] <= prices[i-j] || prices[i] <= prices[i+j]) {
          isHigh = false;
          break;
        }
      }
      
      if (isHigh) {
        swings.push({
          index: i,
          date: priceData[i].date,
          value: prices[i],
          type: 'high'
        });
      }
      
      // Local low (trough)
      let isLow = true;
      for (let j = 1; j <= windowSize; j++) {
        if (prices[i] >= prices[i-j] || prices[i] >= prices[i+j]) {
          isLow = false;
          break;
        }
      }
      
      if (isLow) {
        swings.push({
          index: i,
          date: priceData[i].date,
          value: prices[i],
          type: 'low'
        });
      }
    }
    
    // Sort chronologically by index
    return swings.sort((a, b) => a.index - b.index);
  };
  
  // Helper to check if ratio is close to target
  const isCloseToRatio = (actual, target, tolerance = 0.15) => {
    return Math.abs(actual - target) <= tolerance;
  };
  
  // Define pattern templates with their expected ratios
  const patternTemplates = [
    {
      name: "Gartley",
      expectedRatios: {
        abXa: 0.618,
        bcAb: 0.382, // Alternative: 0.886
        cdBc: 1.272, // Alternative: 1.618 if BC/AB is 0.886
        xdXa: 0.786
      },
      description: "The Gartley pattern, first identified by H.M. Gartley, is a harmonic reversal pattern using the Fibonacci sequence to identify potential reversal points.",
      color: '#d946ef' // Fuchsia
    },
    {
      name: "Butterfly",
      expectedRatios: {
        abXa: 0.786,
        bcAb: 0.382, // Alternative: 0.886
        cdBc: 1.618, // Alternative: 2.618 if BC/AB is 0.886
        xdXa: 1.27   // Alternative: 1.618
      },
      description: "The Butterfly pattern involves a 1.27 or 1.618 extension of the XA leg, creating a larger reversal pattern than the Gartley.",
      color: '#2dd4bf' // Teal
    },
    {
      name: "Bat",
      expectedRatios: {
        abXa: 0.5,    // Alternative: 0.382
        bcAb: 0.382,  // Alternative: 0.886
        cdBc: 1.618,  // Alternative: 2.618 if BC/AB is 0.886
        xdXa: 0.886
      },
      description: "The Bat pattern is characterized by its 0.886 XD/XA ratio, forming a moderately deep retracement pattern.",
      color: '#fb923c' // Orange
    },
    {
      name: "Crab",
      expectedRatios: {
        abXa: 0.382,  // Alternative: 0.618
        bcAb: 0.382,  // Alternative: 0.886
        cdBc: 2.24,   // Alternative: 3.618 if BC/AB is 0.886
        xdXa: 1.618
      },
      description: "The Crab pattern is known for its extreme 1.618 XD/XA retracement, often creating powerful reversal opportunities.",
      color: '#4ade80' // Green
    }
  ];
  
  const patterns = [];
  const swings = findSwings(data);
  
  // Find patterns throughout the chart
  
  // First scan forward for established patterns
  for (let i = 0; i < swings.length - 4; i++) {
    const pointX = swings[i];
    const pointA = swings[i+1];
    const pointB = swings[i+2];
    const pointC = swings[i+3];
    const pointD = swings[i+4];
    
    // Check for alternating pattern
    if (pointX.type === pointA.type || 
        pointA.type === pointB.type || 
        pointB.type === pointC.type || 
        pointC.type === pointD.type) {
      continue;
    }
    
    // Calculate distances and ratios
    const xaDistance = Math.abs(pointA.value - pointX.value);
    const abDistance = Math.abs(pointB.value - pointA.value);
    const bcDistance = Math.abs(pointC.value - pointB.value);
    const cdDistance = Math.abs(pointD.value - pointC.value);
    const xdDistance = Math.abs(pointD.value - pointX.value);
    
    const abXaRatio = abDistance / xaDistance;
    const bcAbRatio = bcDistance / abDistance;
    const cdBcRatio = cdDistance / bcDistance;
    const xdXaRatio = xdDistance / xaDistance;
    
    const direction = pointA.type === 'high' ? 'bearish' : 'bullish';
    
    // Look for matching harmonic patterns
    patternTemplates.forEach(pattern => {
      // Check ratio relationships
      if (isCloseToRatio(abXaRatio, pattern.expectedRatios.abXa) &&
          isCloseToRatio(bcAbRatio, pattern.expectedRatios.bcAb) &&
          isCloseToRatio(cdBcRatio, pattern.expectedRatios.cdBc) &&
          isCloseToRatio(xdXaRatio, pattern.expectedRatios.xdXa)) {
        
        patterns.push({
          type: `${direction}_${pattern.name.toLowerCase()}`,
          name: pattern.name,
          description: pattern.description,
          completionStatus: "Complete pattern",
          points: { X: pointX, A: pointA, B: pointB, C: pointC, D: pointD },
          completion: 100,
          ratios: {
            AB_XA: abXaRatio,
            BC_AB: bcAbRatio,
            CD_BC: cdBcRatio,
            XD_XA: xdXaRatio
          },
          direction,
          color: pattern.color,
          expectedRatios: pattern.expectedRatios
        });
      }
    });
  }
  
  // Then scan from recent data backward to find developing patterns
  for (let i = swings.length - 2; i >= 0; i--) {
    const pointX = swings[i];
    const pointA = swings[i+1];
    
    if (pointX.type === pointA.type) continue;
    
    const xaDistance = Math.abs(pointA.value - pointX.value);
    const direction = pointA.type === 'high' ? 'bearish' : 'bullish';
    
    // Calculate potential B targets based on XA and common ratios
    const potentialBTargets = patternTemplates.map(pattern => {
      const targetBValue = pointA.type === 'high'
        ? pointA.value - xaDistance * pattern.expectedRatios.abXa // Bearish case
        : pointA.value + xaDistance * pattern.expectedRatios.abXa; // Bullish case
      
      return {
        name: pattern.name,
        ratio: pattern.expectedRatios.abXa,
        value: targetBValue,
        color: pattern.color
      };
    });
    
    // Early X-A pattern with B targets
    if (i + 1 >= swings.length - 1) {
      patterns.push({
        type: `early_${direction}_harmonic`,
        name: "Potential Harmonic",
        description: "Early stage potential harmonic pattern. X-A points established, watching for point B formation.",
        completionStatus: "X-A formed (40% complete)",
        points: { X: pointX, A: pointA },
        bTargets: potentialBTargets,
        completion: 40,
        direction,
        color: '#a78bfa', // Default purple
      });
      continue;
    }
    
    // Check for X-A-B pattern
    const pointB = swings[i+2];
    
    if (pointA.type === pointB.type) continue;
    
    const abDistance = Math.abs(pointB.value - pointA.value);
    const abXaRatio = abDistance / xaDistance;
    
    // Find potential pattern matches based on AB/XA ratio
    const matchingAbPatterns = patternTemplates.filter(pattern => 
      isCloseToRatio(abXaRatio, pattern.expectedRatios.abXa)
    );
    
    // Calculate potential C targets based on XA, AB and common ratios
    const potentialCTargets = matchingAbPatterns.map(pattern => {
      const bcDistance = abDistance * pattern.expectedRatios.bcAb;
      const targetCValue = pointB.type === 'high'
        ? pointB.value - bcDistance // Bearish case
        : pointB.value + bcDistance; // Bullish case
      
      return {
        name: pattern.name,
        ratio: pattern.expectedRatios.bcAb,
        value: targetCValue,
        color: pattern.color
      };
    });
    
    if (matchingAbPatterns.length > 0 && i + 2 >= swings.length - 1) {
      // We have a potential X-A-B with matching ratios but no C yet
      patterns.push({
        type: `developing_${direction}_harmonic`,
        name: "Developing Harmonic",
        description: "A developing harmonic pattern with proper X-A-B ratios. Requires further price action to confirm.",
        completionStatus: "X-A-B formed (60% complete)",
        points: { X: pointX, A: pointA, B: pointB },
        cTargets: potentialCTargets,
        completion: 60,
        ratios: { AB_XA: abXaRatio },
        direction,
        color: matchingAbPatterns[0].color,
        expectedRatios: { abXa: matchingAbPatterns[0].expectedRatios.abXa }
      });
      continue;
    }
    
    // Check for X-A-B-C pattern
    if (i + 3 < swings.length) {
      const pointC = swings[i+3];
      
      if (pointB.type === pointC.type) continue;
      
      const bcDistance = Math.abs(pointC.value - pointB.value);
      const bcAbRatio = bcDistance / abDistance;
      
      // Find pattern matches based on both AB/XA and BC/AB ratios
      const matchingAbcPatterns = matchingAbPatterns.filter(pattern => 
        isCloseToRatio(bcAbRatio, pattern.expectedRatios.bcAb)
      );
      
      // Calculate potential D targets based on matching patterns
      const potentialDTargets = matchingAbcPatterns.map(pattern => {
        const cdDistance = bcDistance * pattern.expectedRatios.cdBc;
        const targetDValue = pointC.type === 'high'
          ? pointC.value - cdDistance // Bearish case
          : pointC.value + cdDistance; // Bullish case
        
        return {
          name: pattern.name,
          ratio: pattern.expectedRatios.cdBc,
          value: targetDValue,
          color: pattern.color
        };
      });
      
      if (matchingAbcPatterns.length > 0 && i + 3 >= swings.length - 1) {
        // Create dTargets that include the exact expected target values
        const xabcPatternsWithTargets = matchingAbcPatterns.map(pattern => {
          const cdBcRatio = pattern.expectedRatios.cdBc;
          const targetDValue = pointC.type === 'high'
            ? pointC.value - bcDistance * cdBcRatio
            : pointC.value + bcDistance * cdBcRatio;
          
          return {
            ...pattern,
            targetD: {
              ratio: cdBcRatio,
              value: targetDValue
            }
          };
        });
        
        patterns.push({
          type: `potential_${direction}_harmonic`,
          name: matchingAbcPatterns[0].name,
          description: matchingAbcPatterns[0].description,
          completionStatus: "X-A-B-C formed (80% complete)",
          points: { X: pointX, A: pointA, B: pointB, C: pointC },
          matchingPatterns: xabcPatternsWithTargets,
          dTargets: potentialDTargets,
          completion: 80,
          ratios: { 
            AB_XA: abXaRatio,
            BC_AB: bcAbRatio
          },
          direction,
          color: matchingAbcPatterns[0].color,
          expectedRatios: matchingAbcPatterns[0].expectedRatios
        });
        continue;
      }
    }
  }
  
  // Prioritize patterns - first by completion, then by recency
  patterns.sort((a, b) => {
    // First compare by completion percentage
    if (a.completion !== b.completion) {
      return b.completion - a.completion; // Higher completion first
    }
    
    // Then compare by recency of latest point
    const getLatestIndex = (pattern) => {
      return Math.max(...Object.values(pattern.points).map(p => p.index));
    };
    
    return getLatestIndex(b) - getLatestIndex(a); // More recent patterns first
  });
  
  // Return a mix of complete and developing patterns
  const completePatterns = patterns.filter(p => p.completion === 100).slice(0, 2);
  const developingPatterns = patterns.filter(p => p.completion < 100).slice(0, 3);
  
  return [...completePatterns, ...developingPatterns];
};

const EnhancedHarmonicPatternDetector = ({ symbol }) => {
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
  const [harmonicPatterns, setHarmonicPatterns] = useState({
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
    setAnalysis({
      long: null,
      short: null,
      veryShort: null
    });
    setHarmonicPatterns({
      long: [],
      short: [],
      veryShort: []
    });
    setIsLoading({
      long: true,
      short: true,
      veryShort: true
    });
    
    console.log(`EnhancedHarmonicPatternDetector: Loading data for symbol ${symbol}`);
    setError('');
    
    // Fetch 200-day data
    handlePatternFetch(symbol, {
      setLoading: (state) => setIsLoading(prev => ({ ...prev, long: state })),
      setError,
      setHistoricalData: (data) => {
        setLongTermData(data);
        if (data && data.prices) {
          const analysisResult = chartPatternAnalysisWithHarmonics.analyzeChart(data.prices, 'long');
          setAnalysis(prev => ({
            ...prev,
            long: analysisResult
          }));
          
          // Detect harmonic patterns for the long timeframe
          const patternsFound = detectHarmonicPatterns(data.prices, 'long');
          setHarmonicPatterns(prev => ({
            ...prev,
            long: patternsFound
          }));
          
          console.log(`LONG-TERM: Found ${patternsFound.length} harmonic patterns`);
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
          const analysisResult = chartPatternAnalysisWithHarmonics.analyzeChart(data.prices, 'medium');
          setAnalysis(prev => ({
            ...prev,
            short: analysisResult
          }));
          
          // Detect harmonic patterns for the medium timeframe
          const patternsFound = detectHarmonicPatterns(data.prices, 'medium');
          setHarmonicPatterns(prev => ({
            ...prev,
            short: patternsFound
          }));
          
          console.log(`MEDIUM-TERM: Found ${patternsFound.length} harmonic patterns`);
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
          const analysisResult = chartPatternAnalysisWithHarmonics.analyzeChart(data.prices, 'short');
          setAnalysis(prev => ({
            ...prev,
            veryShort: analysisResult
          }));
          
          // Detect harmonic patterns for the short timeframe
          const patternsFound = detectHarmonicPatterns(data.prices, 'short');
          setHarmonicPatterns(prev => ({
            ...prev,
            veryShort: patternsFound
          }));
          
          console.log(`SHORT-TERM: Found ${patternsFound.length} harmonic patterns`);
        }
      }
    });
  }, [symbol]); // Re-run this effect whenever symbol changes

  const renderChart = (data, analysisData, patterns, title) => {
    if (!data?.prices || data.prices.length === 0) {
      return (
        <div className="bg-gradient-to-br from-black via-indigo-950 to-black rounded-lg p-4 mb-6 border-2 border-purple-400 shadow-lg shadow-purple-400/20">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-600 mb-4">{title}</h3>
          <div className="text-purple-200">No data available</div>
        </div>
      );
    }

    const chartData = data.prices;
    
    // Get any harmonic patterns from the main analysis
    const completePatterns = analysisData?.harmonicPatterns || [];
    
    // Combine with our detected patterns
    const allPatterns = [...completePatterns, ...patterns];
    const hasPatterns = allPatterns.length > 0;
    
    console.log(`${title}: Rendering ${allPatterns.length} patterns`);
    
    // Add pattern information to each data point 
    const enhancedChartData = chartData.map(dataPoint => {
      const patternPoints = [];
      
      // Check if this data point is a pattern point
      allPatterns.forEach(pattern => {
        Object.entries(pattern.points || {}).forEach(([pointLabel, point]) => {
          if (point.date === dataPoint.date) {
            patternPoints.push({
              label: pointLabel,
              patternName: pattern.name,
              color: pattern.color || 
                (pattern.type?.includes('gartley') ? '#d946ef' : // Fuchsia
                pattern.type?.includes('butterfly') ? '#2dd4bf' : // Teal
                pattern.type?.includes('bat') ? '#fb923c' : // Orange
                pattern.type?.includes('crab') ? '#4ade80' : '#a5b4fc') // Green or Indigo
            });
          }
        });
      });
      
      return {
        ...dataPoint,
        patternPoints // Attach pattern points info to this data point
      };
    });

    // Map pattern types to simplified names
    const getPatternName = (pattern) => {
      if (pattern.name) return pattern.name;
      
      if (pattern.type?.includes('gartley')) return 'GARTLEY';
      if (pattern.type?.includes('butterfly')) return 'BUTTERFLY';
      if (pattern.type?.includes('bat')) return 'BAT';
      if (pattern.type?.includes('crab')) return 'CRAB';
      if (pattern.type?.includes('potential')) return 'POTENTIAL HARMONIC';
      return pattern.type?.toUpperCase() || 'HARMONIC PATTERN';
    };

    // Create target points for incomplete patterns
    const createTargetPoints = (pattern) => {
      const targets = [];
      
      // If we have specific targets for B, C, or D points, show them
      if (pattern.bTargets) {
        pattern.bTargets.forEach((target) => {
          targets.push({
            value: target.value,
            label: `B Target (${target.name})`,
            color: target.color,
            patternName: target.name
          });
        });
      }
      
      if (pattern.cTargets) {
        pattern.cTargets.forEach((target) => {
          targets.push({
            value: target.value,
            label: `C Target (${target.name})`,
            color: target.color,
            patternName: target.name
          });
        });
      }
      
      if (pattern.dTargets) {
        pattern.dTargets.forEach((target) => {
          targets.push({
            value: target.value,
            label: `D Target (${target.name})`,
            color: target.color,
            patternName: target.name
          });
        });
      }
      
      // Also handle the original format for backwards compatibility
      if (pattern.completion >= 100 || !pattern.matchingPatterns) return targets;
      
      // Add targets based on matching patterns
      pattern.matchingPatterns?.forEach((matchingPattern) => {
        if (matchingPattern.targetD && matchingPattern.targetD.value !== undefined) {
          targets.push({
            value: matchingPattern.targetD.value,
            label: `D Target (${matchingPattern.name})`,
            color: matchingPattern.color,
            patternName: matchingPattern.name
          });
        }
      });
      
      return targets;
    };

    // Get all target points
    const targetPoints = allPatterns
      .filter(p => p.completion < 100)
      .flatMap(p => createTargetPoints(p));

    // Enhance patterns with display information
    const enhancedPatterns = allPatterns.map(pattern => {
      const patternName = getPatternName(pattern);
      
      return {
        ...pattern,
        displayName: patternName
      };
    });

    // Render ratio explanation
    const renderRatioExplanation = (pattern) => {
      if (!pattern.ratios) return null;
      
      const expectedRatios = pattern.expectedRatios || 
        (pattern.matchingPatterns && pattern.matchingPatterns[0]?.expectedRatios);
      
      return (
        <div className="space-y-1">
          {pattern.ratios.AB_XA !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-indigo-200 tooltip" title="Ratio of AB to XA move">AB/XA:</span>
              <div className="flex items-center gap-2">
                {expectedRatios && (
                  <span className="text-gray-400 tooltip" title="Target Fibonacci ratio for this pattern">
                    Expected: {expectedRatios.abXa}
                  </span>
                )}
                <span className="font-bold" style={{ 
                  color: expectedRatios && Math.abs(expectedRatios.abXa - pattern.ratios.AB_XA) < 0.05 
                    ? '#4ade80' : '#fcd34d' 
                }}>
                  Actual: {pattern.ratios.AB_XA.toFixed(3)}
                </span>
              </div>
            </div>
          )}
          
          {pattern.ratios.BC_AB !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-indigo-200 tooltip" title="Ratio of BC to AB move">BC/AB:</span>
              <div className="flex items-center gap-2">
                {expectedRatios && (
                  <span className="text-gray-400 tooltip" title="Target Fibonacci ratio for this pattern">
                    Expected: {expectedRatios.bcAb}
                  </span>
                )}
                <span className="font-bold" style={{ 
                  color: expectedRatios && Math.abs(expectedRatios.bcAb - pattern.ratios.BC_AB) < 0.05 
                    ? '#4ade80' : '#fcd34d' 
                }}>
                  Actual: {pattern.ratios.BC_AB.toFixed(3)}
                </span>
              </div>
            </div>
          )}
          
          {pattern.ratios.CD_BC !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-indigo-200 tooltip" title="Ratio of CD to BC move">CD/BC:</span>
              <div className="flex items-center gap-2">
                {expectedRatios && (
                  <span className="text-gray-400 tooltip" title="Target Fibonacci ratio for this pattern">
                    Expected: {expectedRatios.cdBc}
                  </span>
                )}
                <span className="font-bold" style={{ 
                  color: expectedRatios && Math.abs(expectedRatios.cdBc - pattern.ratios.CD_BC) < 0.05 
                    ? '#4ade80' : '#fcd34d' 
                }}>
                  Actual: {pattern.ratios.CD_BC.toFixed(3)}
                </span>
              </div>
            </div>
          )}
          
          {pattern.ratios.XD_XA !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-indigo-200 tooltip" title="Ratio of XD to XA move">XD/XA:</span>
              <div className="flex items-center gap-2">
                {expectedRatios && (
                  <span className="text-gray-400 tooltip" title="Target Fibonacci ratio for this pattern">
                    Expected: {expectedRatios.xdXa}
                  </span>
                )}
                <span className="font-bold" style={{ 
                  color: expectedRatios && Math.abs(expectedRatios.xdXa - pattern.ratios.XD_XA) < 0.05 
                    ? '#4ade80' : '#fcd34d' 
                }}>
                  Actual: {pattern.ratios.XD_XA.toFixed(3)}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    };

    // Render next point target information
    const renderNextPointTargets = (pattern) => {
      if (pattern.completion >= 100) return null;
      
      let nextPointLabel = '';
      let targetPoints = [];
      
      if (pattern.completion === 40) {
        nextPointLabel = 'B';
        targetPoints = pattern.bTargets || [];
      } else if (pattern.completion === 60) {
        nextPointLabel = 'C';
        targetPoints = pattern.cTargets || [];
      } else if (pattern.completion === 80) {
        nextPointLabel = 'D';
        targetPoints = pattern.dTargets || pattern.matchingPatterns?.map(mp => ({
          name: mp.name,
          value: mp.targetD?.value,
          color: mp.color
        })).filter(t => t.value !== undefined) || [];
      }
      
      if (targetPoints.length === 0) return null;
      
      return (
        <div className="p-2 bg-black/30 rounded-md mt-2">
          <div className="font-semibold mb-1 text-white">Point {nextPointLabel} Targets:</div>
          <div className="space-y-2">
            {targetPoints.map((target, tIdx) => (
              <div key={`target-${tIdx}`} className="flex justify-between items-center">
                <span style={{ color: target.color }}>
                  {target.name}:
                </span>
                <span className="font-bold" style={{ color: target.color }}>
                  ${target.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Analysis summary text
    const renderAnalysisSummary = () => {
      return (
        <div className="mt-6 text-indigo-300 bg-gradient-to-r from-indigo-950 via-black to-indigo-950 p-5 rounded-lg border-2 border-purple-500 shadow-lg shadow-purple-500/20">
          <div className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500 mb-3">Harmonic Pattern Analysis for {symbol}:</div>
          
          {!hasPatterns ? (
            <div className="text-gray-400 italic px-4 py-2 bg-black/30 rounded-md">
              No harmonic patterns detected in this timeframe. Harmonic patterns require specific Fibonacci relationships between price movements.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mt-4">
              {enhancedPatterns.map((pattern, idx) => (
                <div 
                  key={`pattern-${idx}`} 
                  className="bg-black/50 rounded-lg overflow-hidden border-2"
                  style={{ borderColor: pattern.color }}
                >
                  <div 
                    className="p-2 text-center font-bold text-lg"
                    style={{ backgroundColor: pattern.color + '40', color: pattern.color }}
                  >
                    {pattern.displayName} • {pattern.direction?.toUpperCase()} • {pattern.completionStatus || `${pattern.completion}% Complete`}
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {/* Pattern explanation */}
                    {pattern.description && (
                      <div className="text-gray-300 text-sm italic">
                        {pattern.description}
                      </div>
                    )}
                  
                    {/* Fibonacci ratios with explanations */}
                    {pattern.ratios && (
                      <div className="p-2 bg-black/30 rounded-md">
                        <div className="font-semibold mb-1 text-white">
                          Fibonacci Ratios <span className="text-xs text-gray-400">(Expected vs. Actual)</span>:
                        </div>
                        {renderRatioExplanation(pattern)}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {/* Show point labels */}
                      {['X', 'A', 'B', 'C', 'D'].map(pointLabel => (
                        <div 
                          key={`label-${pointLabel}`} 
                          className={`p-2 rounded-md text-white font-bold ${
                            pattern.points && pattern.points[pointLabel] 
                              ? 'bg-opacity-30' 
                              : 'bg-opacity-10 text-gray-500'
                          }`}
                          style={{ 
                            backgroundColor: pattern.color + (pattern.points && pattern.points[pointLabel] ? '30' : '10') 
                          }}
                        >
                          Point {pointLabel}
                        </div>
                      ))}
                      
                      {/* Show point values or "Pending" */}
                      {['X', 'A', 'B', 'C', 'D'].map(pointLabel => {
                        const point = pattern.points && pattern.points[pointLabel];
                        return (
                          <div key={`value-${pointLabel}`} className="p-1">
                            {point && point.value !== undefined 
  ? `$${point.value.toFixed(2)}`
  : <span className="text-gray-500 italic">Pending</span>}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Ratio explanation */}
                    {pattern.completion >= 60 && pattern.completion < 80 && (
                      <div className="mt-1 text-xs text-gray-400">
                        <span className="text-indigo-300 font-medium">AB/XA ratio:</span> The ratio between the AB and XA price moves. 
                        For {pattern.name} patterns, this should be close to {pattern.expectedRatios?.abXa || "0.618 or 0.786"}.
                      </div>
                    )}
                    
                    {pattern.completion >= 80 && pattern.completion < 100 && (
                      <div className="mt-1 text-xs text-gray-400">
                        <span className="text-indigo-300 font-medium">BC/AB ratio:</span> The ratio between the BC and AB price moves.
                        For {pattern.name} patterns, this should be close to {pattern.expectedRatios?.bcAb || "0.382 or 0.886"}.
                      </div>
                    )}
                    
                    {/* Target information for incomplete patterns */}
                    {renderNextPointTargets(pattern)}
                    
                    <div className="text-sm text-gray-300 border-t border-indigo-800 pt-2 mt-2">
                      <span className="font-semibold">{pattern.direction} bias</span> • 
                      <span className="ml-1">
                        {pattern.completion < 100 
                          ? (() => {
                              if (pattern.completion === 40 && pattern.bTargets && pattern.bTargets.length > 0) {
                                return `Looking for point B near $${pattern.bTargets[0].value.toFixed(2)}`;
                              } else if (pattern.completion === 60 && pattern.cTargets && pattern.cTargets.length > 0) {
                                return `Watching for point C near $${pattern.cTargets[0].value.toFixed(2)}`;
                              } else if (pattern.completion === 80) {
                                if (pattern.dTargets && pattern.dTargets.length > 0) {
                                  return `Expecting point D near $${pattern.dTargets[0].value.toFixed(2)}`;
                                } else if (pattern.matchingPatterns?.[0]?.targetD) {
                                  return `Expecting point D near $${pattern.matchingPatterns[0].targetD.value.toFixed(2)}`;
                                }
                              }
                              return 'Watching for next pattern point';
                            })()
                          : 'Complete pattern - potential reversal zone'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 p-3 rounded-md bg-black/30 border border-purple-700/30">
            <div className="text-sm text-gray-300">
              <span className="text-purple-400 font-bold">About Fibonacci Ratios:</span> Harmonic patterns use 
              specific Fibonacci ratios between price movements to identify potential reversal zones. The comparison 
              between expected and actual ratios helps gauge pattern validity.
              {allPatterns.some(p => p.completion < 100) ? " Target zones for incomplete patterns show potential entry points." : ""}
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        <TVPatternChart
          data={enhancedChartData}
          title={title}
          symbol={symbol}
          height={320}
          markers={
            allPatterns.flatMap(pattern => {
              const color = pattern.color ||
                (pattern.type?.includes('gartley') ? '#d946ef' :
                pattern.type?.includes('butterfly') ? '#2dd4bf' :
                pattern.type?.includes('bat') ? '#fb923c' :
                pattern.type?.includes('crab') ? '#4ade80' : '#a5b4fc');
              return ['X','A','B','C','D']
                .filter(k => pattern.points?.[k] || pattern.points?.[k.toLowerCase()])
                .map(k => {
                  const pt = pattern.points?.[k] || pattern.points?.[k.toLowerCase()];
                  return {
                    time: pt.date,
                    label: k,
                    color,
                    position: ['X','B','D'].includes(k) ? 'below' : 'above',
                  };
                });
            })
          }
          slopeLines={
            allPatterns.map(pattern => {
              const color = pattern.color ||
                (pattern.type?.includes('gartley') ? '#d946ef' :
                pattern.type?.includes('butterfly') ? '#2dd4bf' :
                pattern.type?.includes('bat') ? '#fb923c' :
                pattern.type?.includes('crab') ? '#4ade80' : '#a5b4fc');
              const pts = ['X','A','B','C','D']
                .map(k => pattern.points?.[k] || pattern.points?.[k.toLowerCase()])
                .filter(Boolean)
                .map(p => ({ date: p.date, value: p.value }));
              return { points: pts, color, width: 2, dashed: false };
            }).filter(s => s.points.length >= 2)
          }
          priceLines={
            targetPoints
              .filter(t => t.value != null && !isNaN(t.value))
              .sort((a, b) => b.value - a.value)
              .map(t => ({
                value: t.value,
                color: t.color || '#a5b4fc',
                label: t.label || 'Target',
                dashed: true,
              }))
          }
        />
        {renderAnalysisSummary()}
      </>
    );
  };

  if (isLoading.long && isLoading.short && isLoading.veryShort) {
    return (
      <div className="bg-gradient-to-br from-black via-indigo-950 to-black rounded-lg p-8 border-2 border-purple-500 shadow-lg shadow-purple-400/20">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500 mb-6">Loading harmonic pattern analysis for {symbol}...</h3>
        <div className="flex justify-center items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-md bg-purple-400 animate-pulse"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-400 relative z-10"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-black via-indigo-950 to-black rounded-lg p-8 border-2 border-red-500 shadow-lg shadow-red-500/30">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-4">Error</h3>
        <p className="text-white font-medium bg-black/50 p-4 rounded-lg border border-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-950 p-4 rounded-lg">
      {renderChart(longTermData, analysis.long, harmonicPatterns.long, "Harmonic Patterns (200-Day)")}
      {renderChart(shortTermData, analysis.short, harmonicPatterns.short, "Harmonic Patterns (40-Day)")}
      {renderChart(veryShortTermData, analysis.veryShort, harmonicPatterns.veryShort, "Harmonic Patterns (10-Day)")}
    </div>
  );
};

export default EnhancedHarmonicPatternDetector;