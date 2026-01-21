// stockUtils.js
// Make sure to keep this export at the TOP of the file
export const stockSymbols = [
  // Original top stocks
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'BRK.B', 'LLY', 'V', 'TSM',
  'JPM', 'XOM', 'WMT', 'MA', 'JNJ', 'PG', 'HD', 'BAC', 'AVGO', 'ORCL',
  'COST', 'ABT', 'MRK', 'ADBE', 'CRM', 'AMD', 'CSCO', 'PFE', 'TMO', 'NFLX',
  
  // Additional major tech stocks
  'INTC', 'IBM', 'QCOM', 'TXN', 'AMAT', 'NOW', 'INTU', 'PYPL', 'UBER', 'ABNB', 'TSLA',
  
  // Financial sector additions
  'GS', 'MS', 'C', 'WFC', 'BLK', 'AXP', 'SCHW', 'USB', 'PNC', 'TFC',
  
  // Healthcare and pharma additions
  'UNH', 'CVS', 'ABBV', 'BMY', 'AMGN', 'GILD', 'ISRG', 'REGN', 'VRTX', 'ZTS',
  
  // Industrial and manufacturing
  'CAT', 'BA', 'HON', 'MMM', 'GE', 'DE', 'LMT', 'RTX', 'UPS', 'FDX',
  
  // Consumer and retail
  'KO', 'PEP', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'DIS', 'CMCSA', 'T',
  
  // Energy and utilities
  'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'NEE', 'DUK', 'SO', 'D', 'AEP',
  
  // Communication services
  'VZ', 'TMUS', 'ATVI', 'EA', 'TTWO', 'SPOT', 'SNAP', 'PINS', 'MTCH', 'ZM',
  
  // Materials and chemicals
  'LIN', 'APD', 'SHW', 'FCX', 'DOW', 'DD', 'ECL', 'NEM', 'CTVA', 'ALB',
  
  // REITs and real estate
  'PLD', 'AMT', 'CCI', 'EQIX', 'PSA', 'O', 'WELL', 'SPG', 'AVB', 'EQR'
];

export async function fetchMultiTimeframeData(symbol) {
  if (!symbol) {
    throw new Error('Symbol is required for fetching multi-timeframe data');
  }

  try {
    const baseURL = window.location.origin;
    
    // Fetch daily data
    const dailyResponse = await fetch(`${baseURL}/api/stocks?symbol=${symbol}&type=historical&range=200&interval=1d`);
    if (!dailyResponse.ok) {
      throw new Error(`Failed to fetch daily data: ${dailyResponse.statusText}`);
    }
    const dailyData = await dailyResponse.json();
    
    // Fetch hourly data for recent periods (last 7 days)
    const hourlyResponse = await fetch(`${baseURL}/api/stocks?symbol=${symbol}&type=historical&range=7&interval=1h`);
    if (!hourlyResponse.ok) {
      throw new Error(`Failed to fetch hourly data: ${hourlyResponse.statusText}`);
    }
    const hourlyData = await hourlyResponse.json();
    
    // Format all the data consistently
    const daily = formatStockHistoricalData(dailyData);
    const hourly = formatStockHistoricalData(hourlyData);
    
    // Create 4h data by sampling hourly data
    const fourHour = hourly.filter((_, i) => i % 4 === 0);

    return {
      daily,
      fourHour,
      hourly
    };
  } catch (error) {
    console.error('Error fetching multi-timeframe data:', error);
    throw error;
  }
}

// Trend Indicators
export const trendIndicators = {
  calculateSMA: (data, period) => {
    if (data.length < period) return 0;
    const prices = data.slice(-period).map(d => d.value);
    return prices.reduce((a, b) => a + b, 0) / period;
  },

  calculateEMA: (data, period) => {
    if (data.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = data[0].value;
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].value * k) + (ema * (1 - k));
    }
    return ema;
  },

  calculateDEMA: (data, period) => {
    if (data.length < period * 2) return 0;
    const ema1 = trendIndicators.calculateEMA(data, period);
    const emaOfEma = trendIndicators.calculateEMA(
      data.map(d => ({ ...d, value: ema1 })),
      period
    );
    return 2 * ema1 - emaOfEma;
  },

  calculateTEMA: (data, period) => {
    if (data.length < period * 3) return 0;
    const ema1 = trendIndicators.calculateEMA(data, period);
    const ema2 = trendIndicators.calculateEMA(
      data.map(d => ({ ...d, value: ema1 })),
      period
    );
    const ema3 = trendIndicators.calculateEMA(
      data.map(d => ({ ...d, value: ema2 })),
      period
    );
    return 3 * ema1 - 3 * ema2 + ema3;
  },

  calculateWMA: (data, period) => {
    if (data.length < period) return 0;
    let sum = 0;
    let weightSum = 0;
    const prices = data.slice(-period);
    
    for (let i = 0; i < period; i++) {
      const weight = i + 1;
      sum += prices[i].value * weight;
      weightSum += weight;
    }
    
    return sum / weightSum;
  },

  calculateHMA: (data, period) => {
    if (data.length < period) return 0;
    const wma1 = trendIndicators.calculateWMA(data, Math.floor(period / 2));
    const wma2 = trendIndicators.calculateWMA(data, period);
    const diff = 2 * wma1 - wma2;
    return trendIndicators.calculateWMA(
      data.map(d => ({ ...d, value: diff })),
      Math.floor(Math.sqrt(period))
    );
  },

  calculateVWAP: (data) => {
    if (data.length === 0) return 0;
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    
    data.forEach(bar => {
      const volume = bar.volume || 0;
      const price = bar.value;
      cumulativePV += price * volume;
      cumulativeVolume += volume;
    });
    
    return cumulativeVolume === 0 ? 0 : cumulativePV / cumulativeVolume;
  },

  calculatePSAR: (data, stepFactor = 0.02, maxFactor = 0.2) => {
    if (data.length < 3) return [];
    
    const psar = new Array(data.length).fill(0);
    let af = stepFactor;
    let isUpTrend = true;
    let ep = data[0].high || data[0].value;
    psar[0] = data[0].low || data[0].value;
    
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high || data[i].value;
      const low = data[i].low || data[i].value;
      
      if (isUpTrend) {
        psar[i] = psar[i-1] + af * (ep - psar[i-1]);
        if (high > ep) {
          ep = high;
          af = Math.min(af + stepFactor, maxFactor);
        }
        if (low < psar[i]) {
          isUpTrend = false;
          af = stepFactor;
          ep = low;
        }
      } else {
        psar[i] = psar[i-1] - af * (psar[i-1] - ep);
        if (low < ep) {
          ep = low;
          af = Math.min(af + stepFactor, maxFactor);
        }
        if (high > psar[i]) {
          isUpTrend = true;
          af = stepFactor;
          ep = high;
        }
      }
    }
    
    return psar[psar.length - 1];
  }
};

// Momentum Indicators
export const momentumIndicators = {
  calculateRSI: (data, period = 14) => {
    if (data.length < period + 1) return 0;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = data[i].value - data[i - 1].value;
      if (change >= 0) gains += change;
      else losses -= change;
    }
    
    if (losses === 0) return 100;
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].value - data[i - 1].value;
      if (change >= 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - change) / period;
      }
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  },

  calculateMACD: (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (data.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }
    
    const fastEMA = trendIndicators.calculateEMA(data, fastPeriod);
    const slowEMA = trendIndicators.calculateEMA(data, slowPeriod);
    const macd = fastEMA - slowEMA;
    const signal = trendIndicators.calculateEMA(
      data.map(d => ({ ...d, value: macd })),
      signalPeriod
    );
    
    return {
      macd,
      signal,
      histogram: macd - signal
    };
  },

  calculateStochastic: (data, period = 14, smoothK = 3, smoothD = 3) => {
    if (data.length < period) return { K: 0, D: 0 };
    
    const getStochK = (slice) => {
      const close = slice[slice.length - 1].value;
      const low = Math.min(...slice.map(d => d.low || d.value));
      const high = Math.max(...slice.map(d => d.high || d.value));
      return ((close - low) / (high - low)) * 100;
    };
    
    const kValues = [];
    for (let i = period; i <= data.length; i++) {
      const slice = data.slice(i - period, i);
      kValues.push(getStochK(slice));
    }
    
    const K = kValues.slice(-smoothK).reduce((a, b) => a + b) / smoothK;
    const D = kValues.slice(-smoothD).reduce((a, b) => a + b) / smoothD;
    
    return { K, D };
  },

  calculateCCI: (data, period = 20) => {
    if (data.length < period) return 0;
    
    const typicalPrices = data.map(d => {
      const high = d.high || d.value;
      const low = d.low || d.value;
      const close = d.value;
      return (high + low + close) / 3;
    });
    
    const sma = typicalPrices.slice(-period).reduce((a, b) => a + b) / period;
    const meanDeviation = typicalPrices
      .slice(-period)
      .reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
    
    return (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);
  },

  calculateMFI: (data, period = 14) => {
    if (data.length < period) return 0;
    
    const typicalPrices = data.map(d => {
      const high = d.high || d.value;
      const low = d.low || d.value;
      const close = d.value;
      return [(high + low + close) / 3, d.volume || 0];
    });
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 1; i < period; i++) {
      const [currentTP, currentVol] = typicalPrices[i];
      const [previousTP] = typicalPrices[i - 1];
      const moneyFlow = currentTP * currentVol;
      
      if (currentTP > previousTP) {
        positiveFlow += moneyFlow;
      } else if (currentTP < previousTP) {
        negativeFlow += moneyFlow;
      }
    }
    
    return 100 - (100 / (1 + positiveFlow / negativeFlow));
  },

  calculateROC: (data, period = 12) => {
    if (data.length < period) return 0;
    
    const currentPrice = data[data.length - 1].value;
    const oldPrice = data[data.length - period - 1].value;
    
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  },

  calculateWilliamsR: (data, period = 14) => {
    if (data.length < period) return 0;
    
    const currentClose = data[data.length - 1].value;
    const periodData = data.slice(-period);
    const highestHigh = Math.max(...periodData.map(d => d.high || d.value));
    const lowestLow = Math.min(...periodData.map(d => d.low || d.value));
    
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }
};

// Volatility Indicators
export const volatilityIndicators = {
  calculateBollingerBands: (data, period = 20, stdDev = 2) => {
    if (data.length < period) {
      return { upper: 0, middle: 0, lower: 0 };
    }
    
    const prices = data.slice(-period).map(d => d.value);
    const sma = prices.reduce((a, b) => a + b, 0) / period;
    
    const squaredDiffs = prices.map(price => Math.pow(price - sma, 2));
    const standardDeviation = Math.sqrt(
      squaredDiffs.reduce((a, b) => a + b, 0) / period
    );
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  },

  calculateATR: (data, period = 14) => {
    if (data.length < period + 1) return 0;
    
    const getTR = (current, previous) => {
      const high = current.high || current.value;
      const low = current.low || current.value;
      const previousClose = previous.value;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - previousClose);
      const tr3 = Math.abs(low - previousClose);
      
      return Math.max(tr1, tr2, tr3);
    };
    
    const trueRanges = [];
    for (let i = 1; i < data.length; i++) {
      trueRanges.push(getTR(data[i], data[i - 1]));
    }
    
    const atr = trueRanges.slice(-period).reduce((a, b) => a + b) / period;
    return atr;
  },

  calculateKeltnerChannels: (data, period = 20, multiplier = 2) => {
    if (data.length < period) {
      return { upper: 0, middle: 0, lower: 0 };
    }
    
    const ema = trendIndicators.calculateEMA(data, period);
    const atr = volatilityIndicators.calculateATR(data, period);
    
    return {
      upper: ema + (multiplier * atr),
      middle: ema,
      lower: ema - (multiplier * atr)
    };
  },

  calculateVIX: (data, period = 30) => {
    if (data.length < period) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.log(data[i].value / data[i - 1].value));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252) * 100; // Annualized volatility as percentage
  }
};

// Volume Indicators
export const volumeIndicators = {
  calculateOBV: (data) => {
    if (data.length < 2) return 0;
    
    let obv = 0;
    for (let i = 1; i < data.length; i++) {
      const currentClose = data[i].value;
      const previousClose = data[i - 1].value;
      const volume = data[i].volume || 0;
      
      if (currentClose > previousClose) {
        obv += volume;
      } else if (currentClose < previousClose) {
        obv -= volume;
      }
    }
    
    return obv;
  },

  calculateChaikinOscillator: (data, shortPeriod = 3, longPeriod = 10) => {
    if (data.length < Math.max(shortPeriod, longPeriod)) return 0;
    
    const adl = data.map(d => {
      const high = d.high || d.value;
      const low = d.low || d.value;
      const close = d.value;
      const volume = d.volume || 0;
      
      const mfm = ((close - low) - (high - close)) / (high - low);
      return mfm * volume;
    });
    
    const shortEMA = trendIndicators.calculateEMA(
      adl.map((value, i) => ({ date: data[i].date, value })),
      shortPeriod
    );
    const longEMA = trendIndicators.calculateEMA(
      adl.map((value, i) => ({ date: data[i].date, value })),
      longPeriod
    );
    
    return shortEMA - longEMA;
  },

  calculateAccumulationDistribution: (data) => {
    if (data.length === 0) return 0;
    
    let ad = 0;
    data.forEach(d => {
      const high = d.high || d.value;
      const low = d.low || d.value;
      const close = d.value;
      const volume = d.volume || 0;
      
      const mfm = ((close - low) - (high - close)) / (high - low);
      ad += mfm * volume;
    });
    
    return ad;
  },

  calculateVolumeROC: (data, period = 12) => {
    if (data.length < period) return 0;
    
    const currentVolume = data[data.length - 1].volume || 0;
    const oldVolume = data[data.length - period - 1].volume || 0;
    
    return oldVolume === 0 ? 0 : ((currentVolume - oldVolume) / oldVolume) * 100;
  }
};

// Main function to calculate all technical indicators
export function calculateTechnicalIndicators(priceData) {
  if (!priceData || priceData.length === 0) {
    console.log('No price data received');
    return {
      movingAverages: {
        sma50: 0,
        sma200: 0,
        ema20: 0,
        dema14: 0,
        tema14: 0,
        wma14: 0,
        hma14: 0,
        vwap: 0,
        psar: 0
      },
      momentum: {
        rsi: 0,
        macd: 0,
        macdSignal: 0,
        macdHistogram: 0,
        stochK: 0,
        stochD: 0,
        cci: 0,
        mfi: 0,
        roc: 0,
        williamsR: 0
      },
      volatility: {
        bollingerUpper: 0,
        bollingerMiddle: 0,
        bollingerLower: 0,
        atr: 0,
        keltnerUpper: 0,
        keltnerMiddle: 0,
        keltnerLower: 0,
        vix: 0
      },
      volume: {
        obv: 0,
        chaikinOsc: 0,
        accDist: 0,
        volumeRoc: 0
      }
    };
  }

  // Calculate all indicators
  const sma50 = trendIndicators.calculateSMA(priceData, 50);
  const sma200 = trendIndicators.calculateSMA(priceData, 200);
  const ema20 = trendIndicators.calculateEMA(priceData, 20);
  const dema14 = trendIndicators.calculateDEMA(priceData, 14);
  const tema14 = trendIndicators.calculateTEMA(priceData, 14);
  const wma14 = trendIndicators.calculateWMA(priceData, 14);
  const hma14 = trendIndicators.calculateHMA(priceData, 14);
  const vwap = trendIndicators.calculateVWAP(priceData);
  const psar = trendIndicators.calculatePSAR(priceData);

  const rsi = momentumIndicators.calculateRSI(priceData);
  const macd = momentumIndicators.calculateMACD(priceData);
  const stoch = momentumIndicators.calculateStochastic(priceData);
  const cci = momentumIndicators.calculateCCI(priceData);
  const mfi = momentumIndicators.calculateMFI(priceData);
  const roc = momentumIndicators.calculateROC(priceData);
  const williamsR = momentumIndicators.calculateWilliamsR(priceData);

  const bb = volatilityIndicators.calculateBollingerBands(priceData);
  const atr = volatilityIndicators.calculateATR(priceData);
  const keltner = volatilityIndicators.calculateKeltnerChannels(priceData);
  const vix = volatilityIndicators.calculateVIX(priceData);

  const obv = volumeIndicators.calculateOBV(priceData);
  const chaikinOsc = volumeIndicators.calculateChaikinOscillator(priceData);
  const accDist = volumeIndicators.calculateAccumulationDistribution(priceData);
  const volumeRoc = volumeIndicators.calculateVolumeROC(priceData);

  return {
    movingAverages: {
      sma50,
      sma200,
      ema20,
      dema14,
      tema14,
      wma14,
      hma14,
      vwap,
      psar
    },
    momentum: {
      rsi,
      macd: macd.macd,
      macdSignal: macd.signal,
      macdHistogram: macd.histogram,
      stochK: stoch.K,
      stochD: stoch.D,
      cci,
      mfi,
      roc,
      williamsR
    },
    volatility: {
      bollingerUpper: bb.upper,
      bollingerMiddle: bb.middle,
      bollingerLower: bb.lower,
      atr,
      keltnerUpper: keltner.upper,
      keltnerMiddle: keltner.middle,
      keltnerLower: keltner.lower,
      vix
    },
    volume: {
      obv,
      chaikinOsc,
      accDist,
      volumeRoc
    }
  };
}

// Improved error handling with retries
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 404) {
          throw new Error(`Symbol not found (404)`);
        }
        
        if (response.status === 429) {
          console.warn(`Rate limit exceeded, retrying in ${(retries + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (retries + 1) * 1000));
          retries++;
          continue;
        }
        
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      if (error.message.includes('Rate limit') && retries < maxRetries - 1) {
        console.warn(`Rate limit error, retrying in ${(retries + 1) * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, (retries + 1) * 1000));
        retries++;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Maximum retries (${maxRetries}) exceeded`);
}

export async function fetchStockData(symbol) {
  if (!symbol) {
    throw new Error('Symbol is required');
  }
  
  console.log(`Fetching stock data for ${symbol}`);
  
  try {
    const baseURL = window.location.origin;
    const url = new URL(`${baseURL}/api/stocks`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'quote');
    
    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    console.log(`Successfully fetched stock data for ${symbol}:`, data);
    
    // Return normalized data
    return {
      symbol: symbol.toUpperCase(),
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      name: data.longName || symbol,
      overview: data.overview,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw error;
  }
}

export async function handleStockFetch(symbol, timeRange, handlers) {
  const { setLoading, setError, setAssetData, setHistoricalData } = handlers;
  
  if (!symbol) {
    setError('Symbol is required');
    return;
  }
  
  console.log(`Handling stock fetch for ${symbol} with timeRange ${timeRange}`);
  
  try {
    setLoading(true);
    setError('');
    
    // Fetch current stock data
    const data = await fetchStockData(symbol);
    setAssetData(data);
    
    // Fetch historical data
    const baseURL = window.location.origin;
    const historyUrl = new URL(`${baseURL}/api/stocks`);
    historyUrl.searchParams.append('symbol', symbol);
    historyUrl.searchParams.append('type', 'historical');
    historyUrl.searchParams.append('range', timeRange);
    
    console.log(`Fetching historical data from: ${historyUrl.toString()}`);
    
    const historyResponse = await fetchWithRetry(historyUrl);
    const historicalData = await historyResponse.json();
    
    console.log(`Received historical data for ${symbol}, processing...`);
    
    // Format the data for our charts
    const formattedData = formatStockHistoricalData(historicalData);
    const technicalData = calculateTechnicalIndicators(formattedData);
    
    console.log(`Historical data processed, items: ${formattedData.length}`);
    
    // Generate technical analysis
    const analysis = generateTechnicalAnalysis(technicalData);
    
    setHistoricalData({
      prices: formattedData,
      technical: technicalData,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Error in handleStockFetch:', error);
    
    // Provide more user-friendly error messages
    if (error.message.includes('Symbol not found')) {
      setError(`Symbol '${symbol}' not found. Please check the symbol and try again.`);
    } else if (error.message.includes('Rate limit')) {
      setError(`Rate limit exceeded. Please wait a moment and try again.`);
    } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      setError(`Network error. Please check your connection and try again.`);
    } else {
      setError(`Error: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
}

// Function to generate analysis based on technical indicators
export function generateTechnicalAnalysis(technicalData) {
  if (!technicalData) return null;
  
  const { movingAverages, momentum, volatility } = technicalData;
  
  // Check for potential trend signals
  let trendSignal = 'neutral';
  let trendStrength = 'weak';
  let supportLevel = 0;
  let resistanceLevel = 0;
  
  // Determine trend based on moving averages
  if (movingAverages.sma50 > movingAverages.sma200) {
    // Bullish - price above long-term average
    trendSignal = 'bullish';
    
    // Check for golden cross (short-term MA crossing above long-term MA)
    const goldCrossPotential = movingAverages.ema20 > movingAverages.sma50 && 
                               movingAverages.sma50 > movingAverages.sma200;
    
    if (goldCrossPotential) {
      trendStrength = 'strong';
    }
    
    // Set support at SMA50 and resistance at recent high
    supportLevel = movingAverages.sma50;
    resistanceLevel = volatility.bollingerUpper;
    
  } else if (movingAverages.sma50 < movingAverages.sma200) {
    // Bearish - price below long-term average
    trendSignal = 'bearish';
    
    // Check for death cross (short-term MA crossing below long-term MA)
    const deathCrossPotential = movingAverages.ema20 < movingAverages.sma50 && 
                                movingAverages.sma50 < movingAverages.sma200;
    
    if (deathCrossPotential) {
      trendStrength = 'strong';
    }
    
    // Set resistance at SMA50 and support at recent low
    resistanceLevel = movingAverages.sma50;
    supportLevel = volatility.bollingerLower;
  }
  
  // Refine signals with momentum indicators
  let momentumSignal = 'neutral';
  
  // RSI analysis
  if (momentum.rsi > 70) {
    momentumSignal = 'overbought';
  } else if (momentum.rsi < 30) {
    momentumSignal = 'oversold';
  }
  
  // MACD analysis
  const macdSignal = momentum.macd > momentum.macdSignal ? 'bullish' : 'bearish';
  
  // Combine signals
  let overallSignal = trendSignal;
  if (trendSignal === 'bullish' && momentumSignal === 'overbought') {
    overallSignal = 'cautious bullish';
  } else if (trendSignal === 'bearish' && momentumSignal === 'oversold') {
    overallSignal = 'cautious bearish';
  }
  
  // Volatility assessment
  const volatilityLevel = volatility.atr > 2 ? 'high' : 'moderate';
  
  return {
    trend: {
      signal: trendSignal,
      strength: trendStrength,
      supportLevel: supportLevel.toFixed(2),
      resistanceLevel: resistanceLevel.toFixed(2)
    },
    momentum: {
      signal: momentumSignal,
      rsiValue: momentum.rsi.toFixed(2),
      macdSignal
    },
    volatility: {
      level: volatilityLevel,
      bollingerWidth: (volatility.bollingerUpper - volatility.bollingerLower).toFixed(2)
    },
    overall: {
      signal: overallSignal,
      summary: `The asset shows a ${trendStrength} ${trendSignal} trend with ${momentumSignal} momentum and ${volatilityLevel} volatility.`
    }
  };
}

export async function handlePatternFetch(symbol, handlers) {
  const { setLoading, setError, setHistoricalData } = handlers;
  
  if (!symbol) {
    setError('Symbol is required');
    return;
  }
  
  try {
    setLoading(true);
    setError('');
    
    console.log(`Fetching 200-day data for symbol: ${symbol}`);
    
    const baseURL = window.location.origin;
    const url = new URL(`${baseURL}/api/stocks`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'historical');
    url.searchParams.append('range', '200');
    
    const response = await fetchWithRetry(url);
    const historicalData = await response.json();
    
    // Format the data for our charts
    const formattedData = formatStockHistoricalData(historicalData);
    const technicalData = calculateTechnicalIndicators(formattedData);
    
    setHistoricalData({
      prices: formattedData,
      technical: technicalData
    });
    
  } catch (error) {
    console.error('Error in handlePatternFetch:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

export async function handleShortPatternFetch(symbol, handlers) {
  const { setLoading, setError, setHistoricalData } = handlers;
  
  if (!symbol) {
    setError('Symbol is required');
    return;
  }
  
  try {
    setLoading(true);
    setError('');
    
    console.log(`Fetching 40-day data for symbol: ${symbol}`);
    
    const baseURL = window.location.origin;
    const url = new URL(`${baseURL}/api/stocks`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'historical');
    url.searchParams.append('range', '40');
    
    const response = await fetchWithRetry(url);
    const historicalData = await response.json();
    
    // Format the data for our charts
    const formattedData = formatStockHistoricalData(historicalData);
    const technicalData = calculateTechnicalIndicators(formattedData);
    
    setHistoricalData({
      prices: formattedData,
      technical: technicalData
    });
    
  } catch (error) {
    console.error('Error in handleShortPatternFetch:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

export async function handleVeryShortPatternFetch(symbol, handlers) {
  const { setLoading, setError, setHistoricalData } = handlers;
  
  if (!symbol) {
    setError('Symbol is required');
    return;
  }
  
  try {
    setLoading(true);
    setError('');
    
    console.log(`Fetching 10-day data for symbol: ${symbol}`);
    
    const baseURL = window.location.origin;
    const url = new URL(`${baseURL}/api/stocks`);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('type', 'historical');
    url.searchParams.append('range', '10');
    
    const response = await fetchWithRetry(url);
    const historicalData = await response.json();
    
    // Format the data for our charts
    const formattedData = formatStockHistoricalData(historicalData);
    const technicalData = calculateTechnicalIndicators(formattedData);
    
    setHistoricalData({
      prices: formattedData,
      technical: technicalData
    });
    
  } catch (error) {
    console.error('Error in handleVeryShortPatternFetch:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

export function formatStockHistoricalData(rawHistoricalData) {
  if (!Array.isArray(rawHistoricalData)) {
    throw new Error('Invalid historical data format received');
  }
  
  return rawHistoricalData
    .map(dataPoint => ({
      date: dataPoint.date || dataPoint.timestamp,
      value: parseFloat(dataPoint.price || dataPoint.value || dataPoint.close),
      high: parseFloat(dataPoint.high || dataPoint.value || dataPoint.close),
      low: parseFloat(dataPoint.low || dataPoint.value || dataPoint.close),
      volume: parseFloat(dataPoint.volume || 0)
    }))
    .filter(point => point && point.date && !isNaN(point.value));
}