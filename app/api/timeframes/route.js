// app/api/timeframes/route.js
import { NextResponse } from 'next/server';
import { fetchMultiTimeframeData } from '../../../components/stockUtils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const data = await fetchMultiTimeframeData(symbol);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching timeframes:', error);
    return NextResponse.json({
      error: 'Failed to fetch timeframe data',
      details: error.message
    }, { status: 500 });
  }
}