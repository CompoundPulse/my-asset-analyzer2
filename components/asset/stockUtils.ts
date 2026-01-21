// stockUtils.ts

// Keep a small list initially to avoid rate limits
export const stockSymbols = [
    'AAPL',  // Apple
    'MSFT',  // Microsoft
    'GOOGL', // Google
    'META',  // Meta
    'TSLA'   // Tesla
  ] as const;
  
  export const fetchStockData = async (symbol: string) => {
    try {
      console.log('Fetching data for symbol:', symbol); // Debug log
  
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=RUSYOJSP4I2T7BBT`
      );
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
  
      // Check for API limit message
      if (data.Note) {
        throw new Error('API limit reached. Please wait a minute and try again.');
      }
  
      // Check if we have valid data
      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        
        // Log the quote data
        console.log('Quote data:', quote);
  
        return {
          symbol,
          price: parseFloat(quote['05. price']).toFixed(2),
          change: parseFloat(quote['09. change']).toFixed(2),
          changePercent: parseFloat(quote['10. change percent']).toFixed(2),
          overview: {
            previousClose: quote['08. previous close'],
            volume: quote['06. volume'],
            lastTradeDay: quote['07. latest trading day']
          }
        };
      }
  
      // If we get here, we have an empty or invalid response
      console.log('Invalid or empty response structure');
      throw new Error('No data found for this symbol. The market might be closed.');
  
    } catch (error: any) {
      console.error('Stock fetch error:', error);
      // Re-throw with more specific message if it's a network error
      if (error instanceof TypeError) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  };