// app/api/fourhour/route.js
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
    // Get hourly data for last 40 days (to create 4h candles)
    const hourlyData = await yahooFinance.historical(symbol, {
      period1: new Date(Date.now() - (40 * 24 * 60 * 60 * 1000)),
      period2: new Date(),
      interval: '1h'
    });

    // Convert to 4h candles
    const fourHourData = hourlyData.reduce((acc, curr, i) => {
      if (i % 4 === 0) {
        acc.push({
          date: curr.date.toISOString(),
          value: curr.close
        });
      }
      return acc;
    }, []);

    return NextResponse.json({ prices: fourHourData });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch 4h data',
      details: error.message
    }, { status: 500 });
  }
}