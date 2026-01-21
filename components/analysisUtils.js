// analysisUtils.js

const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `$${(value / 1e9).toFixed(2)}B`;
};

export const analyzeFinancials = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;
  
  const metrics = {
    profitability: [
      {
        metric: "Total Revenue",
        value: formatCurrency(fd.totalRevenue),
        analysis: `Annual revenue of ${formatCurrency(fd.totalRevenue)} with EBITDA of ${formatCurrency(fd.ebitda)}`,
        impact: fd.totalRevenue > 100e9 ? "Strong" : "Moderate"
      },
      {
        metric: "Gross Margins",
        value: formatPercent(fd.grossMargins),
        analysis: `Gross margins of ${formatPercent(fd.grossMargins)} with operating margins of ${formatPercent(fd.operatingMargins)}`,
        impact: fd.grossMargins > 0.40 ? "Strong" : "Moderate"
      },
      {
        metric: "EBITDA Margins",
        value: formatPercent(fd.ebitdaMargins),
        analysis: `EBITDA margins of ${formatPercent(fd.ebitdaMargins)} with net profit margins of ${formatPercent(fd.profitMargins)}`,
        impact: fd.ebitdaMargins > 0.30 ? "Strong" : "Moderate"
      }
    ],
    growth: [
      {
        metric: "Revenue Growth",
        value: formatPercent(fd.revenueGrowth),
        analysis: `Revenue growing at ${formatPercent(fd.revenueGrowth)} with earnings growth of ${formatPercent(fd.earningsGrowth)}`,
        impact: fd.revenueGrowth > 0.10 ? "Strong" : "Moderate"
      },
      {
        metric: "Earnings Growth",
        value: formatPercent(ks.earningsQuarterlyGrowth),
        analysis: `Quarterly earnings growth of ${formatPercent(ks.earningsQuarterlyGrowth)} showing strong momentum`,
        impact: ks.earningsQuarterlyGrowth > 0.05 ? "Strong" : "Moderate"
      },
      {
        metric: "Per Share Metrics",
        value: `EPS: $${ks.trailingEps}`,
        analysis: `Current EPS of $${ks.trailingEps} with forward EPS estimate of $${ks.forwardEps}`,
        impact: ks.forwardEps > ks.trailingEps ? "Strong" : "Moderate"
      }
    ],
    health: [
      {
        metric: "Cash Position",
        value: formatCurrency(fd.totalCash),
        analysis: `${formatCurrency(fd.totalCash)} cash with ${formatCurrency(fd.totalDebt)} debt. Per share cash: $${fd.totalCashPerShare}`,
        impact: fd.totalCash > fd.totalDebt ? "Strong" : "Moderate"
      },
      {
        metric: "Cash Flow",
        value: formatCurrency(fd.freeCashflow),
        analysis: `Generates ${formatCurrency(fd.freeCashflow)} in free cash flow from ${formatCurrency(fd.operatingCashflow)} operating cash flow`,
        impact: fd.freeCashflow > 0 ? "Strong" : "Caution"
      },
      {
        metric: "Debt to Equity",
        value: `${fd.debtToEquity}%`,
        analysis: `Debt to equity ratio of ${fd.debtToEquity}% with quick ratio of ${fd.quickRatio} and current ratio of ${fd.currentRatio}`,
        impact: fd.debtToEquity < 100 ? "Strong" : "Caution"
      }
    ],
    valuation: [
      {
        metric: "Forward P/E",
        value: ks.forwardPE.toFixed(2),
        analysis: `Trading at ${ks.forwardPE.toFixed(2)}x forward earnings vs trailing EPS of $${ks.trailingEps}`,
        impact: ks.forwardPE < 20 ? "Positive" : "Neutral"
      },
      {
        metric: "Enterprise Value",
        value: formatCurrency(ks.enterpriseValue),
        analysis: `Enterprise value of ${formatCurrency(ks.enterpriseValue)} with EV/EBITDA of ${ks.enterpriseToEbitda.toFixed(2)}x`,
        impact: ks.enterpriseToEbitda < 15 ? "Positive" : "Neutral"
      },
      {
        metric: "Market Performance",
        value: `${formatPercent(ks["52WeekChange"])} YTD`,
        analysis: `${formatPercent(ks["52WeekChange"])} return vs S&P500 ${formatPercent(ks.SandP52WeekChange)}. Beta: ${ks.beta}`,
        impact: ks["52WeekChange"] > ks.SandP52WeekChange ? "Strong" : "Moderate"
      }
    ]
  };

  return metrics;
};

export const analyzeBusiness = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;
  
  return {
    competitivePosition: [
      {
        metric: "Market Leadership",
        value: formatCurrency(fd.totalRevenue),
        analysis: `Revenue scale of ${formatCurrency(fd.totalRevenue)} indicates significant market presence`,
        impact: fd.totalRevenue > 100e9 ? "Strong" : "Moderate"
      },
      {
        metric: "Pricing Power",
        value: formatPercent(fd.grossMargins),
        analysis: `Gross margin of ${formatPercent(fd.grossMargins)} demonstrates ${
          fd.grossMargins > 0.5 ? "strong" : "moderate"} pricing power`,
        impact: fd.grossMargins > 0.5 ? "Strong" : "Moderate"
      }
    ],
    operationalEfficiency: [
      {
        metric: "Asset Utilization",
        value: formatPercent(fd.returnOnAssets),
        analysis: `Return on assets of ${formatPercent(fd.returnOnAssets)} shows operational efficiency`,
        impact: fd.returnOnAssets > 0.1 ? "Strong" : "Moderate"
      },
      {
        metric: "Operating Efficiency",
        value: formatPercent(fd.operatingMargins),
        analysis: `Operating margin of ${formatPercent(fd.operatingMargins)} indicates ${
          fd.operatingMargins > 0.25 ? "excellent" : "moderate"} cost control`,
        impact: fd.operatingMargins > 0.25 ? "Strong" : "Moderate"
      }
    ],
    managementEffectiveness: [
      {
        metric: "Capital Allocation",
        value: formatPercent(fd.returnOnEquity),
        analysis: `Return on equity of ${formatPercent(fd.returnOnEquity)} shows management effectiveness`,
        impact: fd.returnOnEquity > 0.15 ? "Strong" : "Moderate"
      },
      {
        metric: "Insider Confidence",
        value: formatPercent(ks.heldPercentInsiders),
        analysis: `Insider ownership at ${formatPercent(ks.heldPercentInsiders)} with institutional backing at ${formatPercent(ks.heldPercentInstitutions)}`,
        impact: ks.heldPercentInsiders > 0.05 ? "Strong" : "Moderate"
      }
    ]
  };
};

export const analyzeMarketSentiment = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;
  
  const sentiment = [];

  // Analyst Ratings
  sentiment.push({
    indicator: "Analyst Consensus",
    value: fd.recommendationKey.toUpperCase(),
    analysis: `${fd.numberOfAnalystOpinions} analysts average ${fd.recommendationKey} rating with mean score of ${fd.recommendationMean.toFixed(2)}`,
    signal: fd.recommendationKey === "buy" ? "Bullish" : 
           fd.recommendationKey === "sell" ? "Bearish" : "Neutral"
  });

  // Price Targets
  sentiment.push({
    indicator: "Price Targets",
    value: `$${fd.targetMedianPrice}`,
    analysis: `Median target of $${fd.targetMedianPrice} (range: $${fd.targetLowPrice}-$${fd.targetHighPrice})`,
    signal: fd.targetMedianPrice > fd.currentPrice ? "Bullish" : "Bearish"
  });

  // Institutional Ownership
  sentiment.push({
    indicator: "Ownership",
    value: `${(ks.heldPercentInstitutions * 100).toFixed(2)}% Inst.`,
    analysis: `Institutional ownership: ${(ks.heldPercentInstitutions * 100).toFixed(2)}%, Insider ownership: ${(ks.heldPercentInsiders * 100).toFixed(2)}%`,
    signal: ks.heldPercentInstitutions > 0.7 ? "Strong" : "Neutral"
  });

  return sentiment;
};

export const analyzeTechnicals = (historicalData, marketData) => {
  const technical = [];
  
  if (Array.isArray(historicalData?.recentSample) && historicalData.recentSample.length >= 3) {
    const recentPrices = historicalData.recentSample;
    const startPrice = recentPrices[0]?.value;
    const endPrice = recentPrices[recentPrices.length - 1]?.value;
    
    if (startPrice && endPrice) {
      const momentum = ((endPrice - startPrice) / startPrice * 100);
      
      technical.push({
        indicator: "Price Momentum",
        value: `${momentum.toFixed(2)}%`,
        analysis: `${momentum > 0 ? "Positive" : "Negative"} short-term momentum`,
        signal: momentum > 5 ? "Strong" : momentum > 0 ? "Positive" : "Negative"
      });
    }
  }

  return technical;
};