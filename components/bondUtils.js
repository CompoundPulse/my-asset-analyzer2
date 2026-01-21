// bondUtils.js
import { bondCategories, bondSymbols, categoryMetadata } from './bondCategories';

const FRED_API_KEY = '1ce91b346e114eb59739b5e59c9107c1';

// Basic FRED fetch function
const fetchFromFRED = async (endpoint, params = {}) => {
  const response = await fetch('/api/bonds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      endpoint,
      params
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// Calculate implied coupon rate from yield and price
const calculateImpliedCoupon = (yield_value, price, maturityYears) => {
  const periodsPerYear = 2;  // Semi-annual payments
  const r = yield_value / (100 * periodsPerYear);  // Convert to per-period yield
  const n = maturityYears * periodsPerYear;  // Total number of periods
  const F = 1000;  // Face value

  // Solving for coupon payment using bond price formula
  const discountFactor = 1 / Math.pow(1 + r, n);
  const annuityFactor = (1 - discountFactor) / r;
  const C = (price - F * discountFactor) / annuityFactor;

  // Convert semi-annual coupon payment to annual rate
  return (C * periodsPerYear / F) * 100;
};

// 1. YIELD ANALYSIS FUNCTIONS

// Calculate zero-coupon yield
const calculateZeroRate = (yield_value, maturityYears) => {
  const price = 1000 * (1 - (yield_value / 100));
  return (Math.pow(1000/price, 1/maturityYears) - 1) * 100;
};

// Calculate forward rate between two points on yield curve
const calculateForwardRate = (yield1, maturity1, yield2, maturity2) => {
  const r1 = yield1 / 100;
  const r2 = yield2 / 100;
  const t1 = maturity1;
  const t2 = maturity2;
  
  return ((Math.pow(1 + r2, t2) / Math.pow(1 + r1, t1)) - 1) * 100;
};

// Calculate real yield (adjusted for inflation)
const calculateRealYield = async (nominalYield) => {
  try {
    // Get latest inflation expectation from FRED (T5YIEM series)
    const inflationData = await fetchFromFRED('series/observations', {
      series_id: 'T5YIEM',
      sort_order: 'desc',
      limit: 1
    });
    
    if (!inflationData.observations || !inflationData.observations[0]) {
      return null;
    }

    const inflationExpectation = parseFloat(inflationData.observations[0].value);
    return (((1 + nominalYield/100) / (1 + inflationExpectation/100)) - 1) * 100;
  } catch (error) {
    console.error('Error calculating real yield:', error);
    return null;
  }
};

// Calculate break-even inflation rate
const calculateBreakEvenInflation = async (nominalYield) => {
  try {
    // Get TIPS yield from FRED (FII10 series for 10-year TIPS)
    const tipsData = await fetchFromFRED('series/observations', {
      series_id: 'FII10',
      sort_order: 'desc',
      limit: 1
    });
    
    if (!tipsData.observations || !tipsData.observations[0]) {
      return null;
    }

    const tipsYield = parseFloat(tipsData.observations[0].value);
    return nominalYield - tipsYield;
  } catch (error) {
    console.error('Error calculating break-even inflation:', error);
    return null;
  }
};

// 2. RISK METRICS FUNCTIONS

// Calculate modified duration
const calculateModifiedDuration = (yield_value, maturityYears, couponRate) => {
  const yieldPerPeriod = yield_value / 200; // Semi-annual yield
  const periodsPerYear = 2;
  const periods = maturityYears * periodsPerYear;
  const couponPerPeriod = couponRate / 200;

  let duration = 0;
  let pv = 0;
  
  // Calculate PV of each cash flow and its contribution to duration
  for (let i = 1; i <= periods; i++) {
    const pvFactor = Math.pow(1 + yieldPerPeriod, -i);
    const pvCashFlow = 1000 * couponPerPeriod * pvFactor;
    duration += (i / periodsPerYear) * pvCashFlow;
    pv += pvCashFlow;
  }
  
  // Add contribution of final principal payment
  const pvPrincipal = 1000 * Math.pow(1 + yieldPerPeriod, -periods);
  duration += maturityYears * pvPrincipal;
  pv += pvPrincipal;
  
  const macaulayDuration = duration / pv;
  return macaulayDuration / (1 + yieldPerPeriod);
};

// Calculate convexity
const calculateConvexity = (yield_value, maturityYears, couponRate) => {
  const yieldPerPeriod = yield_value / 200;
  const periodsPerYear = 2;
  const periods = maturityYears * periodsPerYear;
  const couponPerPeriod = couponRate / 200;

  let convexity = 0;
  let pv = 0;
  
  for (let i = 1; i <= periods; i++) {
    const pvFactor = Math.pow(1 + yieldPerPeriod, -i);
    const pvCashFlow = 1000 * couponPerPeriod * pvFactor;
    convexity += (i * (i + 1)) * pvCashFlow;
    pv += pvCashFlow;
  }
  
  const pvPrincipal = 1000 * Math.pow(1 + yieldPerPeriod, -periods);
  convexity += periods * (periods + 1) * pvPrincipal;
  pv += pvPrincipal;
  
  return convexity / (pv * Math.pow(1 + yieldPerPeriod, 2) * 2);
};

// Calculate Value at Risk (VaR)
const calculateVaR = async (symbol, confidence = 0.95, holdingPeriod = 10) => {
  try {
    // Get historical data for the past year
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const data = await fetchFromFRED('series/observations', {
      series_id: symbol,
      observation_start: startDate,
      observation_end: endDate,
      sort_order: 'asc'
    });

    if (!data.observations || data.observations.length < 30) {
      return null;
    }

    // Calculate daily yield changes
    const yieldChanges = [];
    for (let i = 1; i < data.observations.length; i++) {
      const change = parseFloat(data.observations[i].value) - parseFloat(data.observations[i-1].value);
      yieldChanges.push(change);
    }

    // Calculate standard deviation of yield changes
    const mean = yieldChanges.reduce((a, b) => a + b, 0) / yieldChanges.length;
    const variance = yieldChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (yieldChanges.length - 1);
    const stdDev = Math.sqrt(variance);

    // Calculate VaR
    const zScore = confidence === 0.95 ? 1.645 : 2.326; // 95% or 99% confidence
    const dailyVaR = zScore * stdDev;
    const periodVaR = dailyVaR * Math.sqrt(holdingPeriod);

    return periodVaR;
  } catch (error) {
    console.error('Error calculating VaR:', error);
    return null;
  }
};

// Calculate key rate duration
const calculateKeyRateDuration = (yield_value, maturityYears, couponRate, shiftPoint) => {
  const calculateBondPrice = (yieldValue, maturityYears, couponRate) => {
    const periodsPerYear = 2;  // Semi-annual payments
    const r = yieldValue / (100 * periodsPerYear);  // Convert to per-period yield
    const n = maturityYears * periodsPerYear;  // Total number of periods
    const F = 1000;  // Face value
    const C = (couponRate / 100) * F / periodsPerYear; // Semi-annual coupon payment
  
    let price = 0;
    for (let i = 1; i <= n; i++) {
      price += C / Math.pow(1 + r, i);
    }
    price += F / Math.pow(1 + r, n);
    return price;
  };

  const basePrice = calculateBondPrice(yield_value, maturityYears, couponRate);
  const shiftedYield = yield_value + 0.01; // 1 basis point shift
  
  let shiftedPrice;
  if (maturityYears === shiftPoint) {
    shiftedPrice = calculateBondPrice(shiftedYield, maturityYears, couponRate);
  } else {
    // Interpolate yield change based on distance from shift point
    const interpolatedShift = 0.01 * Math.exp(-Math.abs(maturityYears - shiftPoint) / 2);
    shiftedPrice = calculateBondPrice(yield_value + interpolatedShift, maturityYears, couponRate);
  }
  
  return -(shiftedPrice - basePrice) / (basePrice * 0.0001); // Convert to basis point sensitivity
};

// 3. STATISTICAL ANALYSIS FUNCTIONS
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

// 4. PERFORMANCE METRICS FUNCTIONS
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

// Basic bond data fetch
export const fetchBondData = async (symbol) => {
  try {
    // Get latest observations
    const data = await fetchFromFRED('series/observations', {
      series_id: symbol,
      sort_order: 'desc',
      limit: 2  // Get 2 for change calculation
    });

    if (!data.observations || !data.observations[0]) {
      return {
        symbol,
        price: '0.00',
        yield: '0.00',
        change: '0.00',
        changePercent: '0.00',
        overview: {
          name: bondSymbols[symbol] || symbol,
          lastUpdated: new Date().toISOString().split('T')[0],
          yieldToMaturity: '0.00%',
          couponRate: '0.00%',
          maturityYears: 0,
          paymentFrequency: 'Semi-Annual',
          type: 'Treasury Constant Maturity',
          category: 'Government Bonds',
          riskLevel: 'Low',
          benchmark: symbol === 'GS10' ? 'Primary Treasury Benchmark' : 'Treasury Security',
          modifiedDuration: '0.00',
          convexity: '0.0000',
          zeroRate: '0.00%',
          valueAtRisk95: 'N/A',
          realYield: 'N/A',
          breakEvenInflation: 'N/A'
        }
      };
    }

    const latestData = data.observations[0];
    const previousData = data.observations[1];
    
    const yield_value = parseFloat(latestData.value);
    const price = 1000 * (1 - (yield_value / 100));  // Simple price calculation

    // Calculate change if we have previous data
    let change = '0.00';
    let changePercent = '0.00';
    
    if (previousData) {
      const prev_yield = parseFloat(previousData.value);
      const prev_price = 1000 * (1 - (prev_yield / 100));
      change = (price - prev_price).toFixed(2);
      changePercent = ((price - prev_price) / prev_price * 100).toFixed(2);
    }

    // Get maturity years
    const maturityYears = symbol.includes('GS') ? 
      parseInt(symbol.replace('GS', '')) || 
      (symbol === 'GS6M' ? 0.5 : symbol === 'GS3M' ? 0.25 : 10) : 10;

    // Calculate implied coupon rate
    const couponRate = calculateImpliedCoupon(yield_value, price, maturityYears);

    // Add new risk metrics to the overview
    const modifiedDuration = calculateModifiedDuration(yield_value, maturityYears, couponRate);
    const convexity = calculateConvexity(yield_value, maturityYears, couponRate);
    const zeroRate = calculateZeroRate(yield_value, maturityYears);
    const var95 = await calculateVaR(symbol);
    const realYield = await calculateRealYield(yield_value);
    const breakEvenInflation = await calculateBreakEvenInflation(yield_value);


    // Get historical data for calculations
const historicalData = await fetchBondHistoricalData(symbol, 365); // Get 1 year of data
const yields = historicalData.map(d => d.yield);
const prices = historicalData.map(d => d.value);

const volatility = calculateHistoricalVolatility(yields);
const movingAverages = calculateMovingAverages(yields);
const totalReturnMetrics = prices.length > 0 ? calculateTotalReturn(
  prices[0],
  prices[prices.length - 1],
  couponRate / 100,
  1
) : { totalReturn: 'N/A', priceReturn: 'N/A', incomeReturn: 'N/A' };

    const bondData = {
      symbol,
      price: price.toFixed(2),
      yield: yield_value.toFixed(2),
      change,
      changePercent,
      overview: {
        name: bondSymbols[symbol] || symbol,
        lastUpdated: latestData.date,
        yieldToMaturity: yield_value.toFixed(2) + '%',
        couponRate: couponRate.toFixed(2) + '%',
        maturityYears,
        paymentFrequency: 'Semi-Annual',
        type: 'Treasury Constant Maturity',
        category: 'Government Bonds',
        riskLevel: 'Low',
        benchmark: symbol === 'GS10' ? 'Primary Treasury Benchmark' : 'Treasury Security',
        modifiedDuration: modifiedDuration.toFixed(2),
        convexity: convexity.toFixed(4),
        zeroRate: zeroRate.toFixed(2) + '%',
        valueAtRisk95: var95 ? var95.toFixed(2) + '%' : 'N/A',
        realYield: realYield ? realYield.toFixed(2) + '%' : 'N/A',
        breakEvenInflation: breakEvenInflation ? breakEvenInflation.toFixed(2) + '%' : 'N/A'
      }
    };

    return bondData;
  } catch (error) {
    console.error('Error fetching bond data:', error);
    return {
      symbol,
      price: '0.00',
      yield: '0.00',
      change: '0.00',
      changePercent: '0.00',
      overview: {
        name: bondSymbols[symbol] || symbol,
        lastUpdated: new Date().toISOString().split('T')[0],
        yieldToMaturity: '0.00%',
        couponRate: '0.00%',
        maturityYears: 0,
        paymentFrequency: 'Semi-Annual',
        type: 'Treasury Constant Maturity',
        category: 'Government Bonds',
        riskLevel: 'Low',
        benchmark: symbol === 'GS10' ? 'Primary Treasury Benchmark' : 'Treasury Security',
        modifiedDuration: '0.00',
        convexity: '0.0000',
        zeroRate: '0.00%',
        valueAtRisk95: 'N/A',
        realYield: 'N/A',
        breakEvenInflation: 'N/A'
      }
    };
  }
};

// Basic historical data fetch
export const fetchBondHistoricalData = async (symbol, timeRange) => {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const data = await fetchFromFRED('series/observations', {
      series_id: symbol,
      observation_start: startDate,
      observation_end: endDate,
      sort_order: 'asc'
    });

    if (!data.observations || data.observations.length === 0) {
      return [];
    }

    return data.observations.map(obs => ({
      date: obs.date,
      price: 1000 * (1 - (parseFloat(obs.value) / 100)),  // Price calculation
      value: 1000 * (1 - (parseFloat(obs.value) / 100)),  // For compatibility with technical indicators
      yield: parseFloat(obs.value)
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
};

export { bondCategories, bondSymbols, categoryMetadata };