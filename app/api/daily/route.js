import { NextResponse } from 'next/server';
const yahooFinance = require('yahoo-finance2').default;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const dailyData = await yahooFinance.historical(symbol, {
      period1: '2023-01-01',
      period2: new Date(),
      interval: '1d'
    });

    // Format data for the chart
    const formattedData = dailyData.map(candle => ({
      date: candle.date.toISOString(),
      value: candle.close
    }));

    return NextResponse.json({ prices: formattedData });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch daily data',
      details: error.message
    }, { status: 500 });
  }
}