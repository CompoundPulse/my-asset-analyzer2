// app/api/hourly/route.js
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
    const hourlyData = await yahooFinance.historical(symbol, {
      period1: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)), // Last 10 days
      period2: new Date(),
      interval: '1h'
    });

    // Format data for the chart
    const formattedData = hourlyData.map(candle => ({
      date: candle.date.toISOString(),
      value: candle.close
    }));

    return NextResponse.json({ prices: formattedData });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch hourly data',
      details: error.message
    }, { status: 500 });
  }
}