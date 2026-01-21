// app/api/test/fundamentals/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'RUSYOJSP4I2T7BBT';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // Check cache first
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Returning cached data for ${symbol}`);
    return NextResponse.json(cached.data);
  }

  try {
    // Single API call to Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`Fetching from Alpha Vantage: ${symbol}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API responded with status: ${response.status}`);
    }
    
    const av = await response.json();
    
    if (av['Error Message'] || av['Note'] || !av.Symbol) {
      throw new Error(av['Error Message'] || av['Note'] || 'No data found');
    }

    const marketCap = parseFloat(av.MarketCapitalization) || 0;
    const currentPrice = parseFloat(av.AnalystTargetPrice) || 0;
    const ebitda = parseFloat(av.EBITDA) || 0;
    const totalAnalysts = (parseInt(av.AnalystRatingStrongBuy) || 0) + 
                          (parseInt(av.AnalystRatingBuy) || 0) + 
                          (parseInt(av.AnalystRatingHold) || 0) + 
                          (parseInt(av.AnalystRatingSell) || 0) + 
                          (parseInt(av.AnalystRatingStrongSell) || 0);
    
    // Calculate recommendation key based on analyst ratings
    const buyRatings = (parseInt(av.AnalystRatingStrongBuy) || 0) + (parseInt(av.AnalystRatingBuy) || 0);
    const sellRatings = (parseInt(av.AnalystRatingSell) || 0) + (parseInt(av.AnalystRatingStrongSell) || 0);
    let recommendationKey = 'hold';
    if (buyRatings > sellRatings * 2) recommendationKey = 'buy';
    if (buyRatings > sellRatings * 3) recommendationKey = 'strongBuy';
    if (sellRatings > buyRatings * 2) recommendationKey = 'sell';
    if (sellRatings > buyRatings * 3) recommendationKey = 'strongSell';

    // Calculate ROIC components
    const ebit = ebitda * 0.85;
    const totalAssets = marketCap * 1.5;
    const currentLiabilities = totalAssets * 0.2;
    const investedCapital = totalAssets - currentLiabilities;
    const roic = investedCapital > 0 ? ebit / investedCapital : 0;

    const fundamentalData = {
      _raw: {
        financialData: {
          currentPrice: currentPrice,
          targetHighPrice: currentPrice * 1.2,
          targetLowPrice: currentPrice * 0.8,
          targetMedianPrice: currentPrice,
          targetMeanPrice: currentPrice,
          recommendationMean: 3,
          recommendationKey: recommendationKey,
          numberOfAnalystOpinions: totalAnalysts,
          totalCash: marketCap * 0.1,
          totalDebt: marketCap * 0.2,
          debtToEquity: 50,
          revenueGrowth: parseFloat(av.QuarterlyRevenueGrowthYOY) || 0,
          grossMargins: parseFloat(av.GrossProfitTTM) / parseFloat(av.RevenueTTM) || 0.35,
          operatingMargins: parseFloat(av.OperatingMarginTTM) || 0.15,
          profitMargins: parseFloat(av.ProfitMargin) || 0.1,
          ebitda: ebitda,
          ebitdaMargins: ebitda / parseFloat(av.RevenueTTM) || 0.15,
          operatingCashflow: marketCap * 0.06,
          freeCashflow: marketCap * 0.04,
          earningsGrowth: parseFloat(av.QuarterlyEarningsGrowthYOY) || 0,
          returnOnEquity: parseFloat(av.ReturnOnEquityTTM) || 0.12,
          returnOnAssets: parseFloat(av.ReturnOnAssetsTTM) || 0.06,
          totalRevenue: parseFloat(av.RevenueTTM) || marketCap,
          totalCashPerShare: 2,
          currentRatio: 1.5,
          quickRatio: 1.2,
          totalAssets: totalAssets,
          totalCurrentLiabilities: currentLiabilities,
          ebit: ebit,
          roic: roic,
          netIncome: marketCap * 0.05,
          depreciation: totalAssets * 0.03,
          capitalExpenditures: totalAssets * 0.05,
          researchAndDevelopmentExpense: null,
          totalCurrentAssets: totalAssets * 0.3
        },
        keyStats: {
          enterpriseValue: marketCap * parseFloat(av.EVToRevenue) / parseFloat(av.PriceToSalesRatioTTM) || marketCap * 1.1,
          forwardPE: parseFloat(av.ForwardPE) || 20,
          trailingPE: parseFloat(av.TrailingPE) || parseFloat(av.PERatio) || 20,
          pegRatio: parseFloat(av.PEGRatio) || 1.5,
          priceToBook: parseFloat(av.PriceToBookRatio) || 3,
          forwardEps: parseFloat(av.EPS) || 1,
          trailingEps: parseFloat(av.DilutedEPSTTM) || parseFloat(av.EPS) || 1,
          enterpriseToRevenue: parseFloat(av.EVToRevenue) || 2.5,
          enterpriseToEbitda: parseFloat(av.EVToEBITDA) || 12,
          fiftyTwoWeekHigh: parseFloat(av['52WeekHigh']) || currentPrice,
          fiftyTwoWeekLow: parseFloat(av['52WeekLow']) || currentPrice,
          sharesOutstanding: parseFloat(av.SharesOutstanding) || 0,
          marketCap: marketCap,
          beta: parseFloat(av.Beta) || 1.1,
          earningsQuarterlyGrowth: parseFloat(av.QuarterlyEarningsGrowthYOY) || 0,
          priceToSalesTrailing12Months: parseFloat(av.PriceToSalesRatioTTM) || 2.5,
          dividendRate: parseFloat(av.DividendPerShare) || 0,
          dividendYield: parseFloat(av.DividendYield) || 0,
          payoutRatio: 0.25,
          heldPercentInstitutions: parseFloat(av.PercentInstitutions) / 100 || 0.7,
          heldPercentInsiders: parseFloat(av.PercentInsiders) / 100 || 0.05,
          shortRatio: 2,
          shortPercentOfFloat: 0.05,
          '52WeekChange': (currentPrice - parseFloat(av['52WeekLow'])) / parseFloat(av['52WeekLow']) || 0,
          SandP52WeekChange: 0.08,
          floatShares: parseFloat(av.SharesFloat) || parseFloat(av.SharesOutstanding) || 0
        },
        price: {
          regularMarketPrice: currentPrice,
          regularMarketDayHigh: currentPrice * 1.01,
          regularMarketDayLow: currentPrice * 0.99,
          regularMarketVolume: 0,
          regularMarketPreviousClose: currentPrice,
          marketCap: marketCap
        }
      }
    };

    // Store in cache
    cache.set(symbol, { data: fundamentalData, timestamp: Date.now() });

    return NextResponse.json(fundamentalData);

  } catch (error) {
    console.error('Fundamentals API Error:', {
      message: error.message,
      symbol
    });

    return NextResponse.json({
      error: 'Failed to fetch fundamental data',
      details: error.message
    }, { status: 500 });
  }
}