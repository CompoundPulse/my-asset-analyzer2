// bondCategories.js

export const bondCategories = {
    TREASURY: {
        name: 'Treasury Bonds',
        description: 'U.S. Government backed securities',
        symbols: {
          // Most commonly used Treasury series in FRED
          'GS30': '30-Year Treasury Rate',
          'GS20': '20-Year Treasury Rate',
          'GS10': '10-Year Treasury Rate',
          'GS7': '7-Year Treasury Rate',
          'GS5': '5-Year Treasury Rate',
          'GS3': '3-Year Treasury Rate',
          'GS2': '2-Year Treasury Rate',
          'GS1': '1-Year Treasury Rate',
          'GS6M': '6-Month Treasury Rate',
          'GS3M': '3-Month Treasury Rate',
          'TB3MS': '3-Month Treasury Bill Secondary Market Rate',
          'DTB3': '3-Month Treasury Bill',
          'DTB6': '6-Month Treasury Bill',
          // Treasury Spreads
          'T10Y2Y': '10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity',
          'T10Y3M': '10-Year Treasury Constant Maturity Minus 3-Month Treasury Bill',
        }
    },
    CORPORATE: {
      name: 'Corporate Bonds',
      description: 'Company-issued debt securities with varying credit ratings',
      symbols: {
        // Moody's Corporate Bond Yield Averages
        'AAA': 'Moody\'s Seasoned Aaa Corporate Bond Yield',
        'BAA': 'Moody\'s Seasoned Baa Corporate Bond Yield',
        // ICE BofA Corporate Bond Indices
        'BAMLC0A0CM': 'ICE BofA US Corporate Index',
        'BAMLH0A0HYM': 'ICE BofA US High Yield Index',
        // Corporate Bond Spreads
        'AAA10Y': 'Moody\'s Aaa Corporate Bond Minus 10-Year Treasury',
        'BAA10Y': 'Moody\'s Baa Corporate Bond Minus 10-Year Treasury'
      }
    },
    MUNICIPAL: {
      name: 'Municipal Bonds',
      description: 'State and local government debt instruments',
      symbols: {
        // Municipal Market Data (MMD) Indices
        'MUNI20Y': '20-Year Municipal Bond Yield',
        'MUNI10Y': '10-Year Municipal Bond Yield',
        'MUNI5Y': '5-Year Municipal Bond Yield',
        // Municipal Bond Spreads
        'MUNI10Y10Y': '10-Year Municipal Bond Minus 10-Year Treasury'
      }
    },
    INTERNATIONAL: {
      name: 'International Bonds',
      description: 'Foreign government and corporate debt securities',
      symbols: {
        // International Government Bonds
        'IRLTLT01': 'Ireland 10-Year Government Bond',
        'JPNLTLT01': 'Japan 10-Year Government Bond',
        'GBRLTLT01': 'United Kingdom 10-Year Government Bond',
        'DEULTLT01': 'Germany 10-Year Government Bond'
      }
    }
  };
  
  // Create a flat map of all bond symbols for easy lookup
  export const bondSymbols = Object.entries(bondCategories).reduce((acc, [_, data]) => {
    return { ...acc, ...data.symbols };
  }, {});
  
  // Category Metadata
  export const categoryMetadata = {
    TREASURY: {
      riskLevel: 'Lowest',
      liquidityLevel: 'Highest',
      typicalInvestors: ['Central Banks', 'Institutional Investors', 'Conservative Investors'],
      benchmarkUse: true,
      updateFrequency: 'Daily',
      dataSource: 'Federal Reserve',
      historicalDepth: 'Extensive',
      features: [
        'Direct government backing',
        'Most liquid bond market',
        'Benchmark for other rates',
        'Multiple maturity options'
      ],
      keyIndicators: [
        'Yield curve shape',
        'Spread between maturities',
        'Real yield (TIPS)',
        'Auction demand'
      ]
    },
    CORPORATE: {
      riskLevel: 'Moderate to High',
      liquidityLevel: 'Moderate',
      typicalInvestors: ['Institutional Investors', 'Fund Managers', 'High Net Worth Individuals'],
      benchmarkUse: false,
      updateFrequency: 'Daily',
      dataSource: 'Moody\'s, ICE BofA',
      historicalDepth: 'Good',
      features: [
        'Higher yields than Treasuries',
        'Credit risk exposure',
        'Industry diversification',
        'Various credit ratings'
      ],
      keyIndicators: [
        'Credit spreads',
        'Default rates',
        'Rating changes',
        'Sector performance'
      ]
    },
    MUNICIPAL: {
      riskLevel: 'Low to Moderate',
      liquidityLevel: 'Moderate',
      typicalInvestors: ['Individual Investors', 'Tax-Sensitive Investors'],
      taxAdvantaged: true,
      updateFrequency: 'Daily',
      dataSource: 'Municipal Market Data',
      historicalDepth: 'Moderate',
      features: [
        'Tax advantages',
        'Local government backing',
        'Project-specific funding',
        'Lower default rates'
      ],
      keyIndicators: [
        'Tax-equivalent yield',
        'State fiscal health',
        'Revenue sources',
        'Municipal/Treasury ratios'
      ]
    },
    INTERNATIONAL: {
      riskLevel: 'Moderate to High',
      liquidityLevel: 'Varies',
      typicalInvestors: ['Global Investors', 'Diversification-Focused Funds'],
      currencyExposure: true,
      updateFrequency: 'Daily',
      dataSource: 'Various International Sources',
      historicalDepth: 'Varies by Country',
      features: [
        'Currency diversification',
        'Global exposure',
        'Sovereign risk',
        'Different regulatory environments'
      ],
      keyIndicators: [
        'Currency exchange rates',
        'Country credit ratings',
        'Political stability',
        'International trade balances'
      ]
    }
  };
  
  // Bond Type Characteristics
  export const bondCharacteristics = {
    NOMINAL: {
      description: 'Standard fixed-rate government bonds',
      paymentStructure: 'Regular fixed payments',
      principalRepayment: 'At maturity',
      interestRateRisk: 'High',
      inflationRisk: 'Yes'
    },
    INFLATION_LINKED: {
      description: 'Bonds with principal and interest linked to inflation',
      paymentStructure: 'Inflation-adjusted payments',
      principalRepayment: 'Inflation-adjusted at maturity',
      interestRateRisk: 'Moderate',
      inflationRisk: 'Low'
    },
    ZERO_COUPON: {
      description: 'Bonds sold at discount with no periodic payments',
      paymentStructure: 'No periodic payments',
      principalRepayment: 'Full face value at maturity',
      interestRateRisk: 'Very High',
      inflationRisk: 'Yes'
    },
    FLOATING_RATE: {
      description: 'Bonds with variable interest rates',
      paymentStructure: 'Variable rate payments',
      principalRepayment: 'At maturity',
      interestRateRisk: 'Low',
      inflationRisk: 'Moderate'
    }
  };
  
  // Series Field Definitions
  export const seriesFields = {
    frequency: {
      D: 'Daily',
      W: 'Weekly',
      M: 'Monthly',
      Q: 'Quarterly',
      SA: 'Semiannual',
      A: 'Annual'
    },
    units: {
      PCT: 'Percent',
      USD: 'U.S. Dollars',
      IDX: 'Index'
    },
    seasonal_adjustment: {
      NSA: 'Not Seasonally Adjusted',
      SA: 'Seasonally Adjusted'
    }
  };
  
  // Export everything as a single object for convenience
  export const bondMetadata = {
    categories: bondCategories,
    symbols: bondSymbols,
    categoryMetadata,
    characteristics: bondCharacteristics,
    seriesFields
  };