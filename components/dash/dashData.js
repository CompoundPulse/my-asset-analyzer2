// dashData.js — structural data only. Zero fake prices.
// Signal category labels (Top Gainers, New High etc) are display categories.
// Prices are real, fetched live via /api/batch-quotes.
// For real screener results, use the Screener page which sorts by actual live data.

export const SIG_L_TICKERS = [
  {t:'NVDA', s:'Top Gainers'},
  {t:'AMD',  s:'Top Gainers'},
  {t:'META', s:'Top Gainers'},
  {t:'GOOGL',s:'Top Gainers'},
  {t:'AMZN', s:'Top Gainers'},
  {t:'TSLA', s:'Top Gainers'},
  {t:'AAPL', s:'Top Gainers'},
  {t:'MSFT', s:'New High'},
  {t:'LLY',  s:'New High'},
  {t:'V',    s:'New High'},
  {t:'MA',   s:'New High'},
  {t:'COST', s:'Overbought'},
  {t:'HD',   s:'Overbought'},
  {t:'SPY',  s:'Unusual Volume'},
  {t:'QQQ',  s:'Unusual Volume'},
  {t:'SOXS', s:'Unusual Volume'},
  {t:'CSGP', s:'Upgrades'},
  {t:'JPM',  s:'Insider Buying'},
]

export const SIG_R_TICKERS = [
  {t:'NKE',  s:'Top Losers'},
  {t:'BA',   s:'Top Losers'},
  {t:'PFE',  s:'Top Losers'},
  {t:'T',    s:'Top Losers'},
  {t:'WBA',  s:'Top Losers'},
  {t:'VZ',   s:'Top Losers'},
  {t:'CVS',  s:'Top Losers'},
  {t:'INTC', s:'New Low'},
  {t:'DIS',  s:'New Low'},
  {t:'XOM',  s:'Oversold'},
  {t:'CVX',  s:'Oversold'},
  {t:'ARKK', s:'Most Volatile'},
  {t:'TQQQ', s:'Most Volatile'},
  {t:'IWM',  s:'Most Active'},
  {t:'GLD',  s:'Most Active'},
  {t:'TLT',  s:'Downgrades'},
  {t:'F',    s:'Insider Selling'},
]

// News fetched live from /api/market-news (Finnhub)
export const NEWS = [] // populated at runtime

// Pattern groupings are illustrative display categories — real pattern detection
// would require a technical analysis engine. Prices on these tickers are live.
export const PAT_L = [
  {tt:['NVDA','AAPL','MSFT','META'], s:'Trendline Supp.'},
  {tt:['AMD', 'GOOGL','AMZN','V'],   s:'Trendline Resist.'},
  {tt:['SPY', 'QQQ', 'IWM', 'DIA'], s:'Horizontal S/R'},
  {tt:['LLY', 'UNH', 'JNJ', 'ABT'], s:'Wedge Up'},
  {tt:['JPM', 'BAC', 'GS',  'MS'],  s:'Wedge'},
  {tt:['XOM', 'CVX', 'COP', 'SLB'], s:'Wedge Down'},
  {tt:['COST','HD',  'LOW', 'TGT'], s:'Triangle Asc.'},
  {tt:['GLD', 'SLV', 'TLT', 'AGG'], s:'Triangle Desc.'},
]
export const PAT_R = [
  {tt:['TSLA','RIVN','NIO', 'LCID'], s:'Channel Up'},
  {tt:['NFLX','DIS', 'WBD', 'PARA'], s:'Channel'},
  {tt:['INTC','QCOM','TXN', 'MU'],   s:'Channel Down'},
  {tt:['BA',  'RTX', 'LMT', 'GD'],   s:'Double Top'},
  {tt:['PFE', 'MRK', 'ABBV','BMY'],  s:'Multiple Top'},
  {tt:['AMGN','GILD','BIIB','REGN'],  s:'Double Bottom'},
  {tt:['T',   'VZ',  'TMUS','DISH'], s:'Multiple Bottom'},
  {tt:['ARKK','ARKG','ARKW','ARKF'], s:'Head & Shoulders'},
]
export const RECENT_Q = [
  {t:'NVDA',s:'Trendline'}, {t:'AMD', s:'Trendline'},
  {t:'META',s:'Resist.'},   {t:'GOOGL',s:'Resist.'},
  {t:'AMZN',s:'Trendline'}, {t:'MSFT',s:'Horiz. S/R'},
  {t:'TSLA',s:'Wedge Up'},  {t:'AAPL',s:'Wedge Up'},
  {t:'JPM', s:'Wedge'},     {t:'LLY', s:'Wedge Down'},
  {t:'SPY', s:'Chan. Up'},  {t:'QQQ', s:'Channel'},
]
// Earnings fetched live from /api/earnings-calendar
// Economic calendar fetched live from /api/econ-calendar
export const SCREENER_TICKERS = [
  {t:'NVDA', n:'NVIDIA Corp',         sec:'Technology'},
  {t:'AAPL', n:'Apple Inc',           sec:'Technology'},
  {t:'MSFT', n:'Microsoft Corp',      sec:'Technology'},
  {t:'AMZN', n:'Amazon.com Inc',      sec:'Consumer Cyc.'},
  {t:'GOOGL',n:'Alphabet Inc',        sec:'Communication'},
  {t:'META', n:'Meta Platforms',      sec:'Communication'},
  {t:'TSLA', n:'Tesla Inc',           sec:'Consumer Cyc.'},
  {t:'JPM',  n:'JPMorgan Chase',      sec:'Financials'},
  {t:'WMT',  n:'Walmart Inc',         sec:'Consumer Def.'},
  {t:'XOM',  n:'Exxon Mobil Corp',    sec:'Energy'},
  {t:'LLY',  n:'Eli Lilly and Co',    sec:'Healthcare'},
  {t:'COST', n:'Costco Wholesale',    sec:'Consumer Def.'},
  {t:'HD',   n:'Home Depot Inc',      sec:'Consumer Cyc.'},
  {t:'V',    n:'Visa Inc',            sec:'Financials'},
  {t:'MA',   n:'Mastercard Inc',      sec:'Financials'},
  {t:'AMD',  n:'Advanced Micro Dev.', sec:'Technology'},
  {t:'NFLX', n:'Netflix Inc',         sec:'Communication'},
  {t:'NKE',  n:'Nike Inc',            sec:'Consumer Cyc.'},
  {t:'SPY',  n:'S&P 500 ETF',         sec:'ETF'},
  {t:'QQQ',  n:'Nasdaq 100 ETF',      sec:'ETF'},
]
export const CRYPTO_SYMBOLS = ['BTC','ETH','SOL','XRP','BNB','AVAX','DOGE','ADA','DOT','POL']
export const CRYPTO_NAMES = {
  BTC:'Bitcoin',ETH:'Ethereum',SOL:'Solana',XRP:'Ripple',
  BNB:'BNB',AVAX:'Avalanche',DOGE:'Dogecoin',ADA:'Cardano',
  DOT:'Polkadot',POL:'Polygon (POL)'
}
export const SECTORS = [
  {name:'Technology',    etf:'XLK', stocks:['NVDA','AAPL','MSFT','GOOGL','META']},
  {name:'Healthcare',    etf:'XLV', stocks:['LLY','JNJ','UNH','ABBV','MRK']},
  {name:'Financials',    etf:'XLF', stocks:['JPM','BAC','WFC','GS','MS']},
  {name:'Consumer Cyc.', etf:'XLY', stocks:['AMZN','TSLA','HD','NKE','MCD']},
  {name:'Communication', etf:'XLC', stocks:['GOOGL','META','NFLX','DIS','T']},
  {name:'Industrials',   etf:'XLI', stocks:['GE','HON','CAT','BA','RTX']},
  {name:'Energy',        etf:'XLE', stocks:['XOM','CVX','COP','SLB','OXY']},
  {name:'Consumer Def.', etf:'XLP', stocks:['WMT','PG','KO','PEP','COST']},
  {name:'Real Estate',   etf:'XLRE',stocks:['PLD','AMT','EQIX','SPG','O']},
  {name:'Utilities',     etf:'XLU', stocks:['NEE','DUK','SO','AEP','XEL']},
  {name:'Materials',     etf:'XLB', stocks:['LIN','APD','ECL','SHW','FCX']},
]
// Insider trades fetched live from /api/insider-trades (Finnhub/SEC)
export const SEARCH_LIST = [
  ...SCREENER_TICKERS,
  ...CRYPTO_SYMBOLS.map(t=>({t,n:CRYPTO_NAMES[t],sec:'Crypto'})),
  {t:'GLD', n:'Gold ETF',          sec:'ETF'},
  {t:'TLT', n:'20Y Treasury ETF',  sec:'ETF'},
  {t:'IWM', n:'Russell 2000 ETF',  sec:'ETF'},
  {t:'DIA', n:'Dow Jones ETF',     sec:'ETF'},
  {t:'ARKK',n:'ARK Innovation ETF',sec:'ETF'},
  {t:'AMD', n:'Advanced Micro Dev.',sec:'Technology'},
  {t:'NFLX',n:'Netflix Inc',        sec:'Communication'},
  {t:'BA',  n:'Boeing Co',          sec:'Industrials'},
  {t:'NKE', n:'Nike Inc',           sec:'Consumer Cyc.'},
]

// Futures — structural labels only, prices fetched via /api/stocks (ETF proxies)
export const FUTURES = [
  {n:'Gold',          sym:'GLD',  p:null,c:null},
  {n:'Crude Oil',     sym:'USO',  p:null,c:null},
  {n:'Natural Gas',   sym:'UNG',  p:null,c:null},
  {n:'S&P 500',       sym:'SPY',  p:null,c:null},
  {n:'Nasdaq 100',    sym:'QQQ',  p:null,c:null},
  {n:'Dow Jones',     sym:'DIA',  p:null,c:null},
  {n:'Russell 2000',  sym:'IWM',  p:null,c:null},
  {n:'20Y T-Bond',    sym:'TLT',  p:null,c:null},
  {n:'VIX (est.)',    sym:'VIXY', p:null,c:null},
  {n:'Silver',        sym:'SLV',  p:null,c:null},
]

// Forex — structural labels
export const FOREX = [
  {n:'EUR/USD', sym:'FXE',  p:null,c:null},
  {n:'USD/JPY', sym:'FXY',  p:null,c:null},
  {n:'GBP/USD', sym:'FXB',  p:null,c:null},
  {n:'USD/CAD', sym:'FXC',  p:null,c:null},
  {n:'AUD/USD', sym:'FXA',  p:null,c:null},
  {n:'DXY',     sym:'UUP',  p:null,c:null},
]