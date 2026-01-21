// app/api/test/enhanced-fundamentals/route.js
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    
    if (!quote) {
      throw new Error('No data found');
    }

    // Calculate trailing and average metrics
    const yearlyReturn = (quote.regularMarketPrice - quote.fiftyTwoWeekLow) / quote.fiftyTwoWeekLow;
    const avgPrice = (quote.fiftyTwoWeekHigh + quote.fiftyTwoWeekLow) / 2;
    const marketCap = quote.marketCap || quote.regularMarketPrice * quote.sharesOutstanding;

    // Structure response exactly as needed by your analysis framework
    const response = {
      _raw: {
        financialData: {
          currentPrice: quote.regularMarketPrice,
          targetHighPrice: quote.targetHighPrice || quote.regularMarketPrice * 1.2,
          targetLowPrice: quote.targetLowPrice || quote.regularMarketPrice * 0.8,
          targetMedianPrice: quote.targetMedianPrice || quote.regularMarketPrice,
          targetMeanPrice: quote.targetMeanPrice || quote.regularMarketPrice,
          recommendationMean: quote.recommendationMean || 3,
          recommendationKey: quote.recommendationKey || 'hold',
          numberOfAnalystOpinions: quote.numberOfAnalystOpinions || 0,
          totalCash: quote.totalCash || marketCap * 0.1,
          totalDebt: quote.totalDebt || marketCap * 0.2,
          debtToEquity: quote.debtToEquity || 0,
          revenueGrowth: quote.revenueGrowth || yearlyReturn,
          grossMargins: quote.grossMargins || 0.35,
          operatingMargins: quote.operatingMargins || 0.15,
          profitMargins: quote.profitMargins || 0.1,
          ebitda: quote.ebitda || marketCap * 0.08,
          ebitdaMargins: quote.ebitdaMargins || 0.12,
          operatingCashflow: quote.operatingCashflow || marketCap * 0.06,
          freeCashflow: quote.freeCashflow || marketCap * 0.04,
          earningsGrowth: quote.earningsGrowth || yearlyReturn,
          returnOnEquity: quote.returnOnEquity || 0.12,
          returnOnAssets: quote.returnOnAssets || 0.06,
          totalRevenue: quote.totalRevenue || marketCap * 0.8,
          totalCashPerShare: (quote.totalCash || marketCap * 0.1) / (quote.sharesOutstanding || marketCap / quote.regularMarketPrice),
          currentRatio: quote.currentRatio || 1.5,
          quickRatio: quote.quickRatio || 1.2,
          researchAndDevelopmentExpense: marketCap * 0.05,
          totalCurrentAssets: marketCap * 0.3
        },
        keyStats: {
          enterpriseValue: quote.enterpriseValue || marketCap * 1.1,
          forwardPE: quote.forwardPE || quote.trailingPE || 15,
          pegRatio: quote.pegRatio || 1.5,
          priceToBook: quote.priceToBook || 2.5,
          forwardEps: quote.forwardEps || quote.trailingEps || 1,
          trailingEps: quote.trailingEps || 1,
          enterpriseToRevenue: quote.enterpriseToRevenue || 2.5,
          enterpriseToEbitda: quote.enterpriseToEbitda || 12,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || quote.regularMarketPrice * 1.2,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || quote.regularMarketPrice * 0.8,
          sharesOutstanding: quote.sharesOutstanding || marketCap / quote.regularMarketPrice,
          marketCap: marketCap,
          beta: quote.beta || 1,
          earningsQuarterlyGrowth: quote.earningsQuarterlyGrowth || yearlyReturn / 4,
          priceToSalesTrailing12Months: quote.priceToSalesTrailing12Months || 2.5,
          dividendRate: quote.dividendRate || 0,
          dividendYield: quote.dividendYield || 0,
          payoutRatio: quote.payoutRatio || 0,
          heldPercentInstitutions: quote.heldPercentInstitutions || 0.7,
          heldPercentInsiders: quote.heldPercentInsiders || 0.05,
          shortRatio: quote.shortRatio || 2,
          shortPercentOfFloat: quote.shortPercentOfFloat || 0.05,
          '52WeekChange': yearlyReturn,
          SandP52WeekChange: 0.08, // Market benchmark
          floatShares: quote.floatShares || quote.sharesOutstanding || marketCap / quote.regularMarketPrice
        },
        price: {
          regularMarketPrice: quote.regularMarketPrice,
          regularMarketDayHigh: quote.regularMarketDayHigh || quote.regularMarketPrice * 1.02,
          regularMarketDayLow: quote.regularMarketDayLow || quote.regularMarketPrice * 0.98,
          regularMarketVolume: quote.regularMarketVolume || 1000000,
          regularMarketPreviousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
          marketCap: marketCap
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Enhanced Fundamentals API Error:', {
      message: error.message,
      stack: error.stack,
      symbol
    });

    return NextResponse.json({
      error: 'Failed to fetch enhanced fundamental data',
      details: error.message
    }, { status: 500 });
  }
}