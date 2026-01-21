// app/api/stocks/route.js
import { NextResponse } from 'next/server';

// API keys for all three providers
const ALPHA_VANTAGE_API_KEY = 'RUSYOJSP4I2T7BBT';
const TWELVE_DATA_API_KEY = '21d20b0aa6094a17a404f613e98ed50f';
const FMP_API_KEY = '1scRqYKLRKaoY4uhX3vS8lpenQ5Tfow5';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const type = searchParams.get('type') || 'quote';
  const range = searchParams.get('range') || '90';

  console.log(`Stocks API request: ${symbol}, ${type}, ${range}`);

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Handle different types of requests
    switch (type) {
      case 'historical': {
        console.log(`Fetching historical data for ${symbol}`);
        
        // Try multiple providers in sequence for redundancy
        const historicalData = await fetchHistoricalData(symbol, range);
        return NextResponse.json(historicalData);
      }

      case 'fundamentals': {
        console.log(`Fetching fundamentals data for ${symbol}`);
        
        // Try multiple providers for fundamentals data
        const fundamentalsData = await fetchFundamentalsData(symbol);
        return NextResponse.json(fundamentalsData);
      }

      default: {
        // Quote data (current price info)
        console.log(`Fetching quote data for ${symbol}`);
        
        // Try multiple providers for quote data
        const quoteData = await fetchQuoteData(symbol);
        return NextResponse.json(quoteData);
      }
    }
  } catch (error) {
    console.error('General API Error:', {
      message: error.message,
      stack: error.stack,
      symbol,
      type,
      range
    });

    // Generate fallback data based on request type
    console.log('Using fallback data generator due to general error');
    if (type === 'historical') {
      const fallbackData = generateHistoricalData(symbol, parseInt(range) || 90);
      return NextResponse.json(fallbackData);
    } else if (type === 'fundamentals') {
      return NextResponse.json(generateFundamentals(symbol));
    } else {
      return NextResponse.json(generateQuote(symbol));
    }
  }
}

// Fetch historical data from multiple providers
async function fetchHistoricalData(symbol, range) {
  // Try Twelve Data first (most generous free tier for historical data)
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=5000&apikey=${TWELVE_DATA_API_KEY}`;
    console.log(`Trying Twelve Data for historical data: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Twelve Data API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data API returned an error');
    }
    
    if (!data.values || !Array.isArray(data.values)) {
      throw new Error('Invalid data format from Twelve Data');
    }
    
    console.log(`Twelve Data returned ${data.values.length} data points`);
    
    const formattedData = data.values.map(item => ({
      date: item.datetime,
      value: parseFloat(item.close),
      close: parseFloat(item.close),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseFloat(item.volume || 0)
    }));
    
    // Sort by date (oldest to newest)
    formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Limit by requested range if needed
    const daysToKeep = parseInt(range);
    return daysToKeep ? formattedData.slice(-daysToKeep) : formattedData;
  } catch (twelveDataError) {
    console.error('Twelve Data historical data error:', twelveDataError);
    
    // Try Alpha Vantage as backup
    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
      console.log(`Trying Alpha Vantage for historical data: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      const timeSeriesData = data['Time Series (Daily)'];
      if (!timeSeriesData) {
        throw new Error('No historical data found in Alpha Vantage response');
      }
      
      console.log(`Alpha Vantage returned ${Object.keys(timeSeriesData).length} data points`);
      
      const formattedData = Object.entries(timeSeriesData).map(([date, values]) => ({
        date,
        value: parseFloat(values['4. close']),
        close: parseFloat(values['4. close']),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        volume: parseFloat(values['5. volume'])
      }));
      
      // Sort by date (oldest to newest)
      formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Limit by requested range if needed
      const daysToKeep = parseInt(range);
      return daysToKeep ? formattedData.slice(-daysToKeep) : formattedData;
    } catch (alphaVantageError) {
      console.error('Alpha Vantage historical data error:', alphaVantageError);
      
      // Try FMP as last resort
      try {
        const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`;
        console.log(`Trying FMP for historical data: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`FMP API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.historical || !Array.isArray(data.historical)) {
          throw new Error('Invalid data format from FMP');
        }
        
        console.log(`FMP returned ${data.historical.length} data points`);
        
        const formattedData = data.historical.map(item => ({
          date: item.date,
          value: parseFloat(item.close),
          close: parseFloat(item.close),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          volume: parseFloat(item.volume || 0)
        }));
        
        // Sort by date (oldest to newest)
        formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Limit by requested range if needed
        const daysToKeep = parseInt(range);
        return daysToKeep ? formattedData.slice(-daysToKeep) : formattedData;
      } catch (fmpError) {
        console.error('FMP historical data error:', fmpError);
        
        // All providers failed, use fallback generator
        console.log('All providers failed, using fallback historical data');
        return generateHistoricalData(symbol, parseInt(range) || 90);
      }
    }
  }
}

// Fetch fundamentals data from multiple providers
async function fetchFundamentalsData(symbol) {
  // Try FMP first (best for fundamentals data)
  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`;
    console.log(`Trying FMP for fundamentals: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`FMP API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format from FMP');
    }
    
    const profile = data[0];
    
    // Try to get financials for more data
    const financialsUrl = `https://financialmodelingprep.com/api/v3/ratios/${symbol}?apikey=${FMP_API_KEY}`;
    const financialsResponse = await fetch(financialsUrl);
    let ratios = [];
    
    if (financialsResponse.ok) {
      ratios = await financialsResponse.json();
    }
    
    const ratio = Array.isArray(ratios) && ratios.length > 0 ? ratios[0] : {};
    
    return {
      currentPrice: profile.price || null,
      marketCap: profile.mktCap || null,
      trailingPE: ratio.priceEarningsRatio || profile.pe || null,
      forwardPE: null, // Not available from FMP in free tier
      priceToBook: ratio.priceToBookRatio || null,
      volume: profile.volAvg || null,
      avgVolume: profile.volAvg || null,
      dayHigh: null, // Not available from profile
      dayLow: null, // Not available from profile
      fiftyDayAverage: null, // Not available from FMP in free tier
      twoHundredDayAverage: null, // Not available from FMP in free tier
      fiftyTwoWeekHigh: profile.range?.split('-')[1]?.trim() || null,
      fiftyTwoWeekLow: profile.range?.split('-')[0]?.trim() || null,
      beta: profile.beta || null,
      dividendRate: profile.lastDiv || null,
      dividendYield: (profile.lastDiv && profile.price) ? (profile.lastDiv / profile.price) * 100 : null
    };
  } catch (fmpError) {
    console.error('FMP fundamentals error:', fmpError);
    
    // Try Alpha Vantage as backup
    try {
      const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      console.log(`Trying Alpha Vantage for fundamentals: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Object.keys(data).length < 5) {
        throw new Error('Insufficient data from Alpha Vantage');
      }
      
      return {
        currentPrice: parseFloat(data.AnalystTargetPrice) || null,
        marketCap: parseFloat(data.MarketCapitalization) || null,
        trailingPE: parseFloat(data.TrailingPE) || null,
        forwardPE: parseFloat(data.ForwardPE) || null,
        priceToBook: parseFloat(data.PriceToBookRatio) || null,
        volume: null, // Not available from OVERVIEW
        avgVolume: null, // Not available from OVERVIEW
        dayHigh: null, // Not available from OVERVIEW
        dayLow: null, // Not available from OVERVIEW
        fiftyDayAverage: parseFloat(data['50DayMovingAverage']) || null,
        twoHundredDayAverage: parseFloat(data['200DayMovingAverage']) || null,
        fiftyTwoWeekHigh: parseFloat(data['52WeekHigh']) || null,
        fiftyTwoWeekLow: parseFloat(data['52WeekLow']) || null,
        beta: parseFloat(data.Beta) || null,
        dividendRate: parseFloat(data.DividendPerShare) || null,
        dividendYield: parseFloat(data.DividendYield) * 100 || null
      };
    } catch (alphaVantageError) {
      console.error('Alpha Vantage fundamentals error:', alphaVantageError);
      
      // All providers failed, use fallback
      console.log('All providers failed, using fallback fundamentals data');
      return generateFundamentals(symbol);
    }
  }
}

// Fetch quote data from multiple providers
async function fetchQuoteData(symbol) {
  // Try FMP first (most reliable for quotes)
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
    console.log(`Trying FMP for quote: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`FMP API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format from FMP');
    }
    
    const quote = data[0];
    
    return {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      overview: {
        volume: quote.volume,
        open: quote.open,
        high: quote.dayHigh,
        low: quote.dayLow,
        previousClose: quote.previousClose
      },
      symbol: quote.symbol,
      longName: quote.name
    };
  } catch (fmpError) {
    console.error('FMP quote error:', fmpError);
    
    // Try Twelve Data as backup
    try {
      const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Trying Twelve Data for quote: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Twelve Data API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Twelve Data API returned an error');
      }
      
      // Try to get company name
      let name = symbol;
      try {
        const symbolSearchUrl = `https://api.twelvedata.com/symbol_search?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`;
        const symbolSearchResponse = await fetch(symbolSearchUrl);
        if (symbolSearchResponse.ok) {
          const symbolSearchData = await symbolSearchResponse.json();
          if (symbolSearchData.data && symbolSearchData.data.length > 0) {
            name = symbolSearchData.data[0].instrument_name;
          }
        }
      } catch (nameError) {
        console.warn('Error fetching company name:', nameError);
      }
      
      const change = data.close - data.previous_close;
      const changePercent = (change / data.previous_close) * 100;
      
      return {
        price: parseFloat(data.close),
        change: change,
        changePercent: changePercent,
        overview: {
          volume: parseInt(data.volume),
          open: parseFloat(data.open),
          high: parseFloat(data.high),
          low: parseFloat(data.low),
          previousClose: parseFloat(data.previous_close)
        },
        symbol: symbol,
        longName: name
      };
    } catch (twelveDataError) {
      console.error('Twelve Data quote error:', twelveDataError);
      
      // Try Alpha Vantage as last resort
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        console.log(`Trying Alpha Vantage for quote: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Alpha Vantage API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data['Error Message']) {
          throw new Error(data['Error Message']);
        }
        
        if (data['Information']) {
          console.warn('Alpha Vantage info:', data['Information']);
        }
        
        const globalQuote = data['Global Quote'];
        if (!globalQuote || !globalQuote['05. price']) {
          throw new Error('No quote data found in Alpha Vantage response');
        }
        
        return {
          price: parseFloat(globalQuote['05. price']),
          change: parseFloat(globalQuote['09. change']),
          changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
          overview: {
            volume: parseInt(globalQuote['06. volume']),
            open: parseFloat(globalQuote['02. open']),
            high: parseFloat(globalQuote['03. high']),
            low: parseFloat(globalQuote['04. low']),
            previousClose: parseFloat(globalQuote['08. previous close'])
          },
          symbol: symbol,
          longName: getCompanyName(symbol) // Alpha Vantage doesn't provide name in quote
        };
      } catch (alphaVantageError) {
        console.error('Alpha Vantage quote error:', alphaVantageError);
        
        // All providers failed, use fallback
        console.log('All providers failed, using fallback quote data');
        return generateQuote(symbol);
      }
    }
  }
}

// Get company name based on symbol
function getCompanyName(symbol) {
  const commonNames = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices, Inc.',
    'INTC': 'Intel Corporation',
    'CSCO': 'Cisco Systems Inc.',
    'ADBE': 'Adobe Inc.',
    'NFLX': 'Netflix Inc.'
  };

  return commonNames[symbol] || `${symbol} Inc.`;
}

// Function to generate a realistic quote as fallback
function generateQuote(symbol) {
  const basePrice = getBasePrice(symbol);
  
  return {
    price: basePrice,
    change: (Math.random() - 0.3) * 5,
    changePercent: (Math.random() - 0.3) * 3,
    overview: {
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      open: basePrice * (1 - 0.01 * Math.random()),
      high: basePrice * (1 + 0.02 * Math.random()),
      low: basePrice * (1 - 0.02 * Math.random()),
      previousClose: basePrice * (1 + (Math.random() - 0.5) * 0.02)
    },
    symbol: symbol,
    longName: getCompanyName(symbol)
  };
}

// Get a consistent base price for a symbol
function getBasePrice(symbol) {
  const symbolHash = symbol.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return 50 + (symbolHash % 95); // Price between $50 and $145
}

// Function to generate historical data as fallback
function generateHistoricalData(symbol, days = 90) {
  const today = new Date();
  const basePrice = getBasePrice(symbol);
  const volatility = 0.015; // 1.5% daily volatility
  
  const data = [];
  let currentPrice = basePrice;
  
  // Generate data going back the specified number of days
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Random price movement with a slight trend
    const trend = (Math.random() > 0.48) ? 1 : -1;
    const change = trend * Math.random() * volatility * currentPrice;
    currentPrice += change;
    
    // Generate more realistic OHLC data
    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, currentPrice) * (1 + Math.random() * 0.01);
    const low = Math.min(open, currentPrice) * (1 - Math.random() * 0.01);
    
    // Generate volume
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: currentPrice,
      close: currentPrice,
      open: open,
      high: high,
      low: low,
      volume: volume
    });
  }
  
  return data;
}

// Function to generate fundamentals data as fallback
function generateFundamentals(symbol) {
  const basePrice = getBasePrice(symbol);
  
  return {
    currentPrice: basePrice,
    marketCap: basePrice * (Math.floor(Math.random() * 9) + 1) * 1000000000,
    trailingPE: 15 + Math.random() * 25,
    forwardPE: 14 + Math.random() * 20,
    priceToBook: 2 + Math.random() * 8,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    avgVolume: Math.floor(Math.random() * 8000000) + 2000000,
    dayHigh: basePrice * (1 + 0.02 * Math.random()),
    dayLow: basePrice * (1 - 0.02 * Math.random()),
    fiftyDayAverage: basePrice * (1 + (Math.random() - 0.5) * 0.1),
    twoHundredDayAverage: basePrice * (1 + (Math.random() - 0.5) * 0.2),
    fiftyTwoWeekHigh: basePrice * (1 + 0.2 * Math.random()),
    fiftyTwoWeekLow: basePrice * (1 - 0.2 * Math.random()),
    beta: 0.8 + Math.random() * 1.2,
    dividendRate: Math.random() * 3,
    dividendYield: Math.random() * 4
  };
}