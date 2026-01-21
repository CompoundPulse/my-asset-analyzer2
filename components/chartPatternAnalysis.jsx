// Enhanced chart pattern analysis algorithms
export const chartPatternAnalysis = {
    // Existing function - Identify bullish/bearish trends
    analyzeTrend: (data) => {
      if (!data || data.length < 4) return { trend: 'neutral', strength: 0 };
      
      const prices = data.map(d => d.value);
      
      // Find local extrema (highs and lows)
      const highs = [];
      const lows = [];
      
      for (let i = 2; i < prices.length - 2; i++) {
        // Local high
        if (prices[i] > prices[i-1] && prices[i] > prices[i-2] && 
            prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
          highs.push({ value: prices[i], index: i, date: data[i].date });
        }
        
        // Local low
        if (prices[i] < prices[i-1] && prices[i] < prices[i-2] && 
            prices[i] < prices[i+1] && prices[i] < prices[i+2]) {
          lows.push({ value: prices[i], index: i, date: data[i].date });
        }
      }
      
      // Need at least 2 highs and 2 lows to determine trend
      if (highs.length < 2 || lows.length < 2) return { trend: 'neutral', strength: 0 };
      
      // Sort by index to get chronological order
      highs.sort((a, b) => a.index - b.index);
      lows.sort((a, b) => a.index - b.index);
      
      // Check if higher highs and higher lows (bullish)
      const higherHighs = highs[highs.length - 1].value > highs[highs.length - 2].value;
      const higherLows = lows[lows.length - 1].value > lows[lows.length - 2].value;
      
      // Check if lower highs and lower lows (bearish)
      const lowerHighs = highs[highs.length - 1].value < highs[highs.length - 2].value;
      const lowerLows = lows[lows.length - 1].value < lows[lows.length - 2].value;
      
      let trend = 'neutral';
      let strength = 0;
      
      if (higherHighs && higherLows) {
        trend = 'bullish';
        strength = 2; // Strong bullish
      } else if (higherHighs) {
        trend = 'bullish';
        strength = 1; // Moderately bullish
      } else if (lowerLows && lowerHighs) {
        trend = 'bearish';
        strength = 2; // Strong bearish
      } else if (lowerLows) {
        trend = 'bearish';
        strength = 1; // Moderately bearish
      }
      
      return { 
        trend, 
        strength,
        highs, 
        lows,
        description: trend === 'bullish' 
          ? `${strength === 2 ? 'Strong' : 'Moderate'} bullish trend with ${higherHighs ? 'higher highs' : ''} ${higherHighs && higherLows ? 'and' : ''} ${higherLows ? 'higher lows' : ''}`
          : trend === 'bearish'
            ? `${strength === 2 ? 'Strong' : 'Moderate'} bearish trend with ${lowerHighs ? 'lower highs' : ''} ${lowerHighs && lowerLows ? 'and' : ''} ${lowerLows ? 'lower lows' : ''}`
            : 'Neutral trend'
      };
    },
    
    // Existing function - Detect standard head and shoulders pattern
    findHeadAndShoulders: (data) => {
      if (!data || data.length < 10) return [];
      
      const prices = data.map(d => d.value);
      
      // Find local maxima (potential shoulders and head)
      const peaks = [];
      for (let i = 2; i < prices.length - 2; i++) {
        if (prices[i] > prices[i-1] && 
            prices[i] > prices[i-2] &&
            prices[i] > prices[i+1] &&
            prices[i] > prices[i+2]) {
          peaks.push({ 
            value: prices[i], 
            index: i,
            date: data[i].date
          });
        }
      }
      
      if (peaks.length < 3) return []; // Need at least 3 peaks
      
      const patterns = [];
      
      // Look for head and shoulders pattern
      for (let i = 0; i < peaks.length - 2; i++) {
        const leftShoulder = peaks[i];
        const head = peaks[i + 1];
        const rightShoulder = peaks[i + 2];
        
        // Criteria for H&S pattern:
        // 1. Head is higher than both shoulders
        // 2. Shoulders are roughly at the same level (within 5%)
        // 3. There is a clear distance between peaks
        if (head.value > leftShoulder.value && 
            head.value > rightShoulder.value &&
            Math.abs(leftShoulder.value - rightShoulder.value) / leftShoulder.value < 0.05 &&
            head.index - leftShoulder.index >= 3 &&
            rightShoulder.index - head.index >= 3) {
          
          // Find the neckline by connecting troughs between the peaks
          let neckline = { slope: 0, intercept: 0 };
          
          // Find lowest points between left shoulder and head
          let lowestBetweenLeftAndHead = Infinity;
          let lowestBetweenLeftAndHeadIndex = leftShoulder.index;
          
          for (let j = leftShoulder.index + 1; j < head.index; j++) {
            if (prices[j] < lowestBetweenLeftAndHead) {
              lowestBetweenLeftAndHead = prices[j];
              lowestBetweenLeftAndHeadIndex = j;
            }
          }
          
          // Find lowest points between head and right shoulder
          let lowestBetweenHeadAndRight = Infinity;
          let lowestBetweenHeadAndRightIndex = head.index;
          
          for (let j = head.index + 1; j < rightShoulder.index; j++) {
            if (prices[j] < lowestBetweenHeadAndRight) {
              lowestBetweenHeadAndRight = prices[j];
              lowestBetweenHeadAndRightIndex = j;
            }
          }
          
          // Calculate neckline (linear regression between two troughs)
          const x1 = lowestBetweenLeftAndHeadIndex;
          const y1 = lowestBetweenLeftAndHead;
          const x2 = lowestBetweenHeadAndRightIndex;
          const y2 = lowestBetweenHeadAndRight;
          
          // Calculate slope and intercept for the neckline
          const slope = (y2 - y1) / (x2 - x1);
          const intercept = y1 - slope * x1;
          
          neckline = {
            slope,
            intercept,
            point1: { 
              index: lowestBetweenLeftAndHeadIndex,
              value: lowestBetweenLeftAndHead,
              date: data[lowestBetweenLeftAndHeadIndex].date
            },
            point2: {
              index: lowestBetweenHeadAndRightIndex,
              value: lowestBetweenHeadAndRight,
              date: data[lowestBetweenHeadAndRightIndex].date
            }
          };
          
          // Target calculation (measured move): head height from neckline
          const necklineAtHead = neckline.slope * head.index + neckline.intercept;
          const headHeight = head.value - necklineAtHead;
          const targetPrice = necklineAtHead - headHeight;
          
          // Calculate pattern completion percentage 
          let completion = 0;
          if (rightShoulder.index < data.length - 1) {
            const lastPrice = prices[prices.length - 1];
            const necklineAtEnd = neckline.slope * (prices.length - 1) + neckline.intercept;
            
            if (lastPrice < necklineAtEnd) {
              // Price has broken the neckline
              const targetDist = necklineAtEnd - targetPrice;
              const currentDist = necklineAtEnd - lastPrice;
              completion = Math.min(currentDist / targetDist, 1) * 100;
            }
          }
          
          patterns.push({
            type: 'head_and_shoulders',
            leftShoulder,
            head,
            rightShoulder,
            neckline,
            targetPrice,
            completion,
            reliability: 
              (Math.abs(leftShoulder.value - rightShoulder.value) < 0.03 * head.value) ? 'high' :
              (Math.abs(leftShoulder.value - rightShoulder.value) < 0.05 * head.value) ? 'medium' : 'low'
          });
        }
      }
      
      return patterns;
    },
    
    // Existing function - Detect inverse head and shoulders pattern
    findInverseHeadAndShoulders: (data) => {
      if (!data || data.length < 10) return [];
      
      const prices = data.map(d => d.value);
      
      // Find local minima (potential shoulders and head for inverse pattern)
      const troughs = [];
      for (let i = 2; i < prices.length - 2; i++) {
        if (prices[i] < prices[i-1] && 
            prices[i] < prices[i-2] &&
            prices[i] < prices[i+1] &&
            prices[i] < prices[i+2]) {
          troughs.push({ 
            value: prices[i], 
            index: i,
            date: data[i].date
          });
        }
      }
      
      if (troughs.length < 3) return []; // Need at least 3 troughs
      
      const patterns = [];
      
      // Look for inverse head and shoulders pattern
      for (let i = 0; i < troughs.length - 2; i++) {
        const leftShoulder = troughs[i];
        const head = troughs[i + 1];
        const rightShoulder = troughs[i + 2];
        
        // Criteria for inverse H&S pattern:
        // 1. Head is lower than both shoulders
        // 2. Shoulders are roughly at the same level (within 5%)
        // 3. There is a clear distance between troughs
        if (head.value < leftShoulder.value && 
            head.value < rightShoulder.value &&
            Math.abs(leftShoulder.value - rightShoulder.value) / leftShoulder.value < 0.05 &&
            head.index - leftShoulder.index >= 3 &&
            rightShoulder.index - head.index >= 3) {
          
          // Find the neckline by connecting peaks between the troughs
          let neckline = { slope: 0, intercept: 0 };
          
          // Find highest points between left shoulder and head
          let highestBetweenLeftAndHead = -Infinity;
          let highestBetweenLeftAndHeadIndex = leftShoulder.index;
          
          for (let j = leftShoulder.index + 1; j < head.index; j++) {
            if (prices[j] > highestBetweenLeftAndHead) {
              highestBetweenLeftAndHead = prices[j];
              highestBetweenLeftAndHeadIndex = j;
            }
          }
          
          // Find highest points between head and right shoulder
          let highestBetweenHeadAndRight = -Infinity;
          let highestBetweenHeadAndRightIndex = head.index;
          
          for (let j = head.index + 1; j < rightShoulder.index; j++) {
            if (prices[j] > highestBetweenHeadAndRight) {
              highestBetweenHeadAndRight = prices[j];
              highestBetweenHeadAndRightIndex = j;
            }
          }
          
          // Calculate neckline (linear regression between two peaks)
          const x1 = highestBetweenLeftAndHeadIndex;
          const y1 = highestBetweenLeftAndHead;
          const x2 = highestBetweenHeadAndRightIndex;
          const y2 = highestBetweenHeadAndRight;
          
          // Calculate slope and intercept for the neckline
          const slope = (y2 - y1) / (x2 - x1);
          const intercept = y1 - slope * x1;
          
          neckline = {
            slope,
            intercept,
            point1: { 
              index: highestBetweenLeftAndHeadIndex,
              value: highestBetweenLeftAndHead,
              date: data[highestBetweenLeftAndHeadIndex].date
            },
            point2: {
              index: highestBetweenHeadAndRightIndex,
              value: highestBetweenHeadAndRight,
              date: data[highestBetweenHeadAndRightIndex].date
            }
          };
          
          // Target calculation (measured move): head depth from neckline
          const necklineAtHead = neckline.slope * head.index + neckline.intercept;
          const headDepth = necklineAtHead - head.value;
          const targetPrice = necklineAtHead + headDepth;
          
          // Calculate pattern completion percentage 
          let completion = 0;
          if (rightShoulder.index < data.length - 1) {
            const lastPrice = prices[prices.length - 1];
            const necklineAtEnd = neckline.slope * (prices.length - 1) + neckline.intercept;
            
            if (lastPrice > necklineAtEnd) {
              // Price has broken the neckline
              const targetDist = targetPrice - necklineAtEnd;
              const currentDist = lastPrice - necklineAtEnd;
              completion = Math.min(currentDist / targetDist, 1) * 100;
            }
          }
          
          patterns.push({
            type: 'inverse_head_and_shoulders',
            leftShoulder,
            head,
            rightShoulder,
            neckline,
            targetPrice,
            completion,
            reliability: 
              (Math.abs(leftShoulder.value - rightShoulder.value) < 0.03 * head.value) ? 'high' :
              (Math.abs(leftShoulder.value - rightShoulder.value) < 0.05 * head.value) ? 'medium' : 'low'
          });
        }
      }
      
      return patterns;
    },
    
    // Improved function - Find support and resistance levels
    findSupportResistance: (data, lookback = 30) => {
      if (!data || data.length < lookback) return { support: [], resistance: [] };
      
      const prices = data.map(d => d.value);
      const recentData = data.slice(-lookback);
      const recentPrices = recentData.map(d => d.value);
      
      // Use a price bin approach to find clusters
      const priceBins = {};
      // Make bin size smaller for more precision
      const binSize = Math.max(...recentPrices) * 0.003; // 0.3% of max price
      
      // Create price bins and count touches
      recentPrices.forEach((price, idx) => {
        const binIndex = Math.floor(price / binSize);
        if (!priceBins[binIndex]) {
          priceBins[binIndex] = {
            count: 0,
            touches: [],
            pivots: 0
          };
        }
        priceBins[binIndex].count++;
        priceBins[binIndex].touches.push({
          index: idx,
          date: recentData[idx].date,
          price: price
        });
      });
      
      // Find pivot points (local maxima and minima)
      for (let i = 2; i < recentData.length - 2; i++) {
        const price = recentData[i].value;
        const binIndex = Math.floor(price / binSize);
        
        // Check if it's a pivot point (local max or min)
        const isPivotHigh = recentPrices[i] > recentPrices[i-1] && recentPrices[i] > recentPrices[i-2] && 
                        recentPrices[i] > recentPrices[i+1] && recentPrices[i] > recentPrices[i+2];
        
        const isPivotLow = recentPrices[i] < recentPrices[i-1] && recentPrices[i] < recentPrices[i-2] && 
                      recentPrices[i] < recentPrices[i+1] && recentPrices[i] < recentPrices[i+2];
        
        if (isPivotHigh || isPivotLow) {
          if (priceBins[binIndex]) {
            priceBins[binIndex].pivots++;
            priceBins[binIndex].touches.push({
              index: i,
              date: recentData[i].date,
              type: isPivotHigh ? 'high' : 'low'
            });
          }
        }
      }
      
      // Validate bins - require at least 3 touches with at least 2 being pivot points
      const validBins = Object.entries(priceBins)
        .filter(([_, data]) => data.count >= 3 && data.pivots >= 2)
        .map(([bin, data]) => ({
          price: parseFloat(bin) * binSize + binSize / 2,
          strength: data.count,
          pivots: data.pivots,
          touches: data.touches
        }))
        .sort((a, b) => b.pivots - a.pivots);
      
      // Classify as support or resistance based on last price
      const lastPrice = prices[prices.length - 1];
      
      // Check if a level has been both support and resistance (more significant)
      validBins.forEach(bin => {
        const touchTypes = bin.touches.filter(t => t.type).map(t => t.type);
        bin.hasActedAsBoth = touchTypes.includes('high') && touchTypes.includes('low');
      });
      
      const support = validBins
        .filter(bin => bin.price < lastPrice)
        .map(bin => ({
          price: bin.price,
          strength: bin.strength,
          pivots: bin.pivots, 
          hasActedAsBoth: bin.hasActedAsBoth,
          distance: lastPrice - bin.price,
          percentDistance: (lastPrice - bin.price) / lastPrice * 100,
          reliability: bin.pivots >= 3 ? 'high' : bin.pivots >= 2 ? 'medium' : 'low'
        }))
        .sort((a, b) => a.distance - b.distance);
        
      const resistance = validBins
        .filter(bin => bin.price > lastPrice)
        .map(bin => ({
          price: bin.price,
          strength: bin.strength,
          pivots: bin.pivots,
          hasActedAsBoth: bin.hasActedAsBoth,
          distance: bin.price - lastPrice,
          percentDistance: (bin.price - lastPrice) / lastPrice * 100,
          reliability: bin.pivots >= 3 ? 'high' : bin.pivots >= 2 ? 'medium' : 'low'
        }))
        .sort((a, b) => a.distance - b.distance);
      
      return { support, resistance };
    },
    
    // Existing function - Find trend lines
    findTrendLines: (data) => {
      if (!data || data.length < 10) return { uptrend: null, downtrend: null };
      
      const prices = data.map(d => d.value);
      const indices = Array.from(Array(prices.length).keys());
      
      // Find potential bottom trend line (uptrend)
      const lows = [];
      for (let i = 2; i < prices.length - 2; i++) {
        if (prices[i] < prices[i-1] && prices[i] < prices[i-2] && 
            prices[i] < prices[i+1] && prices[i] < prices[i+2]) {
          lows.push({
            value: prices[i],
            index: i,
            date: data[i].date
          });
        }
      }
      
      // Find potential top trend line (downtrend)
      const highs = [];
      for (let i = 2; i < prices.length - 2; i++) {
        if (prices[i] > prices[i-1] && prices[i] > prices[i-2] && 
            prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
          highs.push({
            value: prices[i],
            index: i,
            date: data[i].date
          });
        }
      }
      
      let uptrend = null;
      if (lows.length >= 2) {
        // Sort by ascending index
        lows.sort((a, b) => a.index - b.index);
        
        // Find best uptrend line by using recent lows
        const recentLows = lows.slice(-3); // Use last 3 lows
        
        if (recentLows.length >= 2) {
          // Use the most recent low points to define the trend line
          const x1 = recentLows[0].index;
          const y1 = recentLows[0].value;
          const x2 = recentLows[recentLows.length - 1].index;
          const y2 = recentLows[recentLows.length - 1].value;
          
          // Only consider rising trend lines
          if (y2 > y1) {
            const slope = (y2 - y1) / (x2 - x1);
            const intercept = y1 - slope * x1;
            
            uptrend = {
              slope,
              intercept,
              point1: recentLows[0],
              point2: recentLows[recentLows.length - 1],
              touches: recentLows.length,
              reliability: recentLows.length >= 3 ? 'high' : 'medium'
            };
          }
        }
      }
      
      let downtrend = null;
      if (highs.length >= 2) {
        // Sort by ascending index
        highs.sort((a, b) => a.index - b.index);
        
        // Find best downtrend line by using recent highs
        const recentHighs = highs.slice(-3); // Use last 3 highs
        
        if (recentHighs.length >= 2) {
          // Use the most recent high points to define the trend line
          const x1 = recentHighs[0].index;
          const y1 = recentHighs[0].value;
          const x2 = recentHighs[recentHighs.length - 1].index;
          const y2 = recentHighs[recentHighs.length - 1].value;
          
          // Only consider falling trend lines
          if (y2 < y1) {
            const slope = (y2 - y1) / (x2 - x1);
            const intercept = y1 - slope * x1;
            
            downtrend = {
              slope,
              intercept,
              point1: recentHighs[0],
              point2: recentHighs[recentHighs.length - 1],
              touches: recentHighs.length,
              reliability: recentHighs.length >= 3 ? 'high' : 'medium'
            };
          }
        }
      }
      
      return { uptrend, downtrend };
    },
    
    // New function - Volume analysis
    analyzeVolume: (priceData, volumeData) => {
      if (!priceData || !volumeData || volumeData.length < 5) 
        return { volumeTrend: 'neutral', confirmation: false };
      
      // Calculate average volume
      const avgVolume = volumeData.reduce((sum, vol) => sum + vol, 0) / volumeData.length;
      
      // Check for volume confirmation of price trends
      const recentVolumes = volumeData.slice(-5);
      const recentPrices = priceData.slice(-5).map(d => d.value);
      
      // Check if volume increases on upward price movement (bullish)
      const volumeIncreaseOnPriceUp = recentPrices[recentPrices.length-1] > recentPrices[recentPrices.length-2] && 
                                    recentVolumes[recentVolumes.length-1] > avgVolume * 1.2;
      
      // Check if volume increases on downward price movement (bearish)
      const volumeIncreaseOnPriceDown = recentPrices[recentPrices.length-1] < recentPrices[recentPrices.length-2] && 
                                      recentVolumes[recentVolumes.length-1] > avgVolume * 1.2;
      
      let volumeTrend = 'neutral';
      if (volumeIncreaseOnPriceUp) volumeTrend = 'bullish';
      else if (volumeIncreaseOnPriceDown) volumeTrend = 'bearish';
      
      return {
        volumeTrend,
        confirmation: volumeIncreaseOnPriceUp || volumeIncreaseOnPriceDown,
        averageVolume: avgVolume,
        currentVolume: recentVolumes[recentVolumes.length-1]
      };
    },
    
    // New function - Fibonacci retracement levels
    calculateFibonacciLevels: (data) => {
      if (!data || data.length < 10) return null;
      
      const prices = data.map(d => d.value);
      let highestPrice = Math.max(...prices);
      let lowestPrice = Math.min(...prices);
      
      // Get indexes of high and low
      const highestIndex = prices.indexOf(highestPrice);
      const lowestIndex = prices.indexOf(lowestPrice);
      
      // Determine if we're in an uptrend or downtrend
      const isUptrend = highestIndex > lowestIndex;
      
      // Fibonacci ratios
      const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      
      // Calculate retracement levels
      const range = highestPrice - lowestPrice;
      const levels = fibLevels.map(level => {
        const price = isUptrend 
          ? highestPrice - range * level
          : lowestPrice + range * level;
        
        return {
          ratio: level,
          price: price,
          isUptrend
        };
      });
      
      return {
        levels,
        highestPrice,
        lowestPrice,
        highestIndex,
        lowestIndex,
        isUptrend
      };
    },
    
    // New function - Moving Average Crossovers
    detectMACrossover: (data, shortPeriod = 50, longPeriod = 200) => {
      if (!data || data.length < longPeriod + 5) return { crossovers: [] };
      
      const prices = data.map(d => d.value);
      const shortMA = [];
      const longMA = [];
      const crossovers = [];
      
      // Calculate moving averages
      for (let i = longPeriod - 1; i < prices.length; i++) {
        // Calculate short MA
        let shortSum = 0;
        for (let j = i - shortPeriod + 1; j <= i; j++) {
          shortSum += prices[j];
        }
        shortMA.push({
          value: shortSum / shortPeriod,
          index: i,
          date: data[i].date
        });
        
        // Calculate long MA
        let longSum = 0;
        for (let j = i - longPeriod + 1; j <= i; j++) {
          longSum += prices[j];
        }
        longMA.push({
          value: longSum / longPeriod,
          index: i,
          date: data[i].date
        });
        
        // Check for crossovers
        if (shortMA.length > 1 && longMA.length > 1) {
          const shortMAIndex = shortMA.length - 1;
          const longMAIndex = longMA.length - 1;
          
          // Golden Cross (short MA crosses above long MA)
          if (shortMA[shortMAIndex-1].value <= longMA[longMAIndex-1].value && 
              shortMA[shortMAIndex].value > longMA[longMAIndex].value) {
            crossovers.push({
              type: 'golden_cross',
              index: i,
              date: data[i].date,
              shortMA: shortMA[shortMAIndex].value,
              longMA: longMA[longMAIndex].value,
              significance: 'high'
            });
          }
          
          // Death Cross (short MA crosses below long MA)
          if (shortMA[shortMAIndex-1].value >= longMA[longMAIndex-1].value && 
              shortMA[shortMAIndex].value < longMA[longMAIndex].value) {
            crossovers.push({
              type: 'death_cross',
              index: i,
              date: data[i].date,
              shortMA: shortMA[shortMAIndex].value,
              longMA: longMA[longMAIndex].value,
              significance: 'high'
            });
          }
        }
      }
      
      return {
        crossovers,
        shortMA,
        longMA
      };
    },
    
    // New function - Detect candlestick patterns
    detectCandlestickPatterns: (data) => {
      if (!data || data.length < 5) return [];
      
      const patterns = [];
      
      // Ensure data has OHLC properties
      if (!data[0].open || !data[0].high || !data[0].low || !data[0].close) {
        return patterns;
      }
      
      // Calculate candlestick properties
      const candles = data.map(d => {
        const isGreen = d.close > d.open;
        const body = Math.abs(d.close - d.open);
        const upperWick = isGreen ? d.high - d.close : d.high - d.open;
        const lowerWick = isGreen ? d.open - d.low : d.close - d.low;
        const totalHeight = d.high - d.low;
        
        return {
          date: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          isGreen,
          body,
          upperWick,
        lowerWick,
        totalHeight
      };
    });
    
    // Detect doji (small body, similar length wicks)
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (c.body < c.totalHeight * 0.1 && 
          Math.abs(c.upperWick - c.lowerWick) < c.totalHeight * 0.1) {
        patterns.push({
          type: 'doji',
          index: i,
          date: c.date,
          significance: 'high'
        });
      }
    }
    
    // Detect hammer (small body at top, long lower wick)
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (c.lowerWick > c.body * 2 && c.upperWick < c.body * 0.5) {
        patterns.push({
          type: 'hammer',
          index: i,
          date: c.date,
          significance: 'high'
        });
      }
    }
    
    return patterns;
  },
  
  // Complete analysis in one call
  analyzeChart: (data, timeframe = 'medium') => {
    if (!data || data.length < 10) {
      return {
        timeframe,
        trend: { trend: 'neutral', strength: 0 },
        headAndShoulders: [],
        inverseHeadAndShoulders: [],
        supportResistance: { support: [], resistance: [] },
        trendLines: { uptrend: null, downtrend: null }
      };
    }
    
    const trend = chartPatternAnalysis.analyzeTrend(data);
    const headAndShoulders = chartPatternAnalysis.findHeadAndShoulders(data);
    const inverseHeadAndShoulders = chartPatternAnalysis.findInverseHeadAndShoulders(data);
    const supportResistance = chartPatternAnalysis.findSupportResistance(data);
    const trendLines = chartPatternAnalysis.findTrendLines(data);
    const fibonacciLevels = chartPatternAnalysis.calculateFibonacciLevels(data);
    
    // Only calculate MA crossover if we have enough data
    let maCrossover = { crossovers: [] };
    if (data.length >= 200) {
      maCrossover = chartPatternAnalysis.detectMACrossover(data);
    }
    
    // If we have OHLC data, detect candlestick patterns
    let candlestickPatterns = [];
    if (data[0] && data[0].open && data[0].high && data[0].low && data[0].close) {
      candlestickPatterns = chartPatternAnalysis.detectCandlestickPatterns(data);
    }
    
    return {
      timeframe,
      trend,
      headAndShoulders,
      inverseHeadAndShoulders,
      supportResistance,
      trendLines,
      fibonacciLevels,
      maCrossover,
      candlestickPatterns
    };
  }
};

// New function to detect Harmonic Patterns (Gartley, Bat, Butterfly, Crab)
export const detectHarmonicPatterns = (data) => {
  if (!data || data.length < 20) return [];
  
  const prices = data.map(d => d.value);
  const patterns = [];
  
  // Find swing highs and lows
  const swings = findSwings(data);
  
  // Need at least 5 points (X, A, B, C, D) to form a harmonic pattern
  if (swings.length < 5) return patterns;
  
  // Check for patterns in the recent swing points
  for (let i = 0; i < swings.length - 4; i++) {
    const pointX = swings[i];
    const pointA = swings[i+1];
    const pointB = swings[i+2];
    const pointC = swings[i+3];
    const pointD = swings[i+4];
    
    // Only check if we have alternating highs and lows
    if (pointX.type === pointA.type || pointA.type === pointB.type || 
        pointB.type === pointC.type || pointC.type === pointD.type) {
      continue;
    }
    
    // Calculate Fibonacci ratios between points
    const xaDistance = Math.abs(pointA.value - pointX.value);
    const abDistance = Math.abs(pointB.value - pointA.value);
    const bcDistance = Math.abs(pointC.value - pointB.value);
    const cdDistance = Math.abs(pointD.value - pointC.value);
    const xdDistance = Math.abs(pointD.value - pointX.value);
    
    // Calculate retracement ratios
    const abXaRatio = abDistance / xaDistance;
    const bcAbRatio = bcDistance / abDistance;
    const cdBcRatio = cdDistance / bcDistance;
    const xdXaRatio = xdDistance / xaDistance;
    
    // Check Gartley pattern
    if (isCloseToRatio(abXaRatio, 0.618, 0.05) && 
        (isCloseToRatio(bcAbRatio, 0.382, 0.05) || isCloseToRatio(bcAbRatio, 0.886, 0.05)) &&
        ((isCloseToRatio(bcAbRatio, 0.382, 0.05) && isCloseToRatio(cdBcRatio, 1.272, 0.05)) || 
         (isCloseToRatio(bcAbRatio, 0.886, 0.05) && isCloseToRatio(cdBcRatio, 1.618, 0.05))) &&
        isCloseToRatio(xdXaRatio, 0.786, 0.05)) {
      
      patterns.push({
        type: pointX.value < pointA.value ? 'bearish_gartley' : 'bullish_gartley',
        points: { X: pointX, A: pointA, B: pointB, C: pointC, D: pointD },
        ratios: { AB_XA: abXaRatio, BC_AB: bcAbRatio, CD_BC: cdBcRatio, XD_XA: xdXaRatio },
        reliability: 'high',
        significance: 'high',
        name: "Gartley '222'"
      });
    }
    
    // Check Crab pattern
    if ((isCloseToRatio(abXaRatio, 0.382, 0.05) || isCloseToRatio(abXaRatio, 0.618, 0.05)) && 
        (isCloseToRatio(bcAbRatio, 0.382, 0.05) || isCloseToRatio(bcAbRatio, 0.886, 0.05)) &&
        ((isCloseToRatio(bcAbRatio, 0.382, 0.05) && isCloseToRatio(cdBcRatio, 2.24, 0.1)) || 
         (isCloseToRatio(bcAbRatio, 0.886, 0.05) && isCloseToRatio(cdBcRatio, 3.618, 0.15))) &&
        isCloseToRatio(xdXaRatio, 1.618, 0.1)) {
      
      patterns.push({
        type: pointX.value < pointA.value ? 'bearish_crab' : 'bullish_crab',
        points: { X: pointX, A: pointA, B: pointB, C: pointC, D: pointD },
        ratios: { AB_XA: abXaRatio, BC_AB: bcAbRatio, CD_BC: cdBcRatio, XD_XA: xdXaRatio },
        reliability: 'high',
        significance: 'high',
        name: "Crab"
      });
    }
    
    // Check Bat pattern
    if ((isCloseToRatio(abXaRatio, 0.382, 0.05) || isCloseToRatio(abXaRatio, 0.5, 0.05)) && 
        (isCloseToRatio(bcAbRatio, 0.382, 0.05) || isCloseToRatio(bcAbRatio, 0.886, 0.05)) &&
        ((isCloseToRatio(bcAbRatio, 0.382, 0.05) && isCloseToRatio(cdBcRatio, 1.618, 0.1)) || 
         (isCloseToRatio(bcAbRatio, 0.886, 0.05) && isCloseToRatio(cdBcRatio, 2.618, 0.15))) &&
        isCloseToRatio(xdXaRatio, 0.886, 0.05)) {
      
      patterns.push({
        type: pointX.value < pointA.value ? 'bearish_bat' : 'bullish_bat',
        points: { X: pointX, A: pointA, B: pointB, C: pointC, D: pointD },
        ratios: { AB_XA: abXaRatio, BC_AB: bcAbRatio, CD_BC: cdBcRatio, XD_XA: xdXaRatio },
        reliability: 'high',
        significance: 'high',
        name: "Bat"
      });
    }
    
    // Check Butterfly pattern
    if (isCloseToRatio(abXaRatio, 0.786, 0.05) && 
        (isCloseToRatio(bcAbRatio, 0.382, 0.05) || isCloseToRatio(bcAbRatio, 0.886, 0.05)) &&
        ((isCloseToRatio(bcAbRatio, 0.382, 0.05) && isCloseToRatio(cdBcRatio, 1.618, 0.1)) || 
         (isCloseToRatio(bcAbRatio, 0.886, 0.05) && isCloseToRatio(cdBcRatio, 2.618, 0.15))) &&
        (isCloseToRatio(xdXaRatio, 1.27, 0.05) || isCloseToRatio(xdXaRatio, 1.618, 0.05))) {
      
      patterns.push({
        type: pointX.value < pointA.value ? 'bearish_butterfly' : 'bullish_butterfly',
        points: { X: pointX, A: pointA, B: pointB, C: pointC, D: pointD },
        ratios: { AB_XA: abXaRatio, BC_AB: bcAbRatio, CD_BC: cdBcRatio, XD_XA: xdXaRatio },
        reliability: 'high',
        significance: 'high',
        name: "Butterfly"
      });
    }
  }
  
  // Sort by pattern formation completion time (most recent first)
  return patterns.sort((a, b) => b.points.D.index - a.points.D.index);
};

// Helper function to find the swing highs and lows
function findSwings(data) {
  if (!data || data.length < 5) return [];
  
  const prices = data.map(d => d.value);
  const swings = [];
  
  // Find swing highs (peaks)
  for (let i = 2; i < prices.length - 2; i++) {
    // Swing high
    if (prices[i] > prices[i-1] && prices[i] > prices[i-2] && 
        prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
      swings.push({
        index: i,
        date: data[i].date,
        value: prices[i],
        type: 'high'
      });
    }
    
    // Swing low
    if (prices[i] < prices[i-1] && prices[i] < prices[i-2] && 
        prices[i] < prices[i+1] && prices[i] < prices[i+2]) {
      swings.push({
        index: i,
        date: data[i].date,
        value: prices[i],
        type: 'low'
      });
    }
  }
  
  // Sort chronologically by index
  return swings.sort((a, b) => a.index - b.index);
}

// Helper function to check if a ratio is close to a target value
function isCloseToRatio(actual, target, tolerance) {
  return Math.abs(actual - target) <= tolerance;
}

// Add to the chartPatternAnalysis object
export const chartPatternAnalysisWithHarmonics = {
  // Original methods
  analyzeTrend: chartPatternAnalysis.analyzeTrend,
  findHeadAndShoulders: chartPatternAnalysis.findHeadAndShoulders,
  findInverseHeadAndShoulders: chartPatternAnalysis.findInverseHeadAndShoulders,
  findSupportResistance: chartPatternAnalysis.findSupportResistance,
  findTrendLines: chartPatternAnalysis.findTrendLines,
  analyzeVolume: chartPatternAnalysis.analyzeVolume,
  calculateFibonacciLevels: chartPatternAnalysis.calculateFibonacciLevels,
  detectMACrossover: chartPatternAnalysis.detectMACrossover,
  detectCandlestickPatterns: chartPatternAnalysis.detectCandlestickPatterns,
  
  // New method for harmonic patterns
  detectHarmonicPatterns,
  
  // Enhanced analyzeChart function that includes harmonic patterns
  analyzeChart: (data, timeframe = 'medium') => {
    if (!data || data.length < 10) {
      return {
        timeframe,
        trend: { trend: 'neutral', strength: 0 },
        headAndShoulders: [],
        inverseHeadAndShoulders: [],
        supportResistance: { support: [], resistance: [] },
        trendLines: { uptrend: null, downtrend: null },
        harmonicPatterns: []
      };
    }
    
    const trend = chartPatternAnalysis.analyzeTrend(data);
    const headAndShoulders = chartPatternAnalysis.findHeadAndShoulders(data);
    const inverseHeadAndShoulders = chartPatternAnalysis.findInverseHeadAndShoulders(data);
    const supportResistance = chartPatternAnalysis.findSupportResistance(data);
    const trendLines = chartPatternAnalysis.findTrendLines(data);
    const fibonacciLevels = chartPatternAnalysis.calculateFibonacciLevels(data);
    const harmonicPatterns = detectHarmonicPatterns(data);
    
    // Only calculate MA crossover if we have enough data
    let maCrossover = { crossovers: [] };
    if (data.length >= 200) {
      maCrossover = chartPatternAnalysis.detectMACrossover(data);
    }
    
    // If we have OHLC data, detect candlestick patterns
    let candlestickPatterns = [];
    if (data[0] && data[0].open && data[0].high && data[0].low && data[0].close) {
      candlestickPatterns = chartPatternAnalysis.detectCandlestickPatterns(data);
    }
    
    return {
      timeframe,
      trend,
      headAndShoulders,
      inverseHeadAndShoulders,
      supportResistance,
      trendLines,
      fibonacciLevels,
      maCrossover,
      candlestickPatterns,
      harmonicPatterns
    };
  }
};