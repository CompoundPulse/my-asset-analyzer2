import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, params } = body;

    // Build FRED API URL
    const baseUrl = 'https://api.stlouisfed.org/fred/series';
    const endpointUrl = endpoint ? `/${endpoint}` : '';
    const url = new URL(`${baseUrl}${endpointUrl}`);
    
    // Add all params to URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    // Make request to FRED
    const fredResponse = await fetch(url);
    const data = await fredResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('FRED API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch from FRED API' }, { status: 500 });
  }
}