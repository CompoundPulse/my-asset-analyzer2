import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  handlePatternFetch, 
  handleShortPatternFetch, 
  handleVeryShortPatternFetch
} from './stockUtils';

// Add this function to the top of your component or as a helper function
const ensureCorrectDateRange = (data, timeframeInDays) => {
  if (!data || !data.prices || data.prices.length === 0) return data;
  
  // Sort by date to ensure chronological order
  const sortedPrices = [...data.prices].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Get the most recent date
  const lastDate = new Date(sortedPrices[sortedPrices.length - 1].date);
  
  // Calculate the start date based on the timeframe
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() - timeframeInDays);
  
  // Filter to include only data within the specified timeframe
  const filteredPrices = sortedPrices.filter(price => new Date(price.date) >= startDate);
  
  // Ensure we have correctly indexed values
  const indexedPrices = filteredPrices.map((price, idx) => ({
    ...price,
    index: idx
  }));
  
  return {
    ...data,
    prices: indexedPrices
  };
};

// Helper function to detect chart patterns across the entire chart
const detectChartPatterns = (data, timeframe) => {
  if (!data || data.length < 20) return []; // Need sufficient data for patterns
  
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
  
  // Linear regression to find best fit line
  const linearRegression = (points) => {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0 };
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += points[i].index;
      sumY += points[i].value;
      sumXY += points[i].index * points[i].value;
      sumXX += points[i].index * points[i].index;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };
  
  // Calculate how well points fit to a line (R-squared)
  const calculateFit = (points, line) => {
    if (points.length < 2) return 0;
    
    const { slope, intercept } = line;
    let ssTotal = 0;
    let ssResidual = 0;
    let mean = 0;
    
    // Calculate mean
    for (let point of points) {
      mean += point.value;
    }
    mean /= points.length;
    
    // Calculate sum of squares
    for (let point of points) {
      const predicted = slope * point.index + intercept;
      ssTotal += Math.pow(point.value - mean, 2);
      ssResidual += Math.pow(point.value - predicted, 2);
    }
    
    if (ssTotal === 0) return 0;
    return 1 - (ssResidual / ssTotal);
  };

  // Check if a series of points form a valid trend line
const isValidTrendLine = (points, type) => {
  if (points.length < 3) return false;
  
  const line = linearRegression(points);
  const fit = calculateFit(points, line);
  
  // For valid trendlines we need:
  // 1. Good fit to a line (high R-squared)
  // 2. Correct slope direction (up for support, down for resistance)
  return fit > 0.7 && ((type === 'support' && line.slope > -0.05) || 
                        (type === 'resistance' && line.slope < 0.05));
};
  
  // Find the intersection of two lines
  const findIntersection = (line1, line2) => {
    // If slopes are equal (parallel lines), no intersection
    if (Math.abs(line1.slope - line2.slope) < 0.0001) {
      return null;
    }
    
    const x = (line2.intercept - line1.intercept) / (line1.slope - line2.slope);
    const y = line1.slope * x + line1.intercept;
    
    return { x, y };
  };

  // Calculate distance between two points
const distance = (point1, point2) => {
  return Math.sqrt(Math.pow(point2.index - point1.index, 2) + Math.pow(point2.value - point1.value, 2));
};
  
  // Calculate percentage difference between two values
  const percentDifference = (a, b) => {
    return Math.abs((a - b) / ((a + b) / 2)) * 100;
  };
  
  // Check if value is within tolerance of target
  const isWithinTolerance = (value, target, tolerance = 5) => {
    return percentDifference(value, target) <= tolerance;
  };
  
  // Get value of a trendline at a specific index
  const getTrendLineValueAtIndex = (line, index) => {
    return line.slope * index + line.intercept;
  };
  
  const swings = findSwings(data);
  
  // 1. Detect Head and Shoulders Patterns
  const detectHeadAndShoulders = () => {
    if (swings.length < 5) return [];
    
    const hsPattterns = [];
    
    // Look for peaks (highs) and troughs (lows)
    // For regular head and shoulders: peak-trough-higher peak-trough-lower peak
    for (let i = 0; i < swings.length - 4; i++) {
      // Find potential left shoulder, head, right shoulder (peaks)
      const peakIndices = [];
      const troughIndices = [];
      
      for (let j = i; j < swings.length && peakIndices.length < 3 && troughIndices.length < 2; j++) {
        if (swings[j].type === 'high' && (peakIndices.length === 0 || 
            (peakIndices.length === 1 && swings[j].value > swings[peakIndices[0]].value) ||
            (peakIndices.length === 2 && swings[j].value < swings[peakIndices[1]].value && 
             isWithinTolerance(swings[j].value, swings[peakIndices[0]].value, 10)))) {
          peakIndices.push(j);
        } else if (swings[j].type === 'low' && peakIndices.length > troughIndices.length) {
          troughIndices.push(j);
        }
      }
      
      // If we have 3 peaks and 2 troughs in the right pattern
      if (peakIndices.length === 3 && troughIndices.length === 2) {
        const leftShoulder = swings[peakIndices[0]];
        const head = swings[peakIndices[1]];
        const rightShoulder = swings[peakIndices[2]];
        const leftTrough = swings[troughIndices[0]];
        const rightTrough = swings[troughIndices[1]];
        
        // Verify head is higher than both shoulders
        if (head.value > leftShoulder.value && head.value > rightShoulder.value) {
          // Check if shoulders are roughly at the same level
          if (isWithinTolerance(leftShoulder.value, rightShoulder.value, 10)) {
            // Calculate neckline (support line connecting the troughs)
            const neckline = linearRegression([leftTrough, rightTrough]);
            
            // Calculate expected breakdown target
            const pattern_height = head.value - ((leftTrough.value + rightTrough.value) / 2);
            const breakdown_target = getTrendLineValueAtIndex(neckline, rightShoulder.index) - pattern_height;
            
            // Add to patterns with higher confidence for mature patterns
            const lastPointIndex = Math.max(leftShoulder.index, head.index, rightShoulder.index, 
                                         leftTrough.index, rightTrough.index);
            const patternCompleted = lastPointIndex === swings[swings.length - 1].index;
            
            // Calculate the approximate position of the price relative to the pattern
            const latestPrice = data[data.length - 1].value;
            const necklineAtLatestPrice = getTrendLineValueAtIndex(neckline, data.length - 1);
            
            let completionStatus = "Developing";
            let completion = 85; // Default: pattern is forming but not confirmed
            
            if (patternCompleted && latestPrice < necklineAtLatestPrice) {
              completionStatus = "Confirmed Breakdown";
              completion = 100;
            } else if (patternCompleted) {
              completionStatus = "Awaiting Breakdown";
              completion = 95;
            }
            
            hsPattterns.push({
              type: "head_and_shoulders",
              name: "Head and Shoulders",
              description: "A bearish reversal pattern with three peaks where the middle peak (head) is the highest and the two surrounding peaks (shoulders) are lower and approximately at the same level.",
              points: {
                leftShoulder,
                head,
                rightShoulder,
                leftTrough,
                rightTrough
              },
              lines: {
                neckline
              },
              target: breakdown_target,
              completionStatus,
              completion,
              direction: "bearish",
              color: "#ef4444", // Red
              patternHeight: pattern_height
            });
            
            // Skip ahead to avoid overlapping patterns
            i = Math.min(peakIndices[2], troughIndices[1]);
          }
        }
      }
    }
    
    // Now detect inverse head and shoulders (bullish)
    for (let i = 0; i < swings.length - 4; i++) {
      // Find potential left shoulder, head, right shoulder (troughs)
      const troughIndices = [];
      const peakIndices = [];
      
      for (let j = i; j < swings.length && troughIndices.length < 3 && peakIndices.length < 2; j++) {
        if (swings[j].type === 'low' && (troughIndices.length === 0 || 
            (troughIndices.length === 1 && swings[j].value < swings[troughIndices[0]].value) ||
            (troughIndices.length === 2 && swings[j].value > swings[troughIndices[1]].value && 
             isWithinTolerance(swings[j].value, swings[troughIndices[0]].value, 10)))) {
          troughIndices.push(j);
        } else if (swings[j].type === 'high' && troughIndices.length > peakIndices.length) {
          peakIndices.push(j);
        }
      }
      
      // If we have 3 troughs and 2 peaks in the right pattern
      if (troughIndices.length === 3 && peakIndices.length === 2) {
        const leftShoulder = swings[troughIndices[0]];
        const head = swings[troughIndices[1]];
        const rightShoulder = swings[troughIndices[2]];
        const leftPeak = swings[peakIndices[0]];
        const rightPeak = swings[peakIndices[1]];
        
        // Verify head is lower than both shoulders
        if (head.value < leftShoulder.value && head.value < rightShoulder.value) {
          // Check if shoulders are roughly at the same level
          if (isWithinTolerance(leftShoulder.value, rightShoulder.value, 10)) {
            // Calculate neckline (resistance line connecting the peaks)
            const neckline = linearRegression([leftPeak, rightPeak]);
            
            // Calculate expected breakout target
            const pattern_height = ((leftPeak.value + rightPeak.value) / 2) - head.value;
            const breakout_target = getTrendLineValueAtIndex(neckline, rightShoulder.index) + pattern_height;
            
            // Add to patterns with higher confidence for mature patterns
            const lastPointIndex = Math.max(leftShoulder.index, head.index, rightShoulder.index,
                                         leftPeak.index, rightPeak.index);
            const patternCompleted = lastPointIndex === swings[swings.length - 1].index;
            
            // Calculate the approximate position of the price relative to the pattern
            const latestPrice = data[data.length - 1].value;
            const necklineAtLatestPrice = getTrendLineValueAtIndex(neckline, data.length - 1);
            
            let completionStatus = "Developing";
            let completion = 85; // Default: pattern is forming but not confirmed
            
            if (patternCompleted && latestPrice > necklineAtLatestPrice) {
              completionStatus = "Confirmed Breakout";
              completion = 100;
            } else if (patternCompleted) {
              completionStatus = "Awaiting Breakout";
              completion = 95;
            }
            
            hsPattterns.push({
              type: "inverse_head_and_shoulders",
              name: "Inverse Head and Shoulders",
              description: "A bullish reversal pattern with three troughs where the middle trough (head) is the lowest and the two surrounding troughs (shoulders) are higher and approximately at the same level.",
              points: {
                leftShoulder,
                head,
                rightShoulder,
                leftPeak,
                rightPeak
              },
              lines: {
                neckline
              },
              target: breakout_target,
              completionStatus,
              completion,
              direction: "bullish",
              color: "#22c55e", // Green
              patternHeight: pattern_height
            });
            
            // Skip ahead to avoid overlapping patterns
            i = Math.min(troughIndices[2], peakIndices[1]);
          }
        }
      }
    }
    
    return hsPattterns;
  };
  
  // 2. Detect Double Top and Double Bottom Patterns
  const detectDoublePatterns = () => {
    if (swings.length < 4) return [];
    
    const doublePatterns = [];
    
    // Look for Double Tops: peak-trough-peak
    for (let i = 0; i < swings.length - 2; i++) {
      if (swings[i].type === 'high' && swings[i+2].type === 'high' && swings[i+1].type === 'low') {
        const firstPeak = swings[i];
        const trough = swings[i+1];
        const secondPeak = swings[i+2];
        
        // Check if peaks are roughly at the same level
        if (isWithinTolerance(firstPeak.value, secondPeak.value, 3)) {
          // Calculate neckline and target
          const pattern_height = ((firstPeak.value + secondPeak.value) / 2) - trough.value;
          const breakdown_target = trough.value - pattern_height;
          
          // Check pattern completeness
          const patternCompleted = secondPeak.index === swings[swings.length - 1].index || 
                                  (swings.length > i+3 && swings[i+3].value < trough.value);
          
          let completionStatus = "Developing";
          let completion = 85;
          
          if (patternCompleted && data[data.length - 1].value < trough.value) {
            completionStatus = "Confirmed Breakdown";
            completion = 100;
          } else if (patternCompleted) {
            completionStatus = "Awaiting Breakdown";
            completion = 95;
          }
          
          doublePatterns.push({
            type: "double_top",
            name: "Double Top",
            description: "A bearish reversal pattern formed by two peaks at roughly the same level with a moderate trough between them.",
            points: {
              firstPeak,
              trough,
              secondPeak
            },
            lines: {
              neckline: { slope: 0, intercept: trough.value }
            },
            target: breakdown_target,
            completionStatus,
            completion,
            direction: "bearish",
            color: "#ef4444", // Red
            patternHeight: pattern_height
          });
          
          // Skip ahead to avoid overlapping patterns
          i = i + 2;
        }
      }
    }
    
    // Look for Double Bottoms: trough-peak-trough
    for (let i = 0; i < swings.length - 2; i++) {
      if (swings[i].type === 'low' && swings[i+2].type === 'low' && swings[i+1].type === 'high') {
        const firstTrough = swings[i];
        const peak = swings[i+1];
        const secondTrough = swings[i+2];
        
        // Check if troughs are roughly at the same level
        if (isWithinTolerance(firstTrough.value, secondTrough.value, 3)) {
          // Calculate neckline and target
          const pattern_height = peak.value - ((firstTrough.value + secondTrough.value) / 2);
          const breakout_target = peak.value + pattern_height;
          
          // Check pattern completeness
          const patternCompleted = secondTrough.index === swings[swings.length - 1].index || 
                                 (swings.length > i+3 && swings[i+3].value > peak.value);
          
          let completionStatus = "Developing";
          let completion = 85;
          
          if (patternCompleted && data[data.length - 1].value > peak.value) {
            completionStatus = "Confirmed Breakout";
            completion = 100;
          } else if (patternCompleted) {
            completionStatus = "Awaiting Breakout";
            completion = 95;
          }
          
          doublePatterns.push({
            type: "double_bottom",
            name: "Double Bottom",
            description: "A bullish reversal pattern formed by two troughs at roughly the same level with a moderate peak between them.",
            points: {
              firstTrough,
              peak,
              secondTrough
            },
            lines: {
              neckline: { slope: 0, intercept: peak.value }
            },
            target: breakout_target,
            completionStatus,
            completion,
            direction: "bullish",
            color: "#22c55e", // Green
            patternHeight: pattern_height
          });
          
          // Skip ahead to avoid overlapping patterns
          i = i + 2;
        }
      }
    }
    
    return doublePatterns;
  };
  
  // 3. Detect Triangle Patterns (Symmetrical, Ascending, Descending)
  const detectTriangles = () => {
    if (swings.length < 5) return [];
    
    const trianglePatterns = [];
    
    // Helper for triangle description
    const getTriangleDescription = (type) => {
      switch(type) {
        case "symmetrical_triangle":
          return "A bilateral pattern where price forms a triangle with converging trend lines, indicating a period of consolidation before a potential breakout in either direction.";
        case "ascending_triangle":
          return "A bullish pattern formed by a flat upper resistance line and an upward-sloping lower support line, suggesting accumulation and a potential upside breakout.";
        case "descending_triangle":
          return "A bearish pattern formed by a flat lower support line and a downward-sloping upper resistance line, suggesting distribution and a potential downside breakdown.";
        default:
          return "A triangle pattern formed by converging trend lines.";
      }
    };
    
    // We need at least 2 highs and 2 lows to form a triangle
    const highs = swings.filter(swing => swing.type === 'high');
    const lows = swings.filter(swing => swing.type === 'low');
    
    if (highs.length < 2 || lows.length < 2) return [];
    
    // Try to find trendlines for different sets of points
    for (let startIdx = 0; startIdx < swings.length - 4; startIdx++) {
      // Get potential triangle points (need at least 2 highs and 2 lows)
      const trianglePoints = swings.slice(startIdx, startIdx + Math.min(10, swings.length - startIdx));
      
      const triangleHighs = trianglePoints.filter(p => p.type === 'high');
      const triangleLows = trianglePoints.filter(p => p.type === 'low');
      
      if (triangleHighs.length < 2 || triangleLows.length < 2) continue;
      
      // Calculate resistance and support lines
      const resistanceLine = linearRegression(triangleHighs);
      const supportLine = linearRegression(triangleLows);
      
      // Check if these lines form a valid triangle
      const resistanceFit = calculateFit(triangleHighs, resistanceLine);
      const supportFit = calculateFit(triangleLows, supportLine);
      
      // Skip if the fit is poor
      if (resistanceFit < 0.6 || supportFit < 0.6) continue;
      
      // Find intersection point
      const intersection = findIntersection(resistanceLine, supportLine);
      if (!intersection) continue;
      
      // Calculate apex of the triangle (where the lines meet)
      const apex = { 
        index: intersection.x, 
        value: intersection.y 
      };
      
      // Calculate pattern width at its widest point
      const firstHighOrLow = trianglePoints[0];
      const valueAtStart = supportLine.slope * firstHighOrLow.index + supportLine.intercept;
      const widestWidth = Math.abs(resistanceLine.slope * firstHighOrLow.index + resistanceLine.intercept - valueAtStart);
      
      // Determine triangle type based on slopes
      let triangleType;
      let direction;
      let patternColor;
      
      if (Math.abs(resistanceLine.slope - supportLine.slope) < 0.01) {
        // Slopes are similar, which is not a valid triangle
        continue;
      } else if (resistanceLine.slope < -0.01 && supportLine.slope > 0.01) {
        triangleType = "symmetrical_triangle";
        direction = "bilateral";
        patternColor = "#a78bfa"; // Purple
      } else if (resistanceLine.slope < -0.01 && Math.abs(supportLine.slope) < 0.01) {
        triangleType = "descending_triangle";
        direction = "bearish";
        patternColor = "#ef4444"; // Red
      } else if (Math.abs(resistanceLine.slope) < 0.01 && supportLine.slope > 0.01) {
        triangleType = "ascending_triangle";
        direction = "bullish";
        patternColor = "#22c55e"; // Green
      } else {
        // Not a valid triangle type
        continue;
      }
      
      // Calculate completion percentage based on how far along we are
      const triangleWidth = apex.index - firstHighOrLow.index;
      const latestPoint = data[data.length - 1];
      const progress = (latestPoint.index - firstHighOrLow.index) / triangleWidth;
      
      // Triangle is most valid when it's 40-80% complete
      if (progress < 0.3 || progress > 0.9) continue;
      
      // Calculate potential breakout targets
      const breakoutLevel = (resistanceLine.slope * latestPoint.index + resistanceLine.intercept);
      const breakdownLevel = (supportLine.slope * latestPoint.index + supportLine.intercept);
      
      // Expected targets based on pattern height
      const upTarget = breakoutLevel + widestWidth;
      const downTarget = breakdownLevel - widestWidth;
      
      // Calculate the breakout/breakdown level at the current index
      const currentResistance = resistanceLine.slope * (data.length - 1) + resistanceLine.intercept;
      const currentSupport = supportLine.slope * (data.length - 1) + supportLine.intercept;
      
      // Check if price has broken out
      const currentPrice = data[data.length - 1].value;
      let completionStatus = "Developing";
      let completion = Math.round(progress * 100);
      let target = direction === "bullish" ? upTarget : direction === "bearish" ? downTarget : null;
      
      if (currentPrice > currentResistance + (currentResistance * 0.005)) {
        // Bullish breakout
        completionStatus = "Confirmed Bullish Breakout";
        completion = 100;
        target = upTarget;
      } else if (currentPrice < currentSupport - (currentSupport * 0.005)) {
        // Bearish breakdown
        completionStatus = "Confirmed Bearish Breakdown";
        completion = 100;
        target = downTarget;
      }
      
      trianglePatterns.push({
        type: triangleType,
        name: triangleType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        description: getTriangleDescription(triangleType),
        points: {
          highs: triangleHighs,
          lows: triangleLows,
          apex
        },
        lines: {
          resistance: resistanceLine,
          support: supportLine
        },
        target,
        upTarget,
        downTarget,
        completionStatus,
        completion,
        direction,
        color: patternColor,
        patternHeight: widestWidth
      });
      
      // Skip ahead to avoid too many overlapping triangles
      startIdx += 3;
    }
    
    return trianglePatterns;
  };

  // 4. Detect Rectangle Patterns
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

// 5. Detect Wedge Patterns (Rising and Falling)
const detectWedges = () => {
  if (swings.length < 4) return [];
  
  const wedgePatterns = [];
  
  // We need sufficient alternating highs and lows
  for (let startIdx = 0; startIdx < swings.length - 3; startIdx++) {
    let wedgePoints = swings.slice(startIdx, startIdx + Math.min(10, swings.length - startIdx));
    
    // Need at least 2 highs and 2 lows
    const highs = wedgePoints.filter(p => p.type === 'high');
    const lows = wedgePoints.filter(p => p.type === 'low');
    
    if (highs.length < 2 || lows.length < 2) continue;
    
    // Calculate trendlines for highs and lows
    const highLine = linearRegression(highs);
    const lowLine = linearRegression(lows);
    
    // Check for good fit
    const highFit = calculateFit(highs, highLine);
    const lowFit = calculateFit(lows, lowLine);
    
    if (highFit < 0.6 || lowFit < 0.6) continue;
    
    // Check for wedge: both lines should slope in the same direction
    // And they should be converging
    const areSlopesSameDirection = (highLine.slope > 0 && lowLine.slope > 0) || 
                                   (highLine.slope < 0 && lowLine.slope < 0);
    
    const areConverging = Math.abs(highLine.slope - lowLine.slope) > 0.001;
    
    if (!areSlopesSameDirection || !areConverging) continue;
    
    // Determine wedge type
    let wedgeType;
    let direction;
    let patternColor;
    
    if (highLine.slope > 0 && lowLine.slope > 0) {
      // Rising wedge - bearish
      wedgeType = "rising_wedge";
      direction = "bearish";
      patternColor = "#ef4444"; // Red
    } else {
      // Falling wedge - bullish
      wedgeType = "falling_wedge";
      direction = "bullish";
      patternColor = "#22c55e"; // Green
    }
    
    // Find intersection point (apex)
    const intersection = findIntersection(highLine, lowLine);
    if (!intersection) continue;
    
    // Calculate apex of the wedge
    const apex = { 
      index: intersection.x, 
      value: intersection.y 
    };
    
    // Calculate pattern height at widest point (start)
    const firstPoint = wedgePoints[0];
    const highValueAtStart = highLine.slope * firstPoint.index + highLine.intercept;
    const lowValueAtStart = lowLine.slope * firstPoint.index + lowLine.intercept;
    const widestWidth = highValueAtStart - lowValueAtStart;
    
    // Calculate completion percentage
    const wedgeWidth = apex.index - firstPoint.index;
    const latestPoint = data[data.length - 1];
    const progress = (latestPoint.index - firstPoint.index) / wedgeWidth;
    
    // Wedge is most valid when it's 40-80% complete
    if (progress < 0.3 || progress > 0.9) continue;
    
    // Calculate potential breakout/breakdown targets
    const currentHigh = highLine.slope * (data.length - 1) + highLine.intercept;
    const currentLow = lowLine.slope * (data.length - 1) + lowLine.intercept;
    
    // Target is typically the height of the pattern at its widest
    const target = direction === "bullish" ? currentHigh + widestWidth : currentLow - widestWidth;
    
    // Check if price has broken out/down
    const currentPrice = data[data.length - 1].value;
    let completionStatus = "Developing";
    let completion = Math.round(progress * 100);
    
    if (direction === "bullish" && currentPrice > currentHigh * 1.01) {
      completionStatus = "Confirmed Bullish Breakout";
      completion = 100;
    } else if (direction === "bearish" && currentPrice < currentLow * 0.99) {
      completionStatus = "Confirmed Bearish Breakdown";
      completion = 100;
    }
    
    wedgePatterns.push({
      type: wedgeType,
      name: wedgeType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      description: getWedgeDescription(wedgeType),
      points: {
        highs,
        lows,
        apex
      },
      lines: {
        resistance: highLine,
        support: lowLine
      },
      target,
      completionStatus,
      completion,
      direction,
      color: patternColor,
      patternHeight: widestWidth
    });
    
    // Skip ahead to avoid overlapping wedges
    startIdx += 3;
  }
  
  return wedgePatterns;
};

// Helper for wedge description
const getWedgeDescription = (type) => {
  switch(type) {
    case "rising_wedge":
      return "A bearish pattern where price forms a wedge shape with rising and converging trend lines. Despite the upward slope, it often signals a potential bearish reversal or continuation.";
    case "falling_wedge":
      return "A bullish pattern where price forms a wedge shape with falling and converging trend lines. Despite the downward slope, it often signals a potential bullish reversal or continuation.";
    default:
      return "A wedge pattern formed by converging trend lines.";
  }
};

// 6. Detect Pennant Patterns
const detectPennants = () => {
  if (swings.length < 4 || data.length < 20) return [];
  
  const pennantPatterns = [];
  
  // Look for sharp price movements (the mast) followed by consolidation (the pennant)
  for (let i = 10; i < data.length - 10; i++) {
    // Check for a sharp price movement (mast)
    const tenCandlesAgo = data[i - 10].value;
    const currentValue = data[i].value;
    const percentChange = ((currentValue - tenCandlesAgo) / tenCandlesAgo) * 100;
    
    // Need a significant move to form a mast
    if (Math.abs(percentChange) < 5) continue;
    
    // Determine if it's a bullish or bearish move
    const isBullish = percentChange > 0;
    
    // Now check for consolidation (pennant)
    const potentialPennantPoints = swings.filter(s => s.index >= i && s.index < i + 10);
    
    // Need sufficient alternating highs and lows
    const pennantHighs = potentialPennantPoints.filter(p => p.type === 'high');
    const pennantLows = potentialPennantPoints.filter(p => p.type === 'low');
    
    if (pennantHighs.length < 2 || pennantLows.length < 2) continue;
    
    // Calculate trendlines for consolidation
    const highLine = linearRegression(pennantHighs);
    const lowLine = linearRegression(pennantLows);
    
    // Pennants form triangles (converging lines)
    const areConverging = (highLine.slope < 0 && lowLine.slope > 0) || 
                         (Math.abs(highLine.slope - lowLine.slope) > 0.001);
    
    if (!areConverging) continue;
    
    // Find intersection point (apex)
    const intersection = findIntersection(highLine, lowLine);
    if (!intersection) continue;
    
    // Calculate apex of the pennant
    const apex = { 
      index: intersection.x, 
      value: intersection.y 
    };
    
    // Measure the mast
    const mastStart = data[Math.max(0, i - 10)];
    const mastEnd = data[i];
    const mastHeight = Math.abs(mastEnd.value - mastStart.value);
    
    // Calculate the target (typically the height of the mast)
    const breakoutTarget = isBullish ? mastEnd.value + mastHeight : mastEnd.value - mastHeight;
    
    // Calculate completion status
    const pennantWidth = apex.index - i;
    const currentIndex = data.length - 1;
    const progress = (currentIndex - i) / pennantWidth;
    
    // Calculate if breakout has occurred
    const currentPrice = data[data.length - 1].value;
    const currentHigh = highLine.slope * currentIndex + highLine.intercept;
    const currentLow = lowLine.slope * currentIndex + lowLine.intercept;
    
    let completionStatus = "Developing";
    let completion = Math.min(100, Math.round(progress * 100));
    
    if (isBullish && currentPrice > currentHigh * 1.01) {
      completionStatus = "Confirmed Bullish Breakout";
      completion = 100;
    } else if (!isBullish && currentPrice < currentLow * 0.99) {
      completionStatus = "Confirmed Bearish Breakdown";
      completion = 100;
    }
    
    pennantPatterns.push({
      type: isBullish ? "bullish_pennant" : "bearish_pennant",
      name: `${isBullish ? "Bullish" : "Bearish"} Pennant`,
      description: `A ${isBullish ? "bullish" : "bearish"} continuation pattern consisting of a strong directional movement (mast) followed by a small consolidation (pennant) before continuing in the same direction.`,
      points: {
        mastStart,
        mastEnd,
        highs: pennantHighs,
        lows: pennantLows,
        apex
      },
      lines: {
        resistance: highLine,
        support: lowLine
      },
      target: breakoutTarget,
      completionStatus,
      completion,
      direction: isBullish ? "bullish" : "bearish",
      color: isBullish ? "#22c55e" : "#ef4444", // Green for bullish, red for bearish
      patternHeight: mastHeight,
      mastHeight
    });
    
    // Skip ahead to avoid overlapping patterns
    i += 10;
  }
  
  return pennantPatterns;
};
  
  // Detect all pattern types
const hsPatterns = detectHeadAndShoulders();
const doublePatterns = detectDoublePatterns();
const trianglePatterns = detectTriangles();
const rectanglePatterns = detectRectangles();
const wedgePatterns = detectWedges();
const pennantPatterns = detectPennants();

// Combine all patterns and sort by confidence/importance
const allPatterns = [
  ...hsPatterns,
  ...doublePatterns,
  ...trianglePatterns,
  ...rectanglePatterns,
  ...wedgePatterns,
  ...pennantPatterns
];

// Sort patterns by completion and recency
allPatterns.sort((a, b) => {
  // First compare by completion percentage
  if (a.completion !== b.completion) {
    return b.completion - a.completion; // Higher completion first
  }
  
  // Then compare by pattern importance
  const getPatternImportance = (pattern) => {
    const typeImportance = {
      "head_and_shoulders": 10,
      "inverse_head_and_shoulders": 10,
      "double_top": 9,
      "double_bottom": 9,
      "symmetrical_triangle": 7,
      "ascending_triangle": 8,
      "descending_triangle": 8,
      "bullish_rectangle": 6,
      "bearish_rectangle": 6,
      "rising_wedge": 7,
      "falling_wedge": 7,
      "bullish_pennant": 8,
      "bearish_pennant": 8
    };
    
    return typeImportance[pattern.type] || 5;
  };
  
  return getPatternImportance(b) - getPatternImportance(a);
});

// Limit the number of patterns to avoid overloading the chart
return allPatterns.slice(0, 5);
};

const EnhancedClassicPatternDetector = ({ symbol }) => {
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

  // Separate data fetching from pattern detection for better performance
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
  
  console.log(`EnhancedClassicPatternDetector: Loading data for symbol ${symbol}`);
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

// Dedicated effects for pattern detection to avoid blocking the UI
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

  // Helper function to get trendline value at specific index
  const getTrendLineValueAtIndex = (line, index) => {
    if (!line || line.slope === undefined || line.intercept === undefined) {
      return 0;
    }
    return line.slope * index + line.intercept;
  };

  const renderChart = (data, chartPatterns, title) => {
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
    
    // Create a stretched version of data that spans the full width
    const stretchedData = [];
    const realDataLength = chartData.length;
  
    // Spread the real data across the full width
    for (let i = 0; i < realDataLength; i++) {
      // Calculate the stretched position (0-100% of chart width)
      const position = i / (realDataLength - 1) * 100;
      const dataPoint = chartData[i];
      
      // Add stretched data point
      stretchedData.push({
        ...dataPoint,
        // Add stretched position for X-axis placement 
        xPosition: position
      });
    }
    
    // Create target lines for chart patterns
    // Create target lines for chart patterns
const createTargetLines = (pattern, patternIdx) => {
  const targetLines = [];
  
  if (!pattern.target) return targetLines;
  
  // Add a target price line
  targetLines.push({
    label: `${pattern.name} Target`,
    color: pattern.color,
    value: pattern.target,
    dashed: true,
    patternIdx,
    patternType: pattern.type,
    isWedge: pattern.type.includes('wedge'),
    isTriangle: pattern.type.includes('triangle'),
    // For wedges and triangles, also store the line equations
    lines: (pattern.type.includes('wedge') || pattern.type.includes('triangle')) ? pattern.lines : null
  });
  
  // For triangle patterns, add both potential targets
  if (pattern.type.includes('triangle') && pattern.upTarget && pattern.downTarget) {
    if (pattern.upTarget !== pattern.target) {
      targetLines.push({
        label: "Upside Target",
        color: "#22c55e", // Green
        value: pattern.upTarget,
        dashed: true,
        patternIdx,
        patternType: pattern.type,
        isTriangle: true,
        lines: pattern.lines
      });
    }
    
    if (pattern.downTarget !== pattern.target) {
      targetLines.push({
        label: "Downside Target",
        color: "#ef4444", // Red
        value: pattern.downTarget,
        dashed: true,
        patternIdx,
        patternType: pattern.type,
        isTriangle: true,
        lines: pattern.lines
      });
    }
  }
  
  return targetLines;
};
    
    // Get all target lines for rendering
    const allTargetLines = hasPatterns ? chartPatterns.flatMap((pattern, idx) => createTargetLines(pattern, idx)) : [];
  
    // Helper function to create a full pattern label with price and date
    const createFullPatternLabel = (target) => {
      // Format based on available information
      let label = target.patternName || target.label;
      
      // Add direction if available
      if (target.patternDirection) {
        // Capitalize first letter of direction
        const direction = target.patternDirection.charAt(0).toUpperCase() + target.patternDirection.slice(1);
        label += ` (${direction})`;
      }
      
      // Add price if available
      if (target.keyPrice) {
        label += ` ${target.keyPrice.toFixed(2)}`;
      }
      
      // Add date if available
      if (target.keyDate) {
        const date = new Date(target.keyDate).toLocaleDateString();
        label += ` - ${date}`;
      }
      
      return label;
    };
    
    // Find the analysisContent function and update it to include price information in the pattern description
const analysisContent = () => {
  if (!hasPatterns) {
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
  
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  
  const point = payload[0].payload;
  const price = point.value;
  const dateStr = point.date ? new Date(point.date).toLocaleDateString() : "";
  
  // Pattern info if available
  const patternPayload = payload.find(p => 
    p.payload?.pointType || p.payload?.wedgeInfo || p.payload?.isRectangle
  );
  
  const patternInfo = patternPayload ? {
    name: patternPayload.payload.patternName,
    type: patternPayload.payload.pointType,
    direction: patternPayload.payload.patternDirection,
    color: patternPayload.payload.patternColor || patternPayload.stroke
  } : null;
  
  return (
    <div className="bg-black/90 p-3 border-2 rounded-md" 
         style={{ borderColor: patternInfo ? patternInfo.color : '#ffa94d' }}>
      {dateStr && <div className="font-bold text-white">{dateStr}</div>}
      <div className="text-sm mt-1">
        <span className="text-gray-300">Price: </span>
        <span className="font-bold text-amber-300">${price.toFixed(2)}</span>
      </div>
      
      {patternInfo && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="font-bold" style={{ color: patternInfo.color }}>
            {patternInfo.name}
          </div>
          {patternInfo.type && (
            <div className="text-sm text-white">{patternInfo.type}</div>
          )}
          {patternInfo.direction && (
            <div className="text-xs text-amber-300 mt-1">
              {patternInfo.direction.toUpperCase()} Pattern
            </div>
          )}
        </div>
      )}
    </div>
  );
};
  
    return (
      <div className="bg-gradient-to-br from-black via-slate-800 to-gray-900 rounded-lg p-4 mb-6 border-2 border-amber-500/30 shadow-lg shadow-amber-400/10">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-4">{title} - {symbol}</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={stretchedData} 
              margin={{ top: 5, right: 30, left: 5, bottom: title.includes("200-Day") ? 40 : 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,170,60,0.1)" />
              <XAxis 
                dataKey="xPosition" 
                stroke="rgba(255,170,60,0.7)"
                tick={{ 
                  fill: 'rgba(255,170,60,0.7)',
                  angle: title.includes("200-Day") ? -45 : 0,
                  textAnchor: title.includes("200-Day") ? 'end' : 'middle',
                  dy: title.includes("200-Day") ? 10 : 0
                }}
                height={title.includes("200-Day") ? 60 : 30}
                tickFormatter={(value) => {
                  // Find the closest data point to this position
                  const index = Math.round(value * (realDataLength - 1) / 100);
                  if (index >= 0 && index < realDataLength) {
                    const date = new Date(chartData[index].date);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }
                  return "";
                }}
                // Set evenly spaced ticks across the chart
                ticks={[0, 20, 40, 60, 80, 100]}
                type="number"
                domain={[0, 100]}
                padding={{ left: 0, right: 0 }}
              />
              <YAxis 
                stroke="rgba(255,170,60,0.7)"
                tick={{ fill: 'rgba(255,170,60,0.7)' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                domain={[dataMin - padding, dataMax + padding]}
                padding={{ top: 10, bottom: 0 }}
              />
              
              {/* Use custom tooltip with enhanced stability */}
              <Tooltip 
  content={<CustomTooltip />}
  isAnimationActive={false}
  animationDuration={0}
  animationEasing="linear"
  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
/>
              
              {/* Basic price line with no dot customization */}
              <Line 
  type="monotone" 
  dataKey="value" 
  stroke="#ffa94d" 
  dot={false}
  activeDot={{ 
    stroke: '#ffffff', 
    strokeWidth: 2, 
    r: 6, 
    fill: '#ffa94d',
    onClick: () => {}, 
    onMouseOver: () => {} 
  }}
  strokeWidth={2}
  name="Price"
/>
              
              {/* Add pattern markers as additional lines with customized shapes */}
              {hasPatterns && chartPatterns.map((pattern, patternIdx) => {
                // Track key points with their descriptions
                const keyPointsWithInfo = [];
                
                // Add only essential pattern points based on pattern type
                if (pattern.type.includes('head_and_shoulders')) {
                  if (pattern.points.head) 
                    keyPointsWithInfo.push({...pattern.points.head, pointType: "Head"});
                  if (pattern.points.rightShoulder) 
                    keyPointsWithInfo.push({...pattern.points.rightShoulder, pointType: "Right Shoulder"});
                  if (pattern.points.leftShoulder) 
                    keyPointsWithInfo.push({...pattern.points.leftShoulder, pointType: "Left Shoulder"});
                } else if (pattern.type.includes('double')) {
                  if (pattern.points.firstPeak) 
                    keyPointsWithInfo.push({...pattern.points.firstPeak, pointType: "First Peak"});
                  if (pattern.points.secondPeak) 
                    keyPointsWithInfo.push({...pattern.points.secondPeak, pointType: "Second Peak"});
                  if (pattern.points.firstTrough) 
                    keyPointsWithInfo.push({...pattern.points.firstTrough, pointType: "First Trough"});
                  if (pattern.points.secondTrough) 
                    keyPointsWithInfo.push({...pattern.points.secondTrough, pointType: "Second Trough"});
                  if (pattern.points.trough) 
                    keyPointsWithInfo.push({...pattern.points.trough, pointType: "Trough"});
                  if (pattern.points.peak) 
                    keyPointsWithInfo.push({...pattern.points.peak, pointType: "Peak"});
                } else if (pattern.type.includes('triangle')) {
                  // Just add apex if available
                  if (pattern.points.apex)
                    keyPointsWithInfo.push({...pattern.points.apex, pointType: "Apex"});
                } else if (pattern.type.includes('wedge')) {
                  // Just add apex if available
                  if (pattern.points.apex)
                    keyPointsWithInfo.push({...pattern.points.apex, pointType: "Apex"});
                } else if (pattern.type.includes('rectangle')) {
                  // No specific points
                } else if (pattern.type.includes('pennant')) {
                  if (pattern.points.mastStart)
                    keyPointsWithInfo.push({...pattern.points.mastStart, pointType: "Mast Start"});
                  if (pattern.points.mastEnd)
                    keyPointsWithInfo.push({...pattern.points.mastEnd, pointType: "Mast End"});
                  if (pattern.points.apex)
                    keyPointsWithInfo.push({...pattern.points.apex, pointType: "Apex"});
                }
                
                // Only create a pattern line if we have key points
                if (keyPointsWithInfo.length === 0) return null;
                
                // Create pattern marker data that matches the format needed for a Line
                const patternData = stretchedData.map(dataPoint => {
                  // Use original date to find matching key points
                  const keyPoint = keyPointsWithInfo.find(kp => kp.date === dataPoint.date);
                  
                  // Return data point with pattern info if it's a key point
                  return {
                    xPosition: dataPoint.xPosition,
                    date: dataPoint.date,
                    value: dataPoint.value,
                    patternMarker: keyPoint ? dataPoint.value : null,
                    // Add pattern information for key points
                    ...(keyPoint && {
                      pointType: keyPoint.pointType,
                      patternName: pattern.name,
                      patternDirection: pattern.direction,
                      patternColor: pattern.color
                    })
                  };
                });
                
                return (
                  <Line
                    key={`pattern-${patternIdx}`}
                    type="monotone"
                    dataKey="patternMarker"
                    data={patternData}
                    stroke="transparent"
                    dot={(props) => {
                      if (!props.payload.patternMarker) return null;
                      
                      return (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={6} 
                          fill={pattern.color}
                          stroke="#fff" 
                          strokeWidth={1.5}
                        />
                      );
                    }}
                    activeDot={(props) => {
                      if (!props.payload.patternMarker) return null;
                      
                      return (
                        <g>
                          <circle 
                            cx={props.cx} 
                            cy={props.cy} 
                            r={7} 
                            fill={props.payload.patternColor}
                            stroke="#fff" 
                            strokeWidth={2}
                          />
                          <circle 
                            cx={props.cx} 
                            cy={props.cy} 
                            r={10} 
                            fill="none"
                            stroke={props.payload.patternColor} 
                            strokeWidth={1}
                            opacity={0.8}
                          />
                        </g>
                      );
                    }}
                    isAnimationActive={false}
                    name={pattern.name}
                  />
                );
              })}
              
              {/* Add pattern-specific lines and reference lines */}
{allTargetLines.map((target, tIdx) => {
  // Get the pattern type and index
  const patternIndex = target.patternIdx !== undefined ? target.patternIdx : -1;
  const pattern = chartPatterns[patternIndex];
  const patternType = pattern?.type || "";
  
  // For wedge and triangle patterns, draw sloped lines with touch points
  if ((patternType.includes('wedge') || patternType.includes('triangle')) && pattern?.lines) {
    const { resistance, support } = pattern.lines;
    
    // Get the actual high and low points that formed the pattern
    const highs = pattern.points.highs || [];
    const lows = pattern.points.lows || [];
    
    // Find the earliest and latest indices among all pattern points
    const allPoints = [...highs, ...lows];
    
    if (allPoints.length === 0) {
      // Fallback to reference line if no points
      return (
        <ReferenceLine
          key={`target-${tIdx}`}
          y={target.value}
          stroke={target.color}
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{
            value: target.label,
            position: 'right',
            fill: target.color,
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />
      );
    }
    
    // Calculate wedge boundaries
    const startIdx = Math.min(...allPoints.map(p => p.index));
    const endIdx = Math.max(...allPoints.map(p => p.index));
    
    // Convert to chart positions
    const startPos = (startIdx / (chartData.length - 1)) * 100;
    const endPos = (endIdx / (chartData.length - 1)) * 100;
    
    const resistanceStart = resistance.slope * startIdx + resistance.intercept;
    const resistanceEnd = resistance.slope * endIdx + resistance.intercept;
    
    const supportStart = support.slope * startIdx + support.intercept;
    const supportEnd = support.slope * endIdx + support.intercept;
    
    const resistancePoints = [
      { xPosition: startPos, value: resistanceStart },
      { xPosition: endPos, value: resistanceEnd }
    ];
    
    const supportPoints = [
      { xPosition: startPos, value: supportStart },
      { xPosition: endPos, value: supportEnd }
    ];
    
    // Convert actual detection points to chart positions for visualization
    const highPointsData = highs.map(high => {
      const xPosition = (high.index / (chartData.length - 1)) * 100;
      return {
        xPosition,
        value: high.value,
        date: high.date,
        pointType: "Resistance Touch",
        patternName: pattern.name,
        patternDirection: pattern.direction
      };
    });
    
    const lowPointsData = lows.map(low => {
      const xPosition = (low.index / (chartData.length - 1)) * 100;
      return {
        xPosition,
        value: low.value,
        date: low.date,
        pointType: "Support Touch",
        patternName: pattern.name,
        patternDirection: pattern.direction
      };
    });
    
    return (
      <React.Fragment key={`wedge-${tIdx}`}>
        {/* Wedge lines */}
        <Line
          type="linear"
          dataKey="value"
          data={resistancePoints}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={6} 
              fill={pattern.color}
              stroke="#ffffff" 
              strokeWidth={1.5}
              opacity={0.8}
            />
          )}
          isAnimationActive={false}
          name={`${pattern.name} Upper Line`}
        />
        
        <Line
          type="linear"
          dataKey="value"
          data={supportPoints}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={6} 
              fill={pattern.color}
              stroke="#ffffff" 
              strokeWidth={1.5}
              opacity={0.8}
            />
          )}
          isAnimationActive={false}
          name={`${pattern.name} Lower Line`}
        />
        
        {/* Touch points */}
        <Line
          type="monotone"
          dataKey="value"
          data={highPointsData}
          stroke="transparent"
          dot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={3} 
              fill={pattern.color}
              stroke="#ffffff" 
              strokeWidth={1}
              opacity={0.5} // Semi-transparent
            />
          )}
          activeDot={(props) => (
            <g>
              <circle 
                cx={props.cx} 
                cy={props.cy} 
                r={6} 
                fill={pattern.color}
                stroke="#ffffff" 
                strokeWidth={2}
              />
              <text 
                x={props.cx + 10} 
                y={props.cy} 
                fill="#ffffff"
                fontSize={12}
                fontWeight="bold"
              >
                ${props.payload.value.toFixed(2)}
              </text>
              {props.payload.date && (
                <text 
                  x={props.cx + 10} 
                  y={props.cy + 15} 
                  fill="#aaaaaa"
                  fontSize={10}
                >
                  {new Date(props.payload.date).toLocaleDateString()}
                </text>
              )}
            </g>
          )}
          isAnimationActive={false}
          name={`${pattern.name} High Points`}
        />
        
        <Line
          type="monotone"
          dataKey="value"
          data={lowPointsData}
          stroke="transparent"
          dot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={3} 
              fill={pattern.color}
              stroke="#ffffff" 
              strokeWidth={1}
              opacity={0.5} // Semi-transparent
            />
          )}
          activeDot={(props) => (
            <g>
              <circle 
                cx={props.cx} 
                cy={props.cy} 
                r={6} 
                fill={pattern.color}
                stroke="#ffffff" 
                strokeWidth={2}
              />
              <text 
                x={props.cx + 10} 
                y={props.cy} 
                fill="#ffffff"
                fontSize={12}
                fontWeight="bold"
              >
                ${props.payload.value.toFixed(2)}
              </text>
              {props.payload.date && (
                <text 
                  x={props.cx + 10} 
                  y={props.cy + 15} 
                  fill="#aaaaaa"
                  fontSize={10}
                >
                  {new Date(props.payload.date).toLocaleDateString()}
                </text>
              )}
            </g>
          )}
          isAnimationActive={false}
          name={`${pattern.name} Low Points`}
        />
        
        {/* Target reference line if available */}
        {pattern.target && (
          <ReferenceLine
            y={pattern.target}
            stroke={pattern.color}
            strokeDasharray="3 3"
            label={{
              value: `Target: $${pattern.target.toFixed(2)}`,
              position: 'right',
              fill: pattern.color,
              fontSize: 10,
              fontWeight: 'bold'
            }}
          />
        )}
      </React.Fragment>
    );
  }
  
  // For rectangle patterns, draw the rectangle outline and detection points
  else if (patternType.includes('rectangle') && pattern?.lines) {
    const { resistance, support } = pattern.lines;
    
    // Get the actual high and low points that formed the pattern
    const highs = pattern.points.highs || [];
    const lows = pattern.points.lows || [];
    
    // Find the earliest and latest indices among all pattern points
    const allPoints = [...highs, ...lows];
    
    if (allPoints.length === 0) {
      // Fallback to reference line if no points
      return (
        <ReferenceLine
          key={`target-${tIdx}`}
          y={target.value}
          stroke={target.color}
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{
            value: target.label,
            position: 'right',
            fill: target.color,
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />
      );
    }
    
    // Calculate rectangle boundaries
    const startIdx = Math.min(...allPoints.map(p => p.index));
    const endIdx = Math.max(...allPoints.map(p => p.index));
    
    // Convert to chart positions
    const startPos = (startIdx / (chartData.length - 1)) * 100;
    const endPos = (endIdx / (chartData.length - 1)) * 100;
    
    // Create rectangle lines with pattern information for hover
    const resistancePoints = [
      { 
        xPosition: startPos, 
        value: resistance.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      },
      { 
        xPosition: endPos, 
        value: resistance.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      }
    ];
    
    const supportPoints = [
      { 
        xPosition: startPos, 
        value: support.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      },
      { 
        xPosition: endPos, 
        value: support.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      }
    ];
    
    // Left and right vertical connecting lines
    const leftPoints = [
      { 
        xPosition: startPos, 
        value: support.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      },
      { 
        xPosition: startPos, 
        value: resistance.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      }
    ];
    
    const rightPoints = [
      { 
        xPosition: endPos, 
        value: support.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      },
      { 
        xPosition: endPos, 
        value: resistance.intercept,
        patternName: pattern.name,
        patternColor: pattern.color,
        patternDirection: pattern.direction
      }
    ];
    
    // Convert actual detection points to chart positions for visualization
    const highPointsData = highs.map(high => {
      const xPosition = (high.index / (chartData.length - 1)) * 100;
      return {
        xPosition,
        value: high.value,
        date: high.date,
        pointType: "Resistance Touch",
        patternName: pattern.name,
        patternDirection: pattern.direction
      };
    });
    
    const lowPointsData = lows.map(low => {
      const xPosition = (low.index / (chartData.length - 1)) * 100;
      return {
        xPosition,
        value: low.value,
        date: low.date,
        pointType: "Support Touch",
        patternName: pattern.name,
        patternDirection: pattern.direction
      };
    });
    
    return (
      <React.Fragment key={`rectangle-${tIdx}`}>
        {/* Rectangle outline */}
        <Line
          type="linear"
          dataKey="value"
          data={resistancePoints}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Resistance Line`}
        />
        
        <Line
          type="linear"
          dataKey="value"
          data={supportPoints}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Support Line`}
        />
        
        <Line
          type="linear"
          dataKey="value"
          data={leftPoints}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Left Side`}
        />
        
        <Line
          type="linear"
          dataKey="value"
          data={rightPoints}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Right Side`}
        />
        
        {/* Show points all the time, but use minimal styling */}
        <Line
          type="monotone"
          dataKey="value"
          data={highPointsData}
          stroke="transparent"
          dot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={3} 
              fill={pattern.color}
              stroke="#ffffff" 
              strokeWidth={1}
              opacity={0.5} // Semi-transparent
            />
          )}
          activeDot={(props) => (
            <g>
              <circle 
                cx={props.cx} 
                cy={props.cy} 
                r={6} 
                fill={pattern.color}
                stroke="#ffffff" 
                strokeWidth={2}
              />
              <text 
                x={props.cx + 10} 
                y={props.cy} 
                fill="#ffffff"
                fontSize={12}
                fontWeight="bold"
              >
                ${props.payload.value.toFixed(2)}
              </text>
              {props.payload.date && (
                <text 
                  x={props.cx + 10} 
                  y={props.cy + 15} 
                  fill="#aaaaaa"
                  fontSize={10}
                >
                  {new Date(props.payload.date).toLocaleDateString()}
                </text>
              )}
            </g>
          )}
          isAnimationActive={false}
          name={`${pattern.name} High Points`}
        />
        
        <Line
          type="monotone"
          dataKey="value"
          data={lowPointsData}
          stroke="transparent"
          dot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={3} 
              fill={pattern.color}
              stroke="#ffffff" 
              strokeWidth={1}
              opacity={0.5} // Semi-transparent
            />
          )}
          activeDot={(props) => (
            <g>
              <circle 
                cx={props.cx} 
                cy={props.cy} 
                r={6} 
                fill={pattern.color}
                stroke="#ffffff" 
                strokeWidth={2}
              />
              <text 
                x={props.cx + 10} 
                y={props.cy} 
                fill="#ffffff"
                fontSize={12}
                fontWeight="bold"
              >
                ${props.payload.value.toFixed(2)}
              </text>
              {props.payload.date && (
                <text 
                  x={props.cx + 10} 
                  y={props.cy + 15} 
                  fill="#aaaaaa"
                  fontSize={10}
                >
                  {new Date(props.payload.date).toLocaleDateString()}
                </text>
              )}
            </g>
          )}
          isAnimationActive={false}
          name={`${pattern.name} Low Points`}
        />
      </React.Fragment>
    );
  }
  
  // For pennant patterns, draw the mast and the pennant (small triangle)
  else if (patternType.includes('pennant') && pattern) {
    // Get mast points
    const mastStart = pattern.points.mastStart;
    const mastEnd = pattern.points.mastEnd;
    
    // If we can't find mast points, fall back to reference line
    if (!mastStart || !mastEnd) {
      return (
        <ReferenceLine
          key={`target-${tIdx}`}
          y={target.value}
          stroke={target.color}
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{
            value: target.label,
            position: 'right',
            fill: target.color,
            fontSize: 10,
            fontWeight: 'bold'
          }}
        />
      );
    }
    
    // Convert indices to chart positions
    const mastStartPos = (mastStart.index / (chartData.length - 1)) * 100;
    const mastEndPos = (mastEnd.index / (chartData.length - 1)) * 100;
    
    // Create mast line
    const mastPoints = [
      { xPosition: mastStartPos, value: mastStart.value },
      { xPosition: mastEndPos, value: mastEnd.value }
    ];
    
    // Find the pennant end (apex or latest point)
    const highs = pattern.points.highs || [];
    const lows = pattern.points.lows || [];
    
    // If no pennant points, just show the mast
    if (highs.length === 0 || lows.length === 0) {
      return (
        <Line
          key={`pennant-mast-${tIdx}`}
          type="linear"
          dataKey="value"
          data={mastPoints}
          stroke={pattern.color}
          strokeWidth={2}
          dot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={4} 
              fill={pattern.color}
              stroke="#fff" 
              strokeWidth={1}
            />
          )}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Mast`}
        />
      );
    }
    
    // Get last high and low point to form the pennant
    const lastHigh = highs[highs.length - 1];
    const lastLow = lows[lows.length - 1];
    
    // Convert to chart positions
    const lastHighPos = (lastHigh.index / (chartData.length - 1)) * 100;
    const lastLowPos = (lastLow.index / (chartData.length - 1)) * 100;
    
    // Find the end of the pennant (furthest index)
    const pennantEndIdx = Math.max(lastHigh.index, lastLow.index);
    const pennantEndPos = (pennantEndIdx / (chartData.length - 1)) * 100;
    
    return (
      <React.Fragment key={`pennant-${tIdx}`}>
        {/* Mast line */}
        <Line
          type="linear"
          dataKey="value"
          data={mastPoints}
          stroke={pattern.color}
          strokeWidth={2}
          dot={(props) => (
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={4} 
              fill={pattern.color}
              stroke="#fff" 
              strokeWidth={1}
            />
          )}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Mast`}
        />
        
        {/* Pennant upper line */}
        <Line
          type="linear"
          dataKey="value"
          data={[
            { xPosition: mastEndPos, value: mastEnd.value },
            { xPosition: lastHighPos, value: lastHigh.value }
          ]}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Upper Pennant`}
        />
        
        {/* Pennant lower line */}
        <Line
          type="linear"
          dataKey="value"
          data={[
            { xPosition: mastEndPos, value: mastEnd.value },
            { xPosition: lastLowPos, value: lastLow.value }
          ]}
          stroke={pattern.color}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
          name={`${pattern.name} Lower Pennant`}
        />
      </React.Fragment>
    );
  }
  
  // For all other patterns, use ReferenceLine
  return (
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
        fontWeight: 'bold'
      }}
    />
  );
})}
            </LineChart>
            {/* Explicit wedge pattern visualization */}
{hasPatterns && chartPatterns.filter(p => p.type.includes('wedge')).map((wedgePattern, idx) => {
  // Only proceed if it's a wedge pattern with lines
  if (!wedgePattern.lines || !wedgePattern.lines.resistance || !wedgePattern.lines.support) return null;
  
  const { resistance, support } = wedgePattern.lines;
  
  // Get chart data range for better positioning
  const firstPointIndex = 0;
  const lastPointIndex = chartData.length - 1;
  
  // Calculate wedge line positions based on slope and intercept
  const resistanceStart = resistance.slope * firstPointIndex + resistance.intercept;
  const resistanceEnd = resistance.slope * lastPointIndex + resistance.intercept;
  
  const supportStart = support.slope * firstPointIndex + support.intercept;
  const supportEnd = support.slope * lastPointIndex + support.intercept;
  
  const lineColor = wedgePattern.type.includes('falling_wedge') ? "#22c55e" : wedgePattern.color;
  
  return (
    <React.Fragment key={`wedge-manual-${idx}`}>
      {/* Top line of wedge */}
      <Line
        type="linear"
        dataKey="value"
        data={[
          { xPosition: 0, value: resistanceStart, 
            wedgeInfo: true, 
            name: wedgePattern.name,
            direction: wedgePattern.direction,
            target: wedgePattern.target
          },
          { xPosition: 100, value: resistanceEnd, 
            wedgeInfo: true,
            name: wedgePattern.name,
            direction: wedgePattern.direction,
            target: wedgePattern.target
          }
        ]}
        stroke={lineColor}
        strokeWidth={2}
        strokeDasharray="5 5"
        dot={false}
        activeDot={(props) => (
          <g>
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={6} 
              fill={lineColor}
              stroke="#ffffff" 
              strokeWidth={2}
            />
            <text 
              x={props.cx + 10} 
              y={props.cy} 
              fill="#ffffff"
              fontSize={12}
              fontWeight="bold"
              textAnchor="start"
            >
              {wedgePattern.name} ({wedgePattern.direction})
            </text>
            {wedgePattern.target && (
              <text 
                x={props.cx + 10} 
                y={props.cy + 15} 
                fill="#aaaaaa"
                fontSize={10}
                textAnchor="start"
              >
                Target: ${wedgePattern.target.toFixed(2)}
              </text>
            )}
          </g>
        )}
        isAnimationActive={false}
      />
      
      {/* Bottom line of wedge */}
      <Line
        type="linear"
        dataKey="value"
        data={[
          { xPosition: 0, value: supportStart, 
            wedgeInfo: true, 
            name: wedgePattern.name,
            direction: wedgePattern.direction,
            target: wedgePattern.target
          },
          { xPosition: 100, value: supportEnd, 
            wedgeInfo: true,
            name: wedgePattern.name,
            direction: wedgePattern.direction,
            target: wedgePattern.target
          }
        ]}
        stroke={lineColor}
        strokeWidth={2}
        strokeDasharray="5 5"
        dot={false}
        activeDot={(props) => (
          <g>
            <circle 
              cx={props.cx} 
              cy={props.cy} 
              r={6} 
              fill={lineColor}
              stroke="#ffffff" 
              strokeWidth={2}
            />
            <text 
              x={props.cx + 10} 
              y={props.cy} 
              fill="#ffffff"
              fontSize={12}
              fontWeight="bold"
              textAnchor="start"
            >
              {wedgePattern.name} ({wedgePattern.direction})
            </text>
            {wedgePattern.target && (
              <text 
                x={props.cx + 10} 
                y={props.cy + 15} 
                fill="#aaaaaa"
                fontSize={10}
                textAnchor="start"
              >
                Target: ${wedgePattern.target.toFixed(2)}
              </text>
            )}
          </g>
        )}
        isAnimationActive={false}
      />
    </React.Fragment>
  );
})}
          </ResponsiveContainer>
        </div>
        
        {analysisContent()}
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
      {renderChart(longTermData, patterns.long, "Chart Patterns (200-Day)")}
      {renderChart(shortTermData, patterns.short, "Chart Patterns (40-Day)")}
      {renderChart(veryShortTermData, patterns.veryShort, "Chart Patterns (10-Day)")}
    </div>
  );
};

export default EnhancedClassicPatternDetector;