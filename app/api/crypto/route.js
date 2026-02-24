import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const timeRange = searchParams.get('timeRange') || '90';
  const type = searchParams.get('type') || 'ticker';

  try {
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const kucoinSymbol = `${symbol.toUpperCase()}-USDT`;

    if (type === 'ticker') {
      const [tickerRes, statsRes] = await Promise.all([
        fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kucoinSymbol}`),
        fetch(`https://api.kucoin.com/api/v1/market/stats?symbol=${kucoinSymbol}`)
      ]);

      const [tickerData, statsData] = await Promise.all([
        tickerRes.json(),
        statsRes.json()
      ]);

      if (!tickerData.data || !statsData.data) {
        throw new Error('Invalid response from KuCoin');
      }

      return NextResponse.json({
        price: tickerData.data.price,
        change: statsData.data.changePrice,
        changePercent: statsData.data.changeRate * 100,
        stats: statsData.data
      });
    } else {
      const endAt = Math.floor(Date.now() / 1000);
      const startAt = endAt - (parseInt(timeRange) * 24 * 60 * 60);
      
      const klineRes = await fetch(
        `https://api.kucoin.com/api/v1/market/candles?symbol=${kucoinSymbol}&type=1day&startAt=${startAt}&endAt=${endAt}`
      );

      const klineData = await klineRes.json();
      
      if (!klineData.data) {
        throw new Error('Invalid kline data from KuCoin');
      }

      return NextResponse.json(klineData);
    }
  } catch (error) {
    console.error('Crypto API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch crypto data',
      details: error.message,
      symbol: symbol,
      type: type
    }, { status: 500 });
  }
}