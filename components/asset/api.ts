import { AssetData } from './types';

const ALPHA_VANTAGE_API_KEY = 'RUSYOJSP4I2T7BBT';

export const fetchStockData = async (symbol: string): Promise<Partial<AssetData>> => {
  const quoteResponse = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
  );
  const quoteData = await quoteResponse.json();

  const overviewResponse = await fetch(
    `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
  );
  const overviewData = await overviewResponse.json();

  if (!quoteData['Global Quote']) {
    throw new Error('No data found for this symbol');
  }

  return {
    price: parseFloat(quoteData['Global Quote']['05. price']).toFixed(2),
    change: quoteData['Global Quote']['09. change'],
    changePercent: quoteData['Global Quote']['10. change percent'],
    overview: {
      marketCap: overviewData.MarketCapitalization,
      pe: overviewData.PERatio,
      eps: overviewData.EPS,
      dividend: overviewData.DividendYield,
      beta: overviewData.Beta,
      high52: overviewData['52WeekHigh'],
      low52: overviewData['52WeekLow']
    }
  };
};

export const fetchHistoricalData = async (symbol: string) => {
  const response = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
  );
  const data = await response.json();
  
  if (!data['Time Series (Daily)']) {
    throw new Error('No historical data found');
  }

  return Object.entries(data['Time Series (Daily)'])
    .slice(0, 90)
    .map(([date, values]: [string, any]) => ({
      date,
      value: parseFloat(values['4. close'])
    }))
    .reverse();
};

export const fetchCryptoData = async (symbol: string): Promise<Partial<AssetData>> => {
  const commonCryptos: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'SOL': 'solana',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BNB': 'binancecoin',
    'XRP': 'ripple'
  };

  const coinId = commonCryptos[symbol.toUpperCase()];
  if (!coinId) {
    throw new Error('Cryptocurrency not found. Try BTC for Bitcoin or ETH for Ethereum');
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
  );
  const data = await response.json();

  if (!data[coinId]) {
    throw new Error('No data found for this cryptocurrency');
  }

  return {
    price: data[coinId].usd.toString(),
    change: data[coinId].usd_24h_change.toFixed(2),
    changePercent: data[coinId].usd_24h_change.toFixed(2),
    overview: {
      marketCap: data[coinId].usd_market_cap.toString(),
      volume: data[coinId].usd_24h_vol.toString()
    }
  };
};