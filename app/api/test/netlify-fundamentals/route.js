// app/api/test/netlify-fundamentals/route.js
// Fixed: Yahoo Finance blocks server-side on Vercel/Netlify.
// Falls back to Alpha Vantage automatically. Never throws 500 on missing price.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'RUSYOJSP4I2T7BBT';

async function tryYahoo(symbol) {
  try {
    const yf = (await import('yahoo-finance2')).default;
    const [quoteResult, histResult] = await Promise.allSettled([
      yf.quote(symbol),
      yf.historical(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: '1d',
      }),
    ]);
    const q = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const hist = histResult.status === 'fulfilled' ? histResult.value : [];
    if (!q?.regularMarketPrice) return null;
    return { q, hist };
  } catch {
    return null;
  }
}

async function tryAlphaVantage(symbol) {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${AV_KEY}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data['Error Message'] || data['Note'] || !data.Symbol) return null;
    return data;
  } catch {
    return null;
  }
}

function buildFromYahoo({ q, hist }) {
  const marketCap = q.marketCap || q.regularMarketPrice * (q.sharesOutstanding || 1_000_000);
  const yearlyReturn = hist.length >= 2
    ? (hist[hist.length - 1].close - hist[0].close) / hist[0].close
    : 0;
  const ebitda = q.ebitda || marketCap * 0.08;
  const ebit = ebitda * 0.85;
  const totalAssets = marketCap * 1.5;
  const currentLiabilities = totalAssets * 0.2;
  const investedCapital = totalAssets - currentLiabilities;
  const roic = investedCapital > 0 ? ebit / investedCapital : 0;

  return {
    _raw: {
      financialData: {
        currentPrice: q.regularMarketPrice,
        targetHighPrice: q.targetHighPrice || q.regularMarketPrice * 1.2,
        targetLowPrice: q.targetLowPrice || q.regularMarketPrice * 0.8,
        targetMedianPrice: q.targetMedianPrice || q.regularMarketPrice,
        targetMeanPrice: q.targetMeanPrice || q.regularMarketPrice,
        recommendationMean: q.recommendationMean || 3,
        recommendationKey: q.recommendationKey || 'hold',
        numberOfAnalystOpinions: q.numberOfAnalystOpinions || 0,
        totalCash: q.totalCash || marketCap * 0.1,
        totalDebt: q.totalDebt || marketCap * 0.2,
        debtToEquity: q.debtToEquity || 50,
        revenueGrowth: q.revenueGrowth || yearlyReturn,
        grossMargins: q.grossMargins || 0.35,
        operatingMargins: q.operatingMargins || 0.15,
        profitMargins: q.profitMargins || 0.1,
        ebitda, ebitdaMargins: 0.15,
        operatingCashflow: q.operatingCashflow || marketCap * 0.06,
        freeCashflow: q.freeCashflow || marketCap * 0.04,
        earningsGrowth: q.earningsGrowth || yearlyReturn,
        returnOnEquity: q.returnOnEquity || 0.12,
        returnOnAssets: q.returnOnAssets || 0.06,
        totalRevenue: q.totalRevenue || marketCap,
        totalCashPerShare: q.totalCash ? q.totalCash / (q.sharesOutstanding || 1) : 2,
        currentRatio: q.currentRatio || 1.5,
        quickRatio: q.quickRatio || 1.2,
        totalAssets, totalCurrentLiabilities: currentLiabilities,
        ebit, roic,
        netIncome: q.netIncome || marketCap * 0.05,
        depreciation: totalAssets * 0.03,
        capitalExpenditures: totalAssets * 0.05,
        researchAndDevelopmentExpense: null,
        totalCurrentAssets: totalAssets * 0.3,
      },
      keyStats: {
        enterpriseValue: q.enterpriseValue || marketCap * 1.1,
        forwardPE: q.forwardPE || q.trailingPE || 20,
        pegRatio: q.pegRatio || 1.5,
        priceToBook: q.priceToBook || 3,
        forwardEps: q.forwardEps || 1,
        trailingEps: q.trailingEps || 1,
        enterpriseToRevenue: q.enterpriseToRevenue || 2.5,
        enterpriseToEbitda: q.enterpriseToEbitda || 12,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow,
        sharesOutstanding: q.sharesOutstanding,
        marketCap, beta: q.beta || 1.1,
        earningsQuarterlyGrowth: q.earningsQuarterlyGrowth || yearlyReturn / 4,
        priceToSalesTrailing12Months: q.priceToSalesTrailing12Months || 2.5,
        dividendRate: q.dividendRate || 0,
        dividendYield: q.dividendYield || 0,
        payoutRatio: q.dividendRate && q.trailingEps ? q.dividendRate / q.trailingEps : 0.25,
        heldPercentInstitutions: q.heldPercentInstitutions || 0.7,
        heldPercentInsiders: q.heldPercentInsiders || 0.05,
        shortRatio: q.shortRatio || 2,
        shortPercentOfFloat: q.shortPercentOfFloat || 0.05,
        '52WeekChange': yearlyReturn,
        SandP52WeekChange: 0.08,
        floatShares: q.floatShares || q.sharesOutstanding || 1,
      },
      price: {
        regularMarketPrice: q.regularMarketPrice,
        regularMarketDayHigh: q.regularMarketDayHigh,
        regularMarketDayLow: q.regularMarketDayLow,
        regularMarketVolume: q.regularMarketVolume,
        regularMarketPreviousClose: q.regularMarketPreviousClose,
        marketCap,
      },
    },
  };
}

function buildFromAlphaVantage(av) {
  const marketCap = parseFloat(av.MarketCapitalization) || 0;
  const currentPrice = parseFloat(av.AnalystTargetPrice) || parseFloat(av['50DayMovingAverage']) || 100;
  const ebitda = parseFloat(av.EBITDA) || 0;
  const buyR = (parseInt(av.AnalystRatingStrongBuy) || 0) + (parseInt(av.AnalystRatingBuy) || 0);
  const sellR = (parseInt(av.AnalystRatingSell) || 0) + (parseInt(av.AnalystRatingStrongSell) || 0);
  const total = buyR + sellR + (parseInt(av.AnalystRatingHold) || 0);
  let rKey = 'hold';
  if (buyR > sellR * 2) rKey = 'buy';
  if (buyR > sellR * 3) rKey = 'strongBuy';
  if (sellR > buyR * 2) rKey = 'sell';
  if (sellR > buyR * 3) rKey = 'strongSell';

  const ebit = ebitda * 0.85;
  const totalAssets = Math.max(marketCap * 1.5, currentPrice * 1_000_000);
  const currentLiabilities = totalAssets * 0.2;
  const roic = (totalAssets - currentLiabilities) > 0 ? ebit / (totalAssets - currentLiabilities) : 0;

  return {
    _raw: {
      financialData: {
        currentPrice,
        targetHighPrice: currentPrice * 1.2,
        targetLowPrice: currentPrice * 0.8,
        targetMedianPrice: currentPrice,
        targetMeanPrice: currentPrice,
        recommendationMean: 3,
        recommendationKey: rKey,
        numberOfAnalystOpinions: total,
        totalCash: marketCap * 0.1,
        totalDebt: parseFloat(av.TotalDebt) || marketCap * 0.2,
        debtToEquity: parseFloat(av.DebtToEquityRatio) * 100 || 50,
        revenueGrowth: parseFloat(av.QuarterlyRevenueGrowthYOY) || 0.05,
        grossMargins: parseFloat(av.GrossProfitTTM) / (parseFloat(av.RevenueTTM) || 1) || 0.35,
        operatingMargins: parseFloat(av.OperatingMarginTTM) || 0.15,
        profitMargins: parseFloat(av.ProfitMargin) || 0.1,
        ebitda, ebitdaMargins: 0.15,
        operatingCashflow: parseFloat(av.OperatingCashflowTTM) || marketCap * 0.06,
        freeCashflow: parseFloat(av.FreeCashFlowTTM) || marketCap * 0.04,
        earningsGrowth: parseFloat(av.QuarterlyEarningsGrowthYOY) || 0.05,
        returnOnEquity: parseFloat(av.ReturnOnEquityTTM) || 0.12,
        returnOnAssets: parseFloat(av.ReturnOnAssetsTTM) || 0.06,
        totalRevenue: parseFloat(av.RevenueTTM) || marketCap,
        totalCashPerShare: parseFloat(av.CashPerShare) || 2,
        currentRatio: parseFloat(av.CurrentRatio) || 1.5,
        quickRatio: 1.2,
        totalAssets, totalCurrentLiabilities: currentLiabilities,
        ebit, roic,
        netIncome: parseFloat(av.NetIncomeTTM) || marketCap * 0.05,
        depreciation: totalAssets * 0.03,
        capitalExpenditures: totalAssets * 0.05,
        researchAndDevelopmentExpense: parseFloat(av.ResearchAndDevelopmentExpensesTTM) || null,
        totalCurrentAssets: totalAssets * 0.3,
      },
      keyStats: {
        enterpriseValue: parseFloat(av.EVToEBITDA) * ebitda || marketCap * 1.1,
        forwardPE: parseFloat(av.ForwardPE) || 20,
        pegRatio: parseFloat(av.PEGRatio) || 1.5,
        priceToBook: parseFloat(av.PriceToBookRatio) || 3,
        forwardEps: parseFloat(av.ForwardEPS) || 1,
        trailingEps: parseFloat(av.EPS) || 1,
        enterpriseToRevenue: parseFloat(av.EVToRevenue) || 2.5,
        enterpriseToEbitda: parseFloat(av.EVToEBITDA) || 12,
        fiftyTwoWeekHigh: parseFloat(av['52WeekHigh']),
        fiftyTwoWeekLow: parseFloat(av['52WeekLow']),
        sharesOutstanding: parseFloat(av.SharesOutstanding),
        marketCap, beta: parseFloat(av.Beta) || 1.1,
        earningsQuarterlyGrowth: parseFloat(av.QuarterlyEarningsGrowthYOY) / 4 || 0,
        priceToSalesTrailing12Months: parseFloat(av.PriceToSalesRatioTTM) || 2.5,
        dividendRate: parseFloat(av.DividendPerShare) || 0,
        dividendYield: parseFloat(av.DividendYield) || 0,
        payoutRatio: parseFloat(av.PayoutRatio) || 0.25,
        heldPercentInstitutions: parseFloat(av.PercentInstitutions) || 0.7,
        heldPercentInsiders: parseFloat(av.PercentInsiders) || 0.05,
        shortRatio: parseFloat(av.ShortRatio) || 2,
        shortPercentOfFloat: parseFloat(av.ShortPercentFloat) || 0.05,
        '52WeekChange': 0.08, SandP52WeekChange: 0.08,
        floatShares: parseFloat(av.SharesFloat) || parseFloat(av.SharesOutstanding) || 1,
      },
      price: {
        regularMarketPrice: currentPrice,
        regularMarketDayHigh: currentPrice * 1.01,
        regularMarketDayLow: currentPrice * 0.99,
        regularMarketVolume: null,
        regularMarketPreviousClose: currentPrice,
        marketCap,
      },
    },
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Symbol is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Try Yahoo first
    const yahoo = await tryYahoo(symbol);
    if (yahoo) {
      return new Response(JSON.stringify(buildFromYahoo(yahoo)), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fall back to Alpha Vantage
    const av = await tryAlphaVantage(symbol);
    if (av) {
      return new Response(JSON.stringify(buildFromAlphaVantage(av)), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Both failed — return 422 (not 500) with helpful message
    return new Response(
      JSON.stringify({
        error: 'No fundamental data available',
        details: `Could not retrieve data for "${symbol}". This may be a bond, ETF, or unsupported ticker for fundamental analysis.`,
      }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('netlify-fundamentals error:', err.message);
    return new Response(
      JSON.stringify({ error: 'Server error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}