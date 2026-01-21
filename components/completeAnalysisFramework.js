const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `$${(value / 1e9).toFixed(2)}B`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
};
const safeRatio = (numerator, denominator, multiplier = 1) => {
  if (!numerator || !denominator || denominator === 0) return 0;
  return (numerator / denominator) * multiplier;
};

const ANALYSIS_THRESHOLDS = {
  VALUE: {
    PE_RATIO: 15,
    ROE: 0.15,
    OPERATING_MARGIN: 0.20
  },
  GROWTH: {
    REVENUE: 0.10,
    EARNINGS: 0.15
  },
  RISK: {
    DEBT_TO_EQUITY: 1.0,
    CURRENT_RATIO: 1.5,
    BETA: 1.2
  }
};

const getIndustryMetric = (fd, metric) => {
  const industry = detectIndustry(fd);
  const INDUSTRY_METRICS = {
    TECH: {
      avgGrossMargin: 0.65,
      avgOperatingMargin: 0.25,
      avgRevenueGrowth: 0.15,
      avgPERatio: 25
    },
    CONSUMER: {
      avgGrossMargin: 0.40,
      avgOperatingMargin: 0.15,
      avgRevenueGrowth: 0.08,
      avgPERatio: 20
    },
    HEALTHCARE: {
      avgGrossMargin: 0.55,
      avgOperatingMargin: 0.20,
      avgRevenueGrowth: 0.10,
      avgPERatio: 22
    },
    FINANCIAL: {
      avgGrossMargin: 0.35,
      avgOperatingMargin: 0.30,
      avgRevenueGrowth: 0.07,
      avgPERatio: 15
    }
  };
  return INDUSTRY_METRICS[industry]?.[metric] || null;
};
const getIndustryAvgRevenue = (fd) => {
  const industry = detectIndustry(fd);
  // Simplified industry revenue benchmarks
  const benchmarks = {
    TECH: 50e9,
    CONSUMER: 30e9,
    HEALTHCARE: 40e9,
    FINANCIAL: 35e9
  };
  return benchmarks[industry] || 35e9;
};

const detectIndustry = (fd) => {
  if (fd.grossMargins > 0.60) return 'TECH';
  if (fd.operatingMargins > 0.25) return 'FINANCIAL';
  if (fd.revenueGrowth > 0.12) return 'HEALTHCARE';
  return 'CONSUMER';
};

const determineMarketLeadershipImpact = (fd) => {
  const avgRevenue = getIndustryAvgRevenue(fd);
  if (fd.totalRevenue > avgRevenue * 2) return "Dominant";
  if (fd.totalRevenue > avgRevenue) return "Strong";
  return "Moderate";
};
// Original Business Analysis
export const analyzeBusiness = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  // Debug log
  console.log("Financial Data Values:");
  console.log("R&D:", fd.researchAndDevelopmentExpense, fd.researchAndDevelopment);
  console.log("Total Revenue:", fd.totalRevenue);
  console.log("Current Assets:", fd.totalCurrentAssets);

  return {
    competitivePosition: [
      {
        metric: "R&D Investment",
        value: formatPercent((fd.researchAndDevelopment || 0) / (fd.totalRevenue || 1)), // Changed to use researchAndDevelopment instead
        analysis: `R&D intensity of ${formatPercent((fd.researchAndDevelopment || 0) / (fd.totalRevenue || 1))} vs industry average of ${formatPercent(0.05)}. CURRENT SIGNAL: ${
          (fd.researchAndDevelopment || 0) / (fd.totalRevenue || 1) > 0.05
            ? "Above-average R&D investment indicates innovation focus" 
            : "R&D investment suggests maintenance innovation"
        }. IF MORE EXTREME: Higher investment could indicate either (1) technological leadership DUE TO product innovation, patent development, or platform advancement OR (2) commercialization risk DUE TO extended development cycles, technical complexity, or market adoption uncertainty.`,
        impact: (fd.researchAndDevelopment || 0) / (fd.totalRevenue || 1) > 0.05 ? "Strong" : "Moderate"
      },
      {
        metric: "Market Share Momentum",
        value: `${((fd.revenueGrowth - getIndustryMetric(fd, 'avgRevenueGrowth')) * 100).toFixed(1)}%`,
        analysis: `Growth premium of ${((fd.revenueGrowth - getIndustryMetric(fd, 'avgRevenueGrowth')) * 100).toFixed(1)}% vs peers. CURRENT SIGNAL: ${
          fd.revenueGrowth > getIndustryMetric(fd, 'avgRevenueGrowth')
            ? "Market share gains indicate competitive advantages" 
            : "Market share trajectory suggests competitive pressures"
        }. IF MORE EXTREME: Stronger share gains could indicate either (1) sustainable leadership DUE TO product superiority, distribution expansion, or customer acquisition efficiency OR (2) profitability risk DUE TO pricing aggression, marketing intensity, or customer acquisition costs.`,
        impact: fd.revenueGrowth > getIndustryMetric(fd, 'avgRevenueGrowth') ? "Strong" : "Moderate"
      },
      {
        metric: "Market Leadership",
        value: formatCurrency(fd.totalRevenue),
        analysis: `Revenue of ${formatCurrency(fd.totalRevenue)} vs industry average of ${formatCurrency(getIndustryAvgRevenue(fd))}. CURRENT SIGNAL: ${
          fd.totalRevenue > getIndustryAvgRevenue(fd) 
            ? "Above-average market presence indicates strong competitive position" 
            : "Market position suggests room for scale advantages"
        }. IF MORE EXTREME: Higher market share could indicate either (1) sustainable leadership DUE TO network effects, economies of scale, or market consolidation OR (2) increased regulatory scrutiny DUE TO market concentration, pricing power concerns, or competitive dominance.`,
        impact: determineMarketLeadershipImpact(fd)
      },
      {
        metric: "Pricing Power",
        value: formatPercent(fd.grossMargins),
        analysis: `Gross margin of ${formatPercent(fd.grossMargins)} vs industry average of ${formatPercent(getIndustryMetric(fd, 'avgGrossMargin'))}. CURRENT SIGNAL: ${
          fd.grossMargins > getIndustryMetric(fd, 'avgGrossMargin') 
            ? "Superior margins demonstrate strong pricing power" 
            : "Margins suggest competitive market pressures"
        }. IF MORE EXTREME: Higher margins could indicate either (1) durable competitive advantage DUE TO brand strength, product differentiation, or high switching costs OR (2) vulnerability to disruption DUE TO new entrants, substitute products, or changing customer preferences.`,
        impact: fd.grossMargins > getIndustryMetric(fd, 'avgGrossMargin') ? "Strong" : "Moderate"
      }
    ],
    operationalEfficiency: [
      {
        metric: "Working Capital Efficiency",
        value: formatNumber(((fd.totalCurrentAssets || 0) / (fd.totalRevenue || 1)) * 365),
        analysis: `Working capital cycle of ${formatNumber(((fd.totalCurrentAssets || 0) / (fd.totalRevenue || 1)) * 365)} days vs industry average of 75 days. CURRENT SIGNAL: ${
          ((fd.totalCurrentAssets || 0) / (fd.totalRevenue || 1)) * 365 < 75
            ? "Efficient working capital management indicates operational excellence" 
            : "Working capital efficiency suggests optimization opportunities"
        }. IF MORE EXTREME: Better efficiency could indicate either (1) operational superiority DUE TO inventory management, receivables collection, or supplier terms OR (2) business risk DUE TO inventory stockouts, customer terms, or supplier relationship strain.`,
        impact: ((fd.totalCurrentAssets || 0) / (fd.totalRevenue || 1)) * 365 < 75 ? "Strong" : "Moderate"
      },
      {
        metric: "Asset Utilization",
        value: formatPercent(fd.returnOnAssets),
        analysis: `ROA of ${formatPercent(fd.returnOnAssets)} vs industry average of 8%. CURRENT SIGNAL: ${
          fd.returnOnAssets > 0.08 
            ? "Efficient asset utilization indicates operational excellence" 
            : "Asset returns suggest optimization opportunities"
        }. IF MORE EXTREME: Higher ROA could indicate either (1) operational superiority DUE TO advanced technology, process automation, or supply chain optimization OR (2) underinvestment risk DUE TO aggressive asset utilization, deferred maintenance, or capacity constraints.`,
        impact: fd.returnOnAssets > 0.08 ? "Strong" : "Moderate"
      },
      {
        metric: "Operating Efficiency",
        value: formatPercent(fd.operatingMargins),
        analysis: `Operating margin of ${formatPercent(fd.operatingMargins)} vs industry average of ${formatPercent(getIndustryMetric(fd, 'avgOperatingMargin'))}. CURRENT SIGNAL: ${
          fd.operatingMargins > getIndustryMetric(fd, 'avgOperatingMargin') 
            ? "Superior cost control demonstrates operational excellence" 
            : "Cost structure indicates efficiency opportunities"
        }. IF MORE EXTREME: Higher margins could indicate either (1) sustainable cost advantages DUE TO scale benefits, vertical integration, or process innovation OR (2) quality/service risks DUE TO aggressive cost cutting, reduced investment, or labor constraints.`,
        impact: fd.operatingMargins > getIndustryMetric(fd, 'avgOperatingMargin') ? "Strong" : "Moderate"
      }
    ],
    managementEffectiveness: [
      {
        metric: "Strategic Execution",
        value: formatPercent(calculateStrategicEffectiveness(fd)),
        analysis: `Strategic effectiveness score of ${formatPercent(calculateStrategicEffectiveness(fd))} based on margin expansion and growth execution. CURRENT SIGNAL: ${
          calculateStrategicEffectiveness(fd) > 0.7
            ? "Strong strategic execution across key initiatives" 
            : "Strategic execution shows mixed results"
        }. IF MORE EXTREME: Better execution could indicate either (1) management excellence DUE TO strategic focus, operational discipline, or change management OR (2) sustainability risk DUE TO aggressive targets, resource constraints, or market headwinds.`,
        impact: calculateStrategicEffectiveness(fd) > 0.7 ? "Strong" : "Moderate"
      },
      {
        metric: "Investment Efficiency",
        value: formatPercent(fd.freeCashflow / fd.capitalExpenditures),
        analysis: `Investment return ratio of ${formatPercent(fd.freeCashflow / fd.capitalExpenditures)} vs industry average of 120%. CURRENT SIGNAL: ${
          fd.freeCashflow / fd.capitalExpenditures > 1.2
            ? "Superior returns on investment capital" 
            : "Investment returns suggest optimization needs"
        }. IF MORE EXTREME: Higher returns could indicate either (1) investment discipline DUE TO project selection, execution capability, or market opportunity OR (2) growth limitations DUE TO conservative investment, market saturation, or competitive intensity.`,
        impact: fd.freeCashflow / fd.capitalExpenditures > 1.2 ? "Strong" : "Moderate"
      },
      {
        metric: "Capital Allocation",
        value: formatPercent(fd.returnOnEquity),
        analysis: `ROE of ${formatPercent(fd.returnOnEquity)} vs industry average of 15%. CURRENT SIGNAL: ${
          fd.returnOnEquity > 0.15 
            ? "Superior returns indicate effective capital deployment" 
            : "Returns suggest capital allocation opportunities"
        }. IF MORE EXTREME: Higher ROE could indicate either (1) excellent management execution DUE TO strategic acquisitions, organic growth initiatives, or working capital optimization OR (2) financial risk DUE TO excessive leverage, aggressive accounting, or unsustainable distribution policy.`,
        impact: fd.returnOnEquity > 0.15 ? "Strong" : "Moderate"
      },
      {
        metric: "Insider Confidence",
        value: formatPercent(ks.heldPercentInsiders),
        analysis: `Insider ownership at ${formatPercent(ks.heldPercentInsiders)} with institutional ownership at ${formatPercent(ks.heldPercentInstitutions)} vs industry averages of 10% and 65%. CURRENT SIGNAL: ${
          ks.heldPercentInsiders > 0.1 
            ? "Strong insider alignment with shareholders" 
            : "Typical management ownership structure"
        }. IF MORE EXTREME: Higher insider ownership could indicate either (1) strong governance alignment DUE TO founder involvement, management confidence, or incentive structure OR (2) control risks DUE TO voting power concentration, reduced market float, or limited board independence.`,
        impact: ks.heldPercentInsiders > 0.1 ? "Strong" : "Moderate"
      }
    ]
  };
};

const calculateStrategicEffectiveness = (fd) => {
  let score = 0;
  if (fd.operatingMargins > fd.operatingMargins_lastYear) score += 0.3;
  if (fd.revenueGrowth > getIndustryMetric(fd, 'avgRevenueGrowth')) score += 0.4;
  if (fd.freeCashflow > fd.freeCashflow_lastYear) score += 0.3;
  return score;
};

// Original Financial Analysis
export const analyzeFinancials = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    profitability: [
      {
        metric: "Total Revenue",
        value: formatCurrency(fd.totalRevenue),
        analysis: `Annual revenue of ${formatCurrency(fd.totalRevenue)} with EBITDA of ${formatCurrency(fd.ebitda)} vs industry average revenue of ${formatCurrency(getIndustryAvgRevenue(fd))}. CURRENT SIGNAL: ${
          fd.totalRevenue > getIndustryAvgRevenue(fd)
            ? "Above-average revenue base indicates market leadership"
            : "Revenue scale suggests growth potential"
        }. IF MORE EXTREME: Higher revenue could indicate either (1) market dominance DUE TO successful market penetration, product adoption, or pricing power OR (2) margin pressure DUE TO aggressive discounting, market saturation, or competitive intensity.`,
        impact: fd.totalRevenue > getIndustryAvgRevenue(fd) ? "Strong" : "Moderate"
      },
      {
        metric: "Gross Margins",
        value: formatPercent(fd.grossMargins),
        analysis: `Gross margins of ${formatPercent(fd.grossMargins)} with operating margins of ${formatPercent(fd.operatingMargins)} vs industry average of ${formatPercent(getIndustryMetric(fd, 'avgGrossMargin'))}. CURRENT SIGNAL: ${
          fd.grossMargins > getIndustryMetric(fd, 'avgGrossMargin')
            ? "Superior product margins indicate pricing power"
            : "Margins reflect competitive market dynamics"
        }. IF MORE EXTREME: Higher margins could indicate either (1) stronger market position DUE TO brand premium, product differentiation, or cost advantages OR (2) competitive vulnerability DUE TO new entrants, substitute products, or cost inflation.`,
        impact: fd.grossMargins > getIndustryMetric(fd, 'avgGrossMargin') ? "Strong" : "Moderate"
      },
      {
        metric: "EBITDA Margins",
        value: formatPercent(fd.ebitdaMargins),
        analysis: `EBITDA margins of ${formatPercent(fd.ebitdaMargins)} with net margins of ${formatPercent(fd.profitMargins)} vs industry averages of ${formatPercent(getIndustryMetric(fd, 'avgOperatingMargin'))} and ${formatPercent(getIndustryMetric(fd, 'avgOperatingMargin') * 0.7)}. CURRENT SIGNAL: ${
          fd.ebitdaMargins > getIndustryMetric(fd, 'avgOperatingMargin')
            ? "Strong operational profitability"
            : "Operational efficiency opportunities exist"
        }. IF MORE EXTREME: Higher margins could indicate either (1) operational excellence DUE TO scale economies, process efficiency, or cost management OR (2) underinvestment risk DUE TO cost cutting, deferred maintenance, or reduced R&D.`,
        impact: fd.ebitdaMargins > getIndustryMetric(fd, 'avgOperatingMargin') ? "Strong" : "Moderate"
      }
    ],
    growth: [
      {
        metric: "Revenue Growth",
        value: formatPercent(fd.revenueGrowth),
        analysis: `Revenue growing at ${formatPercent(fd.revenueGrowth)} with earnings growth of ${formatPercent(fd.earningsGrowth)} vs industry average of ${formatPercent(getIndustryMetric(fd, 'avgRevenueGrowth'))}. CURRENT SIGNAL: ${
          fd.revenueGrowth > getIndustryMetric(fd, 'avgRevenueGrowth')
            ? "Above-market growth indicates market share gains"
            : "Growth rate suggests market-level expansion"
        }. IF MORE EXTREME: Faster growth could indicate either (1) sustainable momentum DUE TO product innovation, market expansion, or competitive wins OR (2) quality concerns DUE TO aggressive pricing, channel stuffing, or unsustainable promotions.`,
        impact: fd.revenueGrowth > getIndustryMetric(fd, 'avgRevenueGrowth') ? "Strong" : "Moderate"
      },
      {
        metric: "Earnings Growth",
        value: formatPercent(ks.earningsQuarterlyGrowth),
        analysis: `Quarterly earnings growth of ${formatPercent(ks.earningsQuarterlyGrowth)} showing momentum vs industry average of 10%. CURRENT SIGNAL: ${
          ks.earningsQuarterlyGrowth > 0.10
            ? "Strong earnings momentum indicates execution quality"
            : "Earnings growth suggests operational challenges"
        }. IF MORE EXTREME: Higher growth could indicate either (1) improving business model DUE TO operating leverage, mix shift, or cost optimization OR (2) earnings quality risk DUE TO non-recurring items, accounting changes, or unsustainable cost cuts.`,
        impact: ks.earningsQuarterlyGrowth > 0.10 ? "Strong" : "Moderate"
      },
      {
        metric: "Per Share Metrics",
        value: `EPS: $${ks.trailingEps}`,
        analysis: `Current EPS of $${ks.trailingEps} with forward EPS estimate of $${ks.forwardEps} vs industry average forward growth of 15%. CURRENT SIGNAL: ${
          ks.forwardEps > ks.trailingEps
            ? "Improving earnings outlook from current base"
            : "Earnings estimates suggest potential headwinds"
        }. IF MORE EXTREME: Higher estimates could indicate either (1) business momentum DUE TO margin expansion, revenue acceleration, or cost benefits OR (2) forecast risk DUE TO aggressive assumptions, market cyclicality, or competitive pressures.`,
        impact: ks.forwardEps > ks.trailingEps ? "Strong" : "Moderate"
      }
    ],
    health: [
      {
        metric: "Cash Position",
        value: formatCurrency(fd.totalCash),
        analysis: `${formatCurrency(fd.totalCash)} cash with ${formatCurrency(fd.totalDebt)} debt and per share cash of $${fd.totalCashPerShare} vs industry average cash/debt ratio of 0.5. CURRENT SIGNAL: ${
          fd.totalCash > fd.totalDebt * 0.5
            ? "Strong liquidity position relative to obligations"
            : "Balanced cash position against debt load"
        }. IF MORE EXTREME: Higher cash could indicate either (1) financial flexibility DUE TO strong cash generation, conservative management, or recent financing OR (2) capital allocation concerns DUE TO limited reinvestment, M&A discipline, or trapped cash.`,
        impact: fd.totalCash > fd.totalDebt * 0.5 ? "Strong" : "Moderate"
      },
      {
        metric: "Cash Flow",
        value: formatCurrency(fd.freeCashflow),
        analysis: `Generates ${formatCurrency(fd.freeCashflow)} FCF from ${formatCurrency(fd.operatingCashflow)} operating cash flow vs industry average conversion ratio of 60%. CURRENT SIGNAL: ${
          fd.freeCashflow > fd.operatingCashflow * 0.6
            ? "Strong cash conversion from operations"
            : "Cash flow indicates reinvestment needs"
        }. IF MORE EXTREME: Higher FCF could indicate either (1) business quality DUE TO working capital efficiency, capex discipline, or margin expansion OR (2) sustainability concerns DUE TO underinvestment, deferred maintenance, or short-term optimization.`,
        impact: fd.freeCashflow > 0 ? "Strong" : "Caution"
      },
      {
        metric: "Debt to Equity",
        value: `${fd.debtToEquity}%`,
        analysis: `Debt/Equity ratio of ${fd.debtToEquity}% with quick ratio of ${fd.quickRatio} and current ratio of ${fd.currentRatio} vs industry averages of 100%, 1.0, and 1.5. CURRENT SIGNAL: ${
          fd.debtToEquity < 100
            ? "Conservative leverage profile"
            : "Elevated leverage requires monitoring"
        }. IF MORE EXTREME: Higher leverage could indicate either (1) optimized capital structure DUE TO low cost debt, tax efficiency, or growth investment OR (2) financial risk DUE TO debt service burden, covenant constraints, or refinancing risk.`,
        impact: fd.debtToEquity < 100 ? "Strong" : "Caution"
      }
    ],
    valuation: [
      {
        metric: "Forward P/E",
        value: ks.forwardPE.toFixed(2),
        analysis: `Trading at ${ks.forwardPE.toFixed(2)}x forward earnings vs trailing EPS of $${ks.trailingEps} and industry average P/E of ${getIndustryMetric(fd, 'avgPERatio')}x. CURRENT SIGNAL: ${
          ks.forwardPE > getIndustryMetric(fd, 'avgPERatio')
            ? "Premium valuation indicates growth expectations"
            : "Valuation suggests market skepticism"
        }. IF MORE EXTREME: Higher multiple could indicate either (1) quality premium DUE TO growth visibility, margin expansion, or competitive moat OR (2) valuation risk DUE TO aggressive expectations, peak margins, or competitive threats.`,
        impact: ks.forwardPE < getIndustryMetric(fd, 'avgPERatio') ? "Positive" : "Neutral"
      },
      {
        metric: "Enterprise Value",
        value: formatCurrency(ks.enterpriseValue),
        analysis: `Enterprise value of ${formatCurrency(ks.enterpriseValue)} with EV/EBITDA of ${ks.enterpriseToEbitda.toFixed(2)}x vs industry average of 15x. CURRENT SIGNAL: ${
          ks.enterpriseToEbitda < 15
            ? "Attractive valuation relative to cash flows"
            : "Premium valuation requires growth execution"
        }. IF MORE EXTREME: Higher multiple could indicate either (1) strategic value DUE TO market position, asset quality, or growth platform OR (2) downside risk DUE TO cyclical peak, competitive pressure, or multiple compression.`,
        impact: ks.enterpriseToEbitda < 15 ? "Positive" : "Neutral"
      },
      {
        metric: "Market Performance",
        value: `${formatPercent(ks["52WeekChange"])} YTD`,
        analysis: `${formatPercent(ks["52WeekChange"])} return vs S&P500 ${formatPercent(ks.SandP52WeekChange)} with Beta ${ks.beta}. CURRENT SIGNAL: ${
          ks["52WeekChange"] > ks.SandP52WeekChange
            ? "Outperformance indicates positive sentiment"
            : "Underperformance suggests market concerns"
        }. IF MORE EXTREME: Stronger outperformance could indicate either (1) business momentum DUE TO earnings beats, guidance raises, or positive catalysts OR (2) mean reversion risk DUE TO elevated expectations, technical factors, or sector rotation.`,
        impact: ks["52WeekChange"] > ks.SandP52WeekChange ? "Strong" : "Moderate"
      }
    ]
  };
};

// Original Market Sentiment Analysis
export const analyzeMarketSentiment = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  // Calculate sentiment scores with detailed breakdowns
  const sentimentScore = (() => {
    let score = 0;
    const breakdown = [];
    
    // Analyst View (0-3 points)
    const recommendationScore = fd.recommendationMean || 3;
    if (recommendationScore < 2) {
      score += 3;
      breakdown.push(`Strong Buy consensus <2.0: +3 (current: ${recommendationScore.toFixed(2)})`);
    } else if (recommendationScore < 2.5) {
      score += 2;
      breakdown.push(`Buy consensus <2.5: +2 (current: ${recommendationScore.toFixed(2)})`);
    } else if (recommendationScore < 3) {
      score += 1;
      breakdown.push(`Hold/Buy consensus <3.0: +1 (current: ${recommendationScore.toFixed(2)})`);
    }
    
    // Price Target Premium (0-3 points)
    const targetPremium = ((fd.targetMedianPrice - fd.currentPrice) / fd.currentPrice) || 0;
    if (targetPremium > 0.20) {
      score += 3;
      breakdown.push(`Strong upside >20%: +3 (current: ${formatPercent(targetPremium)})`);
    } else if (targetPremium > 0.10) {
      score += 2;
      breakdown.push(`Moderate upside >10%: +2 (current: ${formatPercent(targetPremium)})`);
    } else if (targetPremium > 0) {
      score += 1;
      breakdown.push(`Slight upside >0%: +1 (current: ${formatPercent(targetPremium)})`);
    }
    
    // Institutional Support (0-4 points)
    if (ks.heldPercentInstitutions > 0.8) {
      score += 4;
      breakdown.push(`Very strong institutional backing >80%: +4 (current: ${formatPercent(ks.heldPercentInstitutions)})`);
    } else if (ks.heldPercentInstitutions > 0.6) {
      score += 2;
      breakdown.push(`Strong institutional backing >60%: +2 (current: ${formatPercent(ks.heldPercentInstitutions)})`);
    }
    
    return {
      score,
      maxScore: 10,
      breakdown,
      detail: `Sentiment score ${score}/10 calculated from: ${breakdown.join("; ")}`
    };
  })();

  // Return array format expected by sections.js
  return [
    {
      indicator: "Analyst Consensus",
      value: (fd.recommendationKey || 'N/A').toUpperCase(),
      analysis: `${fd.numberOfAnalystOpinions} analysts provide ratings with mean score ${
        fd.recommendationMean.toFixed(2)
      } vs. sector avg 2.5. Rating distribution: ${
        formatPercent(fd.recommendationBuy || 0.3)
      } Buy, ${formatPercent(fd.recommendationHold || 0.5)} Hold. CURRENT SIGNAL: ${
        fd.recommendationMean < 2.5 ? "Constructive" : "Neutral"
      } analyst sentiment. IF MORE EXTREME: More bullish consensus could reflect either (1) improving confidence DUE TO competitive positioning, margin trajectory, or growth acceleration OR (2) potential crowding risk DUE TO consensus positioning, elevated expectations, or sector rotation risk.`,
      signal: fd.recommendationMean < 2 ? "Strong Buy" : fd.recommendationMean < 2.5 ? "Buy" : "Hold"
    },
    {
      indicator: "Price Targets",
      value: `$${fd.targetMedianPrice}`,
      analysis: `Median PT $${fd.targetMedianPrice} implies ${
        formatPercent((fd.targetMedianPrice - fd.currentPrice) / fd.currentPrice)
      } upside vs sector avg 12%. Target range $${fd.targetLowPrice.toFixed(2)}-${fd.targetHighPrice.toFixed(2)} shows ${
        formatPercent((fd.targetHighPrice - fd.targetLowPrice) / fd.targetMedianPrice)
      } dispersion. CURRENT SIGNAL: ${
        fd.targetMedianPrice > fd.currentPrice * 1.1 ? "Positive" : "Neutral"
      } price sentiment. IF MORE EXTREME: Higher targets could indicate either (1) increasing conviction DUE TO business momentum, competitive advantages, or strategic optionality OR (2) potential valuation risk DUE TO multiple expansion, earnings expectations, or macro sensitivity.`,
      signal: fd.targetMedianPrice > fd.currentPrice * 1.2 ? "Strong Upside" : fd.targetMedianPrice > fd.currentPrice ? "Moderate Upside" : "Limited Upside"
    },
    {
      indicator: "Ownership Profile",
      value: `${formatPercent(ks.heldPercentInstitutions)} Inst.`,
      analysis: `Institutional ownership ${formatPercent(ks.heldPercentInstitutions)} vs. peer avg 65%. Insider ownership ${
        formatPercent(ks.heldPercentInsiders)
      } with recent ${ks.netInsiderBuying > 0 ? "buying" : "selling"} activity. CURRENT SIGNAL: ${
        ks.heldPercentInstitutions > 0.7 ? "Strong" : "Moderate"
      } institutional backing. IF MORE EXTREME: Higher ownership could signal either (1) quality validation DUE TO business durability, capital allocation, or management execution OR (2) potential liquidity risk DUE TO ownership concentration, style factor exposure, or index inclusion effects.`,
      signal: ks.heldPercentInstitutions > 0.8 ? "Very Strong" : ks.heldPercentInstitutions > 0.6 ? "Strong" : "Moderate"
    },
    {
      indicator: "Sentiment Score",
      value: `${sentimentScore.score}/10`,
      analysis: `${sentimentScore.detail}. Analyst consensus ${(fd.recommendationKey || 'N/A').toUpperCase()} with ${
        formatPercent((fd.targetMedianPrice - fd.currentPrice) / fd.currentPrice)
      } target upside and ${formatPercent(ks.heldPercentInstitutions)} institutional ownership indicates ${
        sentimentScore.score > 7 ? "strong positive" : sentimentScore.score > 5 ? "moderately positive" : "neutral"
      } overall sentiment.`,
      signal: "Overview"
    }
  ];
};

// Original Technical Analysis
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

// New Investment Style Analysis
export const analyzeInvestmentStyle = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    valueMetrics: [
      {
        metric: "Buffett Value Criteria",
        value: `P/E: ${ks.forwardPE.toFixed(2)}`,
        analysis: `Forward P/E of ${ks.forwardPE.toFixed(2)}x with ROE of ${formatPercent(fd.returnOnEquity)}. ${
          ks.forwardPE < 15 && fd.returnOnEquity > 0.15
            ? "Meets Buffett's value criteria"
            : "Above traditional value thresholds"
        }`,
        impact: (ks.forwardPE < 15 && fd.returnOnEquity > 0.15) ? "Value" : "Growth"
      },
      {
        metric: "Moat Indicator",
        value: formatPercent(fd.grossMargins),
        analysis: `Gross margins of ${formatPercent(fd.grossMargins)} and operating margins of ${formatPercent(fd.operatingMargins)} indicate ${
          fd.grossMargins > 0.4 ? "potential competitive advantage" : "competitive market positioning"
        }`,
        impact: fd.grossMargins > 0.4 ? "Strong" : "Moderate"
      }
    ],
    qualityMetrics: [
      {
        metric: "Business Quality",
        value: formatPercent(fd.returnOnEquity),
        analysis: `Return on Equity of ${formatPercent(fd.returnOnEquity)} with ${formatPercent(fd.operatingMargins)} operating margins suggests ${
          fd.returnOnEquity > 0.15 ? "high quality business model" : "moderate business performance"
        }`,
        impact: fd.returnOnEquity > 0.15 ? "High Quality" : "Moderate"
      },
      {
        metric: "Capital Allocation",
        value: formatCurrency(fd.freeCashflow),
        analysis: `Generates ${formatCurrency(fd.freeCashflow)} FCF with ${formatPercent(ks.payoutRatio)} payout ratio. ${
          fd.freeCashflow > 0 && ks.payoutRatio < 0.75
            ? "Efficient capital allocation"
            : "Monitor capital usage"
        }`,
        impact: (fd.freeCashflow > 0 && ks.payoutRatio < 0.75) ? "Strong" : "Caution"
      }
    ],
    marketStyle: [
      {
        metric: "Investment Style",
        value: determineInvestmentStyle(ks, fd),
        analysis: `${calculateStyleAnalysis(ks, fd)}`,
        impact: "Information"
      },
      {
        metric: "Market Positioning",
        value: `Beta: ${ks.beta.toFixed(2)}`,
        analysis: `Beta of ${ks.beta.toFixed(2)} with institutional ownership at ${formatPercent(ks.heldPercentInstitutions)}. ${
          analyzeMarketPosition(ks, fd)
        }`,
        impact: determineMarketImpact(ks)
      }
    ]
  };
};

// New Macro Analysis
export const analyzeMacro = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    marketEnvironment: [
      {
        metric: "Market Sensitivity",
        value: ks.beta.toFixed(2),
        analysis: `Beta of ${ks.beta.toFixed(2)} indicates ${
          ks.beta > ANALYSIS_THRESHOLDS.RISK.BETA ? "high" : ks.beta < 0.8 ? "low" : "moderate"
        } sensitivity to market movements`,
        impact: ks.beta < ANALYSIS_THRESHOLDS.RISK.BETA ? "Defensive" : "Cyclical"
      },
      {
        metric: "Market Performance",
        value: `${formatPercent(ks["52WeekChange"])}`,
        analysis: `${formatPercent(ks["52WeekChange"])} return vs S&P500 ${formatPercent(ks.SandP52WeekChange)} shows ${
          ks["52WeekChange"] > ks.SandP52WeekChange ? "outperformance" : "underperformance"
        }`,
        impact: ks["52WeekChange"] > ks.SandP52WeekChange ? "Strong" : "Weak"
      }
    ],
    valuationCycle: [
      {
        metric: "Valuation Level",
        value: `${ks.forwardPE.toFixed(2)}x`,
        analysis: `Forward P/E of ${ks.forwardPE.toFixed(2)}x relative to earnings growth of ${formatPercent(ks.earningsQuarterlyGrowth)} indicates ${
          ks.forwardPE < ks.earningsQuarterlyGrowth * 100 ? "undervalued" : "fully valued"
        } status`,
        impact: ks.forwardPE < 20 ? "Attractive" : "Premium"
      }
    ]
  };
};

// 3. Advanced Trading Analysis
export const analyzeTrading = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    technicalSignals: [
      {
        metric: "Price Momentum",
        value: formatPercent(ks["52WeekChange"]),
        analysis: `52-week performance shows ${ks["52WeekChange"] > 0 ? "positive" : "negative"} momentum`,
        impact: ks["52WeekChange"] > 0 ? "Bullish" : "Bearish"
      }
    ],
    optionsMetrics: [
      {
        metric: "Volatility Profile",
        value: ks.beta.toFixed(2),
        analysis: `Beta of ${ks.beta.toFixed(2)} suggests ${
          ks.beta > 1.5 ? "high" : ks.beta < 0.8 ? "low" : "moderate"
        } options premium levels`,
        impact: ks.beta > 1.2 ? "High Premium" : "Low Premium"
      }
    ],
    volumeAnalysis: [
      {
        metric: "Volume Trend",
        value: formatNumber(ks.floatShares),
        analysis: `Float of ${formatNumber(ks.floatShares)} shares with ${formatPercent(ks.shortPercentOfFloat)} short interest`,
        impact: ks.shortPercentOfFloat > 0.15 ? "High Short Interest" : "Normal"
      }
    ]
  };
};

// 4. Risk Management
export const analyzeRisk = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    marketRisk: [
      {
        metric: "Volatility Risk",
        value: ks.beta.toFixed(2),
        analysis: `Beta of ${ks.beta.toFixed(2)} indicates ${
          ks.beta > ANALYSIS_THRESHOLDS.RISK.BETA ? "above-market" : "below-market"
        } volatility`,
        impact: ks.beta > ANALYSIS_THRESHOLDS.RISK.BETA ? "High Risk" : "Moderate Risk"
      }
    ],
    financialRisk: [
      {
        metric: "Leverage Risk",
        value: `${fd.debtToEquity}%`,
        analysis: `Debt/Equity ratio of ${fd.debtToEquity}% shows ${
          fd.debtToEquity > ANALYSIS_THRESHOLDS.RISK.DEBT_TO_EQUITY * 100 ? "high" : "moderate"
        } financial leverage`,
        impact: fd.debtToEquity > ANALYSIS_THRESHOLDS.RISK.DEBT_TO_EQUITY * 100 ? "High Risk" : "Moderate Risk"
      },
      {
        metric: "Liquidity Risk",
        value: fd.currentRatio?.toFixed(2),
        analysis: `Current ratio of ${fd.currentRatio?.toFixed(2)} indicates ${
          fd.currentRatio > ANALYSIS_THRESHOLDS.RISK.CURRENT_RATIO ? "strong" : fd.currentRatio > 1 ? "adequate" : "weak"
        } liquidity`,
        impact: fd.currentRatio > ANALYSIS_THRESHOLDS.RISK.CURRENT_RATIO ? "Low Risk" : "High Risk"
      }
    ],
    businessRisk: [
      {
        metric: "Operating Risk",
        value: formatPercent(fd.operatingMargins),
        analysis: `Operating margin of ${formatPercent(fd.operatingMargins)} shows ${
          fd.operatingMargins > ANALYSIS_THRESHOLDS.VALUE.OPERATING_MARGIN ? "strong" : "moderate"
        } business stability`,
        impact: fd.operatingMargins > ANALYSIS_THRESHOLDS.VALUE.OPERATING_MARGIN ? "Low Risk" : "High Risk"
      }
    ]
  };
};

// 5. Monitoring Framework
export const analyzeMonitoring = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    priceTriggers: [
      {
        metric: "Analyst Price Triggers",
        value: `$${fd.targetMedianPrice}`,
        analysis: `Median target ${fd.targetMedianPrice} (range: ${fd.targetLowPrice}-${fd.targetHighPrice}) vs current ${
          fd.currentPrice
        }. Analyst coverage: ${fd.numberOfAnalystOpinions || 'Limited'} firms (peer avg: 15 analysts). MONITOR CHANGES IN: ${
          !fd.numberOfAnalystOpinions ? "Initial coverage initiation" : fd.numberOfAnalystOpinions < 10 ? "Coverage expansion and new initiations" : "Target revisions and rating changes"
        }. IF TRIGGERS HIT: Upside targets could be revised on (1) multiple expansion DUE TO peer re-rating, sector rotation, or business model evolution OR (2) earnings upgrades DUE TO market share gains, margin expansion, or new growth vectors. Downside alerts on target cuts >10% or coverage drops >20%.`,
        impact: fd.targetMedianPrice > fd.currentPrice * 1.1 ? "Positive" : fd.targetMedianPrice < fd.currentPrice * 0.9 ? "Negative" : "Neutral"
      },
      {
        metric: "Technical Triggers",
        value: `${formatPercent(ks["52WeekChange"])} YTD`,
        analysis: `YTD return ${formatPercent(ks["52WeekChange"])} vs. 52-week range $${
          ks["52WeekLow"]
        }-${ks["52WeekHigh"]}. Support at ${(ks["52WeekLow"] * 1.1).toFixed(2)}, resistance at ${
          (ks["52WeekHigh"] * 0.9).toFixed(2)
        }. MONITOR CHANGES IN: Volume spikes >2x avg or price moves >5%. IF TRIGGERS HIT: Technical breakouts could signal (1) institutional accumulation DUE TO systematic flows, mandate shifts, or factor rotation OR (2) position unwinds DUE TO stop levels, portfolio rebalancing, or risk limits. Alert on volume >3x avg or price moves >7%.`,
        impact: ks["52WeekChange"] > 0.2 ? "Strong" : ks["52WeekChange"] > 0 ? "Moderate" : "Weak"
      }
    ],
    fundamentalMonitoring: [
      {
        metric: "Growth Dynamics",
        value: `${formatPercent(fd.revenueGrowth)} Rev / ${formatPercent(fd.earningsGrowth)} EPS`,
        analysis: `Revenue growth ${formatPercent(fd.revenueGrowth)} vs. earnings growth ${
          formatPercent(fd.earningsGrowth)
        }. Operating leverage ${(fd.earningsGrowth / fd.revenueGrowth).toFixed(2)}x. MONITOR CHANGES IN: Growth divergence >20% or margin shifts >300bps. IF TRIGGERS HIT: Growth acceleration could signal (1) business inflection DUE TO product cycles, market expansion, or competitive gains OR (2) operating leverage DUE TO scale benefits, mix shifts, or cost initiatives. Alert on growth deceleration >10% or margin compression >200bps.`,
        impact: fd.earningsGrowth > fd.revenueGrowth ? "Positive" : "Watch"
      },
      {
        metric: "Capital Returns",
        value: `${formatPercent(ks.payoutRatio)} Payout`,
        analysis: `Dividend payout ${formatPercent(ks.payoutRatio)} vs. peer avg 40%, buyback yield ${
          formatPercent(ks.buybackYield || 0.02)
        }. MONITOR CHANGES IN: Payout policy shifts or buyback patterns. IF TRIGGERS HIT: Capital return expansion could indicate (1) increased confidence DUE TO cash flow visibility, balance sheet strength, or growth outlook OR (2) strategic shifts DUE TO business maturity, activist pressure, or capital structure optimization. Alert on payout cuts or buyback suspensions.`,
        impact: ks.payoutRatio > 0.75 ? "Watch" : "Sustainable"
      }
    ],
    riskMonitoring: [
      {
        metric: "Risk Indicators",
        value: (fd.recommendationKey || 'N/A').toUpperCase(),
        analysis: `${fd.numberOfAnalystOpinions} analysts rate stock ${
          fd.recommendationKey
        } with mean score ${fd.recommendationMean.toFixed(2)} vs. peer avg 2.5. Short interest ${
          formatPercent(ks.shortPercentOfFloat)
        }. MONITOR CHANGES IN: Rating distribution shifts or short interest spikes. IF TRIGGERS HIT: Risk elevation could signal (1) fundamental concerns DUE TO competitive threats, margin pressure, or growth sustainability OR (2) positioning changes DUE TO style rotation, sector sentiment, or macro factors. Alert on rating downgrades >20% or short interest spikes >50%.`,
        impact: fd.recommendationMean < 2.5 ? "Positive" : fd.recommendationMean < 3 ? "Neutral" : "Caution"
      },
      {
        metric: "Volatility Alerts",
        value: `${(ks.beta * 100).toFixed(0)}% Vol`,
        analysis: `Realized volatility ${(ks.beta * 100).toFixed(0)}% vs. VIX ${
          ks.marketVolatility || 20
        }%. Options implied vol ${formatPercent(ks.impliedVolatility || 0.3)}. MONITOR CHANGES IN: Vol regime shifts or skew changes. IF TRIGGERS HIT: Volatility spikes could indicate (1) increased uncertainty DUE TO event risk, position adjustments, or market stress OR (2) hedging pressure DUE TO portfolio protection, risk reduction, or derivative flows. Alert on vol >2x normal or skew >90th percentile.`,
        impact: ks.beta > 1.5 ? "High Vol" : ks.beta < 0.8 ? "Low Vol" : "Normal Vol"
      }
    ],
    summary: [
      {
        metric: "Monitoring Framework",
        value: "Key Triggers",
        analysis: `Active monitoring of: Price targets ($${fd.targetLowPrice}-${fd.targetHighPrice}), Growth metrics (Rev ${
          formatPercent(fd.revenueGrowth)
        } / EPS ${formatPercent(fd.earningsGrowth)}), Risk indicators (${
          fd.numberOfAnalystOpinions
        } analysts, ${formatPercent(ks.shortPercentOfFloat)} short interest). Key alerts set for: Rating changes >20%, Growth divergence >10%, Volatility spikes >2x normal.`,
        impact: "Ongoing"
      }
    ]
  };
};

// Helper functions for style analysis
const determineInvestmentStyle = (ks, fd) => {
  if (ks.forwardPE < 15 && fd.returnOnEquity > 0.15) return "Value";
  if (fd.revenueGrowth > 0.15 && ks.forwardPE > 20) return "Growth";
  if (ks.beta > 1.2 && fd.operatingMargins > 0.2) return "GARP";
  return "Blend";
};

const calculateStyleAnalysis = (ks, fd) => {
  let style = determineInvestmentStyle(ks, fd);
  let analysis = "";

  switch (style) {
    case "Value":
      analysis = `Classic value characteristics with strong fundamentals. Suitable for Buffett-style investing.`;
      break;
    case "Growth":
      analysis = `High growth profile with premium valuation. Momentum-driven opportunity.`;
      break;
    case "GARP":
      analysis = `Growth at reasonable price with balanced metrics. Moderate risk-reward profile.`;
      break;
    default:
      analysis = `Balanced characteristics suitable for multiple strategies.`;
  }

  return analysis;
};

const analyzeMarketPosition = (ks, fd) => {
  let position = [];

  if (ks.heldPercentInstitutions > 0.7) {
    position.push("Strong institutional backing");
  }
  if (ks.beta < 0.8) {
    position.push("Defensive characteristics");
  }
  if (ks.beta > 1.2) {
    position.push("High market sensitivity");
  }

  return position.join(". ") || "Moderate market positioning";
};

const determineMarketImpact = (ks) => {
  if (ks.beta < 0.8) return "Defensive";
  if (ks.beta > 1.2) return "Aggressive";
  return "Moderate";
};

export const evaluateRiskMetrics = (financialData) => {
  let riskScore = 0;
  const risks = [];

  // Check leverage metrics
  if (financialData.debtToEquity) {
    if (financialData.debtToEquity < 30) {
      riskScore += 2;
    } else if (financialData.debtToEquity < 70) {
      riskScore += 1;
    }
    
    if (financialData.debtToEquity > 100) {
      risks.push("High leverage ratio");
    }
  }

  // Check liquidity metrics
  if (financialData.currentRatio) {
    if (financialData.currentRatio > 2) {
      riskScore += 2;
    } else if (financialData.currentRatio > 1) {
      riskScore += 1;
    }
    
    if (financialData.currentRatio < 1) {
      risks.push("Poor liquidity position");
    }
  }

  // Check profitability trend
  if (financialData.netMargin) {
    if (financialData.netMargin > 15) {
      riskScore += 2;
    } else if (financialData.netMargin > 5) {
      riskScore += 1;
    }
    
    if (financialData.netMargin < 0) {
      risks.push("Negative profit margins");
    }
  }

  // Evaluate market risk factors
  if (financialData.beta) {
    if (financialData.beta < 1.2) {
      risks.push("Market volatility exposure");
    }
  }

  // Check concentration risk
  if (financialData.segmentData && Array.isArray(financialData.segmentData)) {
    const maxSegmentRevenue = Math.max(...financialData.segmentData.map(s => s.revenue));
    const totalRevenue = financialData.segmentData.reduce((sum, s) => sum + s.revenue, 0);
    
    if ((maxSegmentRevenue / totalRevenue) > 0.5) {
      risks.push("High revenue concentration");
    }
  }

  return {
    score: Math.min(riskScore, 6), // Cap score at 6
    risks: risks,
    details: {
      leverage: {
        score: financialData.debtToEquity < 70 ? "Low" : "High",
        value: financialData.debtToEquity
      },
      liquidity: {
        score: financialData.currentRatio > 1 ? "Adequate" : "Poor",
        value: financialData.currentRatio
      },
      marketRisk: {
        score: financialData.beta < 1.2 ? "Moderate" : "High",
        value: financialData.beta
      }
    }
  };
};

// Then define the main analysis function that uses it
export const analyzeSummaryDashboard = (financialData) => {
  if (!financialData || !financialData._raw) {
    return {
      title: "Investment Summary",
      metrics: [],
      summary: "Financial data not available"
    };
  }

  const fd = financialData._raw.financialData;
  const ks = financialData._raw.keyStats;

  const metrics = {
    valuation: [
      {
        metric: "Market Valuation",
        value: `${ks.forwardPE.toFixed(2)}x P/E`,
        analysis: `Trading at ${ks.forwardPE.toFixed(2)}x forward P/E with ${formatPercent(fd.revenueGrowth)} revenue growth`,
        impact: ks.forwardPE < 20 ? "Positive" : "Neutral"
      },
      {
        metric: "Growth & Margins",
        value: `${formatPercent(fd.revenueGrowth)} Growth`,
        analysis: `Revenue growth at ${formatPercent(fd.revenueGrowth)} with ${formatPercent(fd.operatingMargins)} operating margins`,
        impact: fd.revenueGrowth > 0.15 ? "Strong" : "Moderate"
      }
    ],
    performance: [
      {
        metric: "Market Performance",
        value: `${formatPercent(ks["52WeekChange"])} YTD`,
        analysis: `Stock returned ${formatPercent(ks["52WeekChange"])} YTD vs S&P500 ${formatPercent(ks.SandP52WeekChange)}`,
        impact: ks["52WeekChange"] > ks.SandP52WeekChange ? "Strong" : "Moderate"
      },
      {
        metric: "Analyst View",
        value: (fd.recommendationKey || 'N/A').toUpperCase(),
        analysis: `${fd.numberOfAnalystOpinions} analysts coverage with median target $${fd.targetMedianPrice}`,
        impact: fd.recommendationMean < 2.5 ? "Positive" : "Neutral"
      }
    ],
    risk: [
      {
        metric: "Risk Profile",
        value: `Beta: ${ks.beta.toFixed(2)}`,
        analysis: `Market beta of ${ks.beta.toFixed(2)} with ${formatPercent(ks.heldPercentInstitutions)} institutional ownership`,
        impact: ks.beta < 1.2 ? "Low Risk" : "High Risk"
      },
      {
        metric: "Financial Health",
        value: `D/E: ${fd.debtToEquity}%`,
        analysis: `Debt/Equity ratio ${fd.debtToEquity}% with ${formatPercent(fd.returnOnEquity)} return on equity`,
        impact: fd.debtToEquity < 100 ? "Strong" : "Caution"
      }
    ]
  };

  return metrics;
};

// First define the helper function
export const calculateEnhancedMoatScore = (fd, ks) => {
  let score = 0;
  let reasons = [];

  // Brand Value & Pricing Power (0-3 points)
  if (fd.grossMargins > 0.50) {
    score += 3;
    reasons.push("Premium pricing power");
  } else if (fd.grossMargins > 0.35) {
    score += 2;
    reasons.push("Strong margins");
  }

  // Scale & Market Position (0-3 points)
  if (fd.totalRevenue > getIndustryAvgRevenue(fd) * 2) {
    score += 3;
    reasons.push("Market leadership");
  } else if (fd.totalRevenue > getIndustryAvgRevenue(fd)) {
    score += 2;
    reasons.push("Strong market position");
  }

  // Operating Efficiency (0-2 points)
  if (fd.operatingMargins > getIndustryMetric(fd, 'avgOperatingMargin') * 1.25) {
    score += 2;
    reasons.push("Superior efficiency");
  } else if (fd.operatingMargins > getIndustryMetric(fd, 'avgOperatingMargin')) {
    score += 1;
    reasons.push("Good efficiency");
  }

  // Growth & Returns (0-2 points)
  if (fd.returnOnEquity > 0.20 && fd.revenueGrowth > 0.15) {
    score += 2;
    reasons.push("Strong returns and growth");
  } else if (fd.returnOnEquity > 0.15 || fd.revenueGrowth > 0.10) {
    score += 1;
    reasons.push("Good capital returns");
  }

  return {
    score,
    maxScore: 10,
    reasons
  };
};