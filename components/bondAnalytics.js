// bondAnalytics.js
import { fetchFromFRED, fetchBondData, fetchBondHistoricalData } from './bondUtils';

// Helper function to handle safe number formatting
const formatNumber = (value, decimals = 2, addPercent = false) => {
  if (value === null || value === undefined) return 'N/A';
  const formatted = Number(value).toFixed(decimals);
  return addPercent ? formatted + '%' : formatted;
};

// Risk Metrics Calculations
const calculateModifiedDuration = (yield_value, maturityYears, couponRate) => {
  const yieldPerPeriod = yield_value / 200;
  const periodsPerYear = 2;
  const periods = maturityYears * periodsPerYear;
  const couponPerPeriod = couponRate / 200;

  let duration = 0;
  let pv = 0;
  
  for (let i = 1; i <= periods; i++) {
    const pvFactor = Math.pow(1 + yieldPerPeriod, -i);
    const pvCashFlow = 1000 * couponPerPeriod * pvFactor;
    duration += (i / periodsPerYear) * pvCashFlow;
    pv += pvCashFlow;
  }
  
  const pvPrincipal = 1000 * Math.pow(1 + yieldPerPeriod, -periods);
  duration += maturityYears * pvPrincipal;
  pv += pvPrincipal;
  
  const macaulayDuration = duration / pv;
  return macaulayDuration / (1 + yieldPerPeriod);
};

const calculateZeroRate = (yield_value, maturityYears) => {
  const price = 1000 * (1 - (yield_value / 100));
  return (Math.pow(1000/price, 1/maturityYears) - 1) * 100;
};

const calculateVaR = async (symbol, confidence = 0.95, holdingPeriod = 10) => {
  try{
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  
  const data = await fetchFromFRED('series/observations', {
    series_id: symbol,
    observation_start: yearAgo.toISOString().split('T')[0],
    sort_order: 'asc'
  });

  if (!data.observations || data.observations.length < 30) return null;

  const yieldChanges = data.observations
    .slice(1)
    .map((obs, i) => parseFloat(obs.value) - parseFloat(data.observations[i].value));

  const mean = yieldChanges.reduce((a, b) => a + b, 0) / yieldChanges.length;
  const variance = yieldChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (yieldChanges.length - 1);
  const stdDev = Math.sqrt(variance);

  const zScore = confidence === 0.95 ? 1.645 : 2.326;
  return stdDev * zScore * Math.sqrt(holdingPeriod);
} catch(error){
    console.error("Error calculating VaR:", error);
    return null;
}
};

// Statistical Analysis
const calculateHistoricalVolatility = (yields, annualize = true) => {
  if (yields.length < 2) return null;
  
  const changes = yields.slice(1).map((y, i) => y - yields[i]);
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (changes.length - 1);
  const dailyVol = Math.sqrt(variance);
  
  return annualize ? dailyVol * Math.sqrt(252) : dailyVol;
};

const calculateMovingAverages = (data, periods = [20, 50, 200]) => {
  const results = {};
  
  periods.forEach(period => {
    if (data.length < period) {
      results[`MA${period}`] = null;
      return;
    }
    
    const slice = data.slice(-period);
    results[`MA${period}`] = slice.reduce((a, b) => a + b, 0) / period;
  });
  
  return results;
};

// Performance Metrics
const calculateTotalReturn = (startPrice, endPrice, couponRate, timePeriodYears) => {
  const couponPayments = couponRate * startPrice * timePeriodYears;
  const priceReturn = (endPrice - startPrice) / startPrice;
  const totalReturn = ((endPrice - startPrice + couponPayments) / startPrice) * 100;
  
  return {
    totalReturn: totalReturn.toFixed(2) + '%',
    priceReturn: (priceReturn * 100).toFixed(2) + '%',
    incomeReturn: ((couponPayments / startPrice) * 100).toFixed(2) + '%'
  };
};

// 5. TECHNICAL ANALYSIS FUNCTIONS
const calculateRSI = (yields, periods = 14) => {
  if (yields.length < periods + 1) return null;
  
  const changes = yields.slice(1).map((y, i) => y - yields[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  
  let avgGain = gains.slice(0, periods).reduce((a, b) => a + b) / periods;
  let avgLoss = losses.slice(0, periods).reduce((a, b) => a + b) / periods;
  
  if (avgLoss === 0) {
    return 100; // To handle cases where there are no losses
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return rsi;
};

const calculateBollingerBands = (yields, periods = 20, stdDevMultiplier = 2) => {
  if (yields.length < periods) return null;
  
  const ma = yields.slice(-periods).reduce((a, b) => a + b) / periods;
  const stdDev = Math.sqrt(
    yields.slice(-periods)
      .reduce((a, b) => a + Math.pow(b - ma, 2), 0) / periods
  );
  
  return {
    middle: ma,
    upper: ma + (stdDev * stdDevMultiplier),
    lower: ma - (stdDev * stdDevMultiplier)
  };
};

const calculateMACD = (yields, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
  if (yields.length < longPeriod) return null;
  
  const shortEMA = calculateEMA(yields, shortPeriod);
  const longEMA = calculateEMA(yields, longPeriod);
  const macd = shortEMA - longEMA;
  const signal = calculateEMA([...yields.slice(longPeriod - signalPeriod), macd], signalPeriod);
  
  return {
    macd,
    signal,
    histogram: macd - signal
  };
};

const calculateEMA = (data, periods) => {
  if (data.length < periods) {
    return null; // Not enough data to calculate EMA
  }

  const k = 2 / (periods + 1);
  let ema = data[0]; // Initialize EMA with the first data point

  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k); // EMA calculation
  }

  return ema;
};

// 6. MARKET ANALYSIS FUNCTIONS
const analyzeYieldCurve = async () => {
  const maturities = ['GS1M', 'GS3M', 'GS6M', 'GS1', 'GS2', 'GS5', 'GS10', 'GS30'];
  
  try {
    const yields = await Promise.all(
      maturities.map(async symbol => {
        const data = await fetchFromFRED('series/observations', {
          series_id: symbol,
          sort_order: 'desc',
          limit: 1
        });
        return {
          maturity: symbol.replace('GS', ''),
          yield: data.observations[0]?.value ? parseFloat(data.observations[0].value) : null
        };
      })
    );
    
    // Filter out maturities with null yields
    const validYields = yields.filter(y => y.yield !== null);
    
    // Calculate curve metrics
    const steepness = validYields.length > 0 ? validYields[validYields.length - 1].yield - validYields[0].yield : null;
    const curvature = validYields.length > 0 ? validYields[Math.floor(validYields.length/2)].yield - 
      (validYields[0].yield + validYields[validYields.length-1].yield) / 2 : null;
    
    return {
      yields: validYields,
      metrics: {
        steepness: steepness !== null ? steepness : 'N/A',
        curvature: curvature !== null ? curvature : 'N/A',
        inverted: steepness !== null && steepness < 0 ? 'Yes' : 'No'
      }
    };
  } catch (error) {
    console.error('Error analyzing yield curve:', error);
    return null;
  }
};

const calculateFlightToQuality = async () => {
  try {
    // Compare 10-year Treasury yield to S&P 500 dividend yield
    const [treasuryData, spxData] = await Promise.all([
      fetchFromFRED('series/observations', {
        series_id: 'GS10',
        sort_order: 'desc',
        limit: 1
      }),
      fetchFromFRED('series/observations', {
        series_id: 'SP500DY',  // S&P 500 Dividend Yield
        sort_order: 'desc',
        limit: 1
      })
    ]);
    
    const treasuryYield = treasuryData.observations[0]?.value ? parseFloat(treasuryData.observations[0].value) : null;
    const spxYield = spxData.observations[0]?.value ? parseFloat(spxData.observations[0].value) : null;
    
    return {
      spread: treasuryYield !== null && spxYield !== null ? treasuryYield - spxYield : null,
      flightToQuality: treasuryYield !== null && spxYield !== null ? treasuryYield < spxYield : null
    };
  } catch (error) {
    console.error('Error calculating flight to quality:', error);
    return null;
  }
};

// 7. COMPARATIVE ANALYSIS FUNCTIONS
const calculateCrossMarketCorrelation = async (symbol, compareSymbol, periods = 252) => {
  try {
    const [data1, data2] = await Promise.all([
      fetchFromFRED('series/observations', {
        series_id: symbol,
        sort_order: 'desc',
        limit: periods
      }),
      fetchFromFRED('series/observations', {
        series_id: compareSymbol,
        sort_order: 'desc',
        limit: periods
      })
    ]);
    
    const yields1 = data1.observations.map(obs => parseFloat(obs.value));
    const yields2 = data2.observations.map(obs => parseFloat(obs.value));
    
    return calculateCorrelation(yields1, yields2);
  } catch (error) {
    console.error('Error calculating cross-market correlation:', error);
    return null;
  }
};

const calculateCorrelation = (array1, array2) => {
  if (!array1 || !array2 || array1.length !== array2.length || array1.length === 0) {
    return null; // Return null if arrays are invalid or empty
  }
  const mean1 = array1.reduce((a, b) => a + b, 0) / array1.length;
  const mean2 = array2.reduce((a, b) => a + b, 0) / array2.length;
  
  const variance1 = array1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
  const variance2 = array2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);
  
  const covariance = array1.reduce((a, b, i) => 
    a + ((b - mean1) * (array2[i] - mean2)), 0);
  
  const stdDev1 = Math.sqrt(variance1 / (array1.length - 1));
  const stdDev2 = Math.sqrt(variance2 / (array2.length - 1));
  
  if (stdDev1 === 0 || stdDev2 === 0) {
    return 0; // Return 0 if standard deviation is zero
  }

  const correlation = covariance / (stdDev1 * stdDev2 * (array1.length - 1));

  return correlation;
};

// Main analytics function
export const getBondAnalytics = async (bondData, historicalData) => {
  try {
    if (!bondData || !historicalData || historicalData.length === 0) {
      throw new Error('Insufficient data for analysis');
    }

    const yield_value = parseFloat(bondData.yield);
    const price = parseFloat(bondData.price);
    const maturityYears = bondData.overview.maturityYears;
    const couponRate = parseFloat(bondData.overview.couponRate);

    const yields = historicalData.map(d => d.yield);
    const prices = historicalData.map(d => d.value);

    // Calculate metrics
    const modifiedDuration = calculateModifiedDuration(yield_value, maturityYears, couponRate);
    const volatility = calculateHistoricalVolatility(yields);
    const movingAverages = calculateMovingAverages(yields);
    const var95 = await calculateVaR(bondData.symbol);
    const zeroRate = calculateZeroRate(yield_value, maturityYears);
    const totalReturnMetrics = prices.length > 0 ? calculateTotalReturn(
      prices[0],
      prices[prices.length - 1],
      couponRate / 100,
      1
    ) : { totalReturn: 'N/A', priceReturn: 'N/A', incomeReturn: 'N/A' };

    return {
      riskMetrics: {
        modifiedDuration: formatNumber(modifiedDuration),
        valueAtRisk95: formatNumber(var95, 2, true),
        zeroRate: formatNumber(zeroRate, 2, true)
      },
      statistics: {
        volatility: formatNumber(volatility, 2, true),
        movingAverages: {
          MA20: formatNumber(movingAverages.MA20, 2, true),
          MA50: formatNumber(movingAverages.MA50, 2, true),
          MA200: formatNumber(movingAverages.MA200, 2, true)
        }
      },
      performance: {
        totalReturn: totalReturnMetrics.totalReturn,
        priceReturn: totalReturnMetrics.priceReturn,
        incomeReturn: totalReturnMetrics.incomeReturn
      }
    };
  } catch (error) {
    console.error('Error calculating bond analytics:', error);
    return {
      riskMetrics: {
        modifiedDuration: 'N/A',
        valueAtRisk95: 'N/A',
        zeroRate: 'N/A'
      },
      statistics: {
        volatility: 'N/A',
        movingAverages: {
          MA20: 'N/A',
          MA50: 'N/A',
          MA200: 'N/A'
        }
      },
      performance: {
        totalReturn: 'N/A',
        priceReturn: 'N/A',
        incomeReturn: 'N/A'
      }
    };
  }
};

// Function to get full analytics for a bond
export const getFullBondAnalytics = async (symbol) => {
  try {
    const bondData = await fetchBondData(symbol);
    const historicalData = await fetchBondHistoricalData(symbol, 365);
    const analytics = await getBondAnalytics(bondData, historicalData);
    
    // Calculate additional metrics
    const yields = historicalData.map(d => d.yield);
    const technicalAnalysis = {
      rsi: calculateRSI(yields),
      bollingerBands: calculateBollingerBands(yields),
      macd: calculateMACD(yields)
    };
    
    const marketAnalysis = {
      yieldCurve: await analyzeYieldCurve(),
      flightToQuality: await calculateFlightToQuality()
    };
    
    const comparativeAnalysis = {
      correlationWithSP500: await calculateCrossMarketCorrelation(symbol, 'SP500'),
      correlationWith10Y: symbol !== 'GS10' ? 
        await calculateCrossMarketCorrelation(symbol, 'GS10') : null
    };

    return {
      ...analytics,
      technicalAnalysis: {
        rsi: technicalAnalysis.rsi !== null ? formatNumber(technicalAnalysis.rsi, 2) : 'N/A',
        bollingerBands: {
          upper: technicalAnalysis.bollingerBands ? formatNumber(technicalAnalysis.bollingerBands?.upper, 2, true) : 'N/A',
          middle: technicalAnalysis.bollingerBands ? formatNumber(technicalAnalysis.bollingerBands?.middle, 2, true) : 'N/A',
          lower: technicalAnalysis.bollingerBands ? formatNumber(technicalAnalysis.bollingerBands?.lower, 2, true) : 'N/A'
        },
        macd: {
          value: technicalAnalysis.macd ? formatNumber(technicalAnalysis.macd?.macd, 2) : 'N/A',
          signal: technicalAnalysis.macd ? formatNumber(technicalAnalysis.macd?.signal, 2) : 'N/A',
          histogram: technicalAnalysis.macd ? formatNumber(technicalAnalysis.macd?.histogram, 2) : 'N/A'
        }
      },
      marketAnalysis: {
        yieldCurve: {
          steepness: marketAnalysis.yieldCurve ? formatNumber(marketAnalysis.yieldCurve?.metrics?.steepness, 2, true) : 'N/A',
          curvature: marketAnalysis.yieldCurve ? formatNumber(marketAnalysis.yieldCurve?.metrics?.curvature, 2, true) : 'N/A',
          inverted: marketAnalysis.yieldCurve ? marketAnalysis.yieldCurve?.metrics?.inverted : 'N/A'
        },
        flightToQuality: {
          spread: marketAnalysis.flightToQuality ? formatNumber(marketAnalysis.flightToQuality?.spread, 2, true) : 'N/A',
          active: marketAnalysis.flightToQuality ? (marketAnalysis.flightToQuality?.flightToQuality ? 'Yes' : 'No') : 'N/A'
        }
      },
      comparativeAnalysis: {
        correlationWithSP500: comparativeAnalysis.correlationWithSP500 !== null ? formatNumber(comparativeAnalysis.correlationWithSP500, 2) : 'N/A',
        correlationWith10Y: comparativeAnalysis.correlationWith10Y !== null ? 
          formatNumber(comparativeAnalysis.correlationWith10Y, 2) : 'N/A'
      }
    };
  } catch (error) {
    console.error('Error getting full bond analytics:', error);
    return null;
  }
};

export { fetchFromFRED };