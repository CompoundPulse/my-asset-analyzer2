const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function(event, context) {
  const symbol = event.queryStringParameters.symbol;
  
  if (!symbol) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Symbol is required' })
    };
  }
  
  try {
    const results = await yahooFinance.quoteSummary(symbol, {
      modules: ['assetProfile', 'financialData', 'defaultKeyStatistics', 'incomeStatementHistory']
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};