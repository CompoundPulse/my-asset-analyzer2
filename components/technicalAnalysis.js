// technicalAnalysis.js

// Utility function to calculate mean
const calculateMean = (arr) => {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

// Utility function to extract price from data points with different formats
const extractPrice = (dataPoint) => {
  // Handle different data formats (string, number, or object with different properties)
  if (dataPoint === null || dataPoint === undefined) return NaN;
  
  // Number format
  if (typeof dataPoint === 'number') return dataPoint;
  
  // String format that can be parsed to a number
  if (typeof dataPoint === 'string') {
    const parsed = parseFloat(dataPoint);
    return isNaN(parsed) ? NaN : parsed;
  }
  
  // Object format - try different property names used across data sources
  if (typeof dataPoint === 'object') {
    // First try 'value' which is commonly used
    if ('value' in dataPoint && dataPoint.value !== null && dataPoint.value !== undefined) {
      return parseFloat(dataPoint.value);
    }
    
    // Then try 'close' used by many financial APIs
    if ('close' in dataPoint && dataPoint.close !== null && dataPoint.close !== undefined) {
      return parseFloat(dataPoint.close);
    }
    
    // Finally try '4. close' used by Alpha Vantage
    if ('4. close' in dataPoint && dataPoint['4. close'] !== null && dataPoint['4. close'] !== undefined) {
      return parseFloat(dataPoint['4. close']);
    }
  }
  
  return NaN;
};

// Exponential Moving Average (EMA)
export const calculateEMA = (data, period) => {
  if (!data || !Array.isArray(data) || data.length < period) return null;
  
  // Extract prices from data (handles various formats)
  const prices = data.map(d => extractPrice(d)).filter(p => !isNaN(p));
  
  if (prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  
  // First EMA uses SMA as initial value
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

// Simple Moving Average (SMA)
export const calculateSMA = (data, period) => {
  if (!data || !Array.isArray(data) || data.length < period) return null;
  
  const prices = data.map(d => extractPrice(d)).filter(p => !isNaN(p));
  
  if (prices.length < period) return null;
  
  return prices.slice(-period).reduce((a, b) => a + b) / period;
};

// Relative Strength Index (RSI)
export const calculateRSI = (data, period = 14) => {
  if (!data || !Array.isArray(data) || data.length < period + 1) return null;

  const prices = data.map(d => extractPrice(d)).filter(p => !isNaN(p));
  
  if (prices.length < period + 1) return null;
  
  const changes = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Separate gains and losses
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

  // Calculate average gains and losses over the period
  const avgGain = calculateMean(gains.slice(-period));
  const avgLoss = calculateMean(losses.slice(-period));

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Moving Average Convergence Divergence (MACD)
export const calculateMACD = (data) => {
  if (!data || !Array.isArray(data) || data.length < 26) return null;

  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  if (!ema12 || !ema26) return null;

  return ema12 - ema26;
};

// Bollinger Bands
export const calculateBollingerBands = (data, period = 20) => {
  if (!data || !Array.isArray(data) || data.length < period) return null;

  const prices = data.map(d => extractPrice(d)).filter(p => !isNaN(p));
  
  if (prices.length < period) return null;
  
  const sma = calculateSMA(data, period);
  
  if (sma === null) return null;

  // Calculate standard deviation manually
  const mean = calculateMean(prices.slice(-period));
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - mean, 2));
  const standardDeviation = Math.sqrt(calculateMean(squaredDiffs));

  return {
    upper: sma + (standardDeviation * 2),
    middle: sma,
    lower: sma - (standardDeviation * 2)
  };
};

// Extract high, low, close values accounting for different data formats
const extractHL = (dataPoint, prevClose) => {
  let high, low, close;
  
  if (typeof dataPoint === 'object') {
    // Try different property names
    high = dataPoint.high !== undefined ? parseFloat(dataPoint.high) :
           dataPoint['2. high'] !== undefined ? parseFloat(dataPoint['2. high']) :
           extractPrice(dataPoint);
           
    low = dataPoint.low !== undefined ? parseFloat(dataPoint.low) :
          dataPoint['3. low'] !== undefined ? parseFloat(dataPoint['3. low']) :
          extractPrice(dataPoint);
          
    close = extractPrice(dataPoint);
  } else {
    // If dataPoint is not an object, use the same value for high, low, close
    high = low = close = extractPrice(dataPoint);
  }
  
  return { high, low, close };
};

// Average True Range (ATR)
export const calculateATR = (data, period = 14) => {
  if (!data || !Array.isArray(data) || data.length < period + 1) return null;

  const trueRanges = [];
  
  // Ensure we have valid price data
  const validData = data.filter(d => extractPrice(d) !== NaN);
  
  if (validData.length < period + 1) return null;
  
  for (let i = 1; i < validData.length; i++) {
    const { high, low } = extractHL(validData[i]);
    const prevClose = extractPrice(validData[i-1]);
    
    if (isNaN(high) || isNaN(low) || isNaN(prevClose)) continue;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  if (trueRanges.length < period) return null;

  return calculateMean(trueRanges.slice(-period));
};

// On-Balance Volume (OBV)
export const calculateOBV = (data) => {
  if (!data || !Array.isArray(data) || data.length < 2) return null;
  
  let obv = 0;
  
  for (let i = 1; i < data.length; i++) {
    const currentPrice = extractPrice(data[i]);
    const previousPrice = extractPrice(data[i-1]);
    
    // Try to extract volume from different formats
    let volume = 0;
    if (typeof data[i] === 'object') {
      volume = data[i].volume !== undefined ? parseFloat(data[i].volume) :
               data[i]['5. volume'] !== undefined ? parseFloat(data[i]['5. volume']) : 0;
    }
    
    if (isNaN(currentPrice) || isNaN(previousPrice) || isNaN(volume)) continue;
    
    if (currentPrice > previousPrice) {
      obv += volume;
    } else if (currentPrice < previousPrice) {
      obv -= volume;
    }
    // If prices are equal, OBV doesn't change
  }
  
  return obv;
};

// Comprehensive Technical Analysis
export const calculateTechnicalIndicators = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('No data provided for technical analysis');
    return null;
  }

  // Debug logging
  console.log('Calculating technical indicators for data:', {
    length: data.length,
    firstPoint: data[0],
    lastPoint: data[data.length - 1],
    sampleValue: extractPrice(data[0])
  });

  try {
    // Check if we have enough data for all calculations
    if (data.length < 200) {
      console.warn(`Insufficient data points (${data.length}) for some indicators. Need at least 200 for SMA200.`);
    }
    
    const indicators = {
      movingAverages: {
        sma50: data.length >= 50 ? calculateSMA(data, 50) : null,
        sma200: data.length >= 200 ? calculateSMA(data, 200) : null,
        ema20: data.length >= 20 ? calculateEMA(data, 20) : null,
        dema14: data.length >= 28 ? calculateEMA(data, 14) : null, // DEMA needs 2x period
        tema14: data.length >= 42 ? calculateEMA(data, 14) : null, // TEMA needs 3x period
        vwap: null // Not calculated without intraday data
      },
      momentum: {
        rsi: calculateRSI(data),
        macd: calculateMACD(data),
        stochK: null, // Not calculated in this version
        stochD: null, // Not calculated in this version
        cci: null // Not calculated in this version
      },
      volatility: {
        bollingerUpper: calculateBollingerBands(data)?.upper,
        bollingerMiddle: calculateBollingerBands(data)?.middle,
        bollingerLower: calculateBollingerBands(data)?.lower,
        atr: calculateATR(data),
        keltnerUpper: null // Not calculated in this version
      },
      volume: {
        obv: calculateOBV(data),
        chaikinOsc: null // Not calculated in this version
      }
    };

    // Format the results to two decimal places where applicable
    const formatIndicators = (obj) => {
      if (!obj) return obj;
      
      const result = {};
      for (const key in obj) {
        if (obj[key] === null || obj[key] === undefined) {
          result[key] = null;
        } else if (typeof obj[key] === 'number') {
          result[key] = parseFloat(obj[key].toFixed(2));
        } else if (typeof obj[key] === 'object') {
          result[key] = formatIndicators(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
      return result;
    };

    const formattedIndicators = formatIndicators(indicators);
    console.log('Technical indicators calculated:', formattedIndicators);
    return formattedIndicators;
  } catch (error) {
    console.error('Error calculating technical indicators:', error);
    return null;
  }
};