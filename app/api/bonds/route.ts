import { NextResponse } from 'next/server';

const FRED_API_KEY = '1ce91b346e114eb59739b5e59c9107c1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, params } = body;
    
    // Debug log the incoming request
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Build FRED API URL
    const baseUrl = 'https://api.stlouisfed.org/fred';
    const endpointUrl = endpoint ? `/${endpoint}` : '/series';
    const url = new URL(baseUrl + endpointUrl);
    
    // Add required params
    url.searchParams.append('api_key', FRED_API_KEY);
    url.searchParams.append('file_type', 'json');
    
    // Add any additional params
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'api_key') {
        url.searchParams.append(key, String(value));
      }
    });

    const finalUrl = url.toString();
    console.log('FRED URL:', finalUrl);

    const response = await fetch(finalUrl);
    console.log('FRED Response Status:', response.status);

    const responseText = await response.text();
    console.log('FRED Response Text:', responseText.substring(0, 200));

    // Try to parse the response
    try {
      const data = JSON.parse(responseText);
      
      // Check for FRED API errors
      if (data.error_code) {
        console.error('FRED API Error:', data.error_message);
        return NextResponse.json(data, { status: 400 });
      }

      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Parse Error:', parseError);
      return NextResponse.json({
        error: 'Failed to parse FRED response',
        details: responseText.substring(0, 200)
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Server Error:', err);
    return NextResponse.json({ 
      error: 'Server Error',
      details: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}