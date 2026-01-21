// app/api/test/simple/route.js
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';

  try {
    console.log(`Testing simple quote for ${symbol}`);
    const quote = await yahooFinance.quote(symbol);
    
    return NextResponse.json({
      success: true,
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      name: quote.shortName || quote.longName
    });
  } catch (error) {
    console.error('Simple test error:', {
      message: error.message,
      name: error.name,
      code: error.code || 'N/A',
      symbol
    });
    
    return NextResponse.json({
      error: 'Failed to fetch simple quote',
      details: error.message,
      errorType: error.name
    }, { status: 500 });
  }
}