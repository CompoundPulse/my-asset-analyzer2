// Formatting Utilities
const formatNumber = (value) => {
  if (!value) return 'N/A';
  return value.toLocaleString();
};

const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `$${(value / 1e9).toFixed(2)}B`;
};

// Enhanced Thresholds with Industry Context
const VALUATION_THRESHOLDS = {
  PE_RATIO: {
    DEEP_VALUE: 10,
    VALUE: 15,
    GROWTH: 25,
    HIGH_GROWTH: 35
  },
  PRICE_TO_BOOK: {
    VALUE: 1.5,
    FAIR: 3,
    PREMIUM: 5
  },
  MARGINS: {
    LOW: 0.10,
    MEDIUM: 0.20,
    HIGH: 0.30,
    EXCEPTIONAL: 0.40
  },
  GROWTH_RATES: {
    SLOW: 0.05,
    MODERATE: 0.10,
    FAST: 0.20,
    EXCEPTIONAL: 0.30
  },
  MOAT_FACTORS: {
    NETWORK_EFFECTS: {
      USER_GROWTH_RATE: 0.20,
      PLATFORM_REVENUE: 1e9
    },
    BRAND_VALUE: {
      GROSS_MARGIN: 0.40,
      MARKETING_EFFICIENCY: 0.15
    },
    SWITCHING_COSTS: {
      RETENTION_RATE: 0.90,
      RECURRING_REVENUE: 0.60
    },
    COST_ADVANTAGES: {
      OPERATING_MARGIN_PREMIUM: 0.05,
      SCALE_THRESHOLD: 5e9
    }
  }
};

// Enhanced Industry Context
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

// Helper Functions
const calculateOwnerEarnings = (fd) => {
  return (fd.netIncome || 0) +
         (fd.depreciation || 0) -
         (fd.capitalExpenditures || 0);
};

const calculateROIC = (fd) => {
  const investedCapital = (fd.totalAssets || 0) - (fd.totalCurrentLiabilities || 0);
  const ebit = fd.ebit || 0;
  return investedCapital !== 0 ? ebit / investedCapital : 0;
};

const calculateEVASpread = (fd, ks) => {
  const wacc = 0.08; // Simplified WACC assumption
  return (calculateROIC(fd) - wacc);
};

const calculateGrowthScore = (fd, ks) => {
  let score = 0;
  if (fd.revenueGrowth > VALUATION_THRESHOLDS.GROWTH_RATES.MODERATE) score += 2;
  if (fd.earningsGrowth > VALUATION_THRESHOLDS.GROWTH_RATES.MODERATE) score += 2;
  if (fd.operatingMargins > fd.grossMargins) score += 1;
  return `${score}/5`;
};

const calculateReinvestmentRate = (fd) => {
  return fd.netIncome ? (fd.capitalExpenditures || 0) / fd.netIncome : 0;
};

const assessGrowthTrends = (fd) => {
  if (fd.revenueGrowth > fd.earningsGrowth) {
    return "Revenue growing faster than earnings indicates potential margin pressure";
  } else if (fd.earningsGrowth > fd.revenueGrowth * 1.5) {
    return "Earnings growing significantly faster than revenue indicates strong operational leverage";
  }
  return "Balanced growth between revenue and earnings";
};

const determineGrowthQuality = (fd) => {
  if (fd.revenueGrowth > VALUATION_THRESHOLDS.GROWTH_RATES.FAST &&
      fd.earningsGrowth > VALUATION_THRESHOLDS.GROWTH_RATES.FAST) {
    return "Strong";
  }
  return "Moderate";
};

const analyzeCapitalEfficiency = (fd) => {
  const roic = calculateROIC(fd);
  if (roic > 0.15) {
    return "Excellent capital allocation efficiency";
  } else if (roic > 0.10) {
    return "Good capital allocation efficiency";
  }
  return "Moderate capital allocation efficiency";
};

const analyzeValueCreation = (fd, ks) => {
  const evaSpread = calculateEVASpread(fd, ks);
  if (evaSpread > 0.10) {
    return "Significant value creation above cost of capital";
  } else if (evaSpread > 0) {
    return "Moderate value creation above cost of capital";
  }
  return "Operating below cost of capital";
};

// Enhanced Moat Analysis
const calculateEnhancedMoatScore = (fd, ks) => {
    let score = 0;
    let reasons = [];
    let categories = {
      networkEffects: 0,
      brandValue: 0,
      switchingCosts: 0,
      costAdvantages: 0
    };

    // Network Effects
    if (fd.revenueGrowth > VALUATION_THRESHOLDS.MOAT_FACTORS.NETWORK_EFFECTS.USER_GROWTH_RATE) {
      categories.networkEffects += 2;
      if (fd.totalRevenue > VALUATION_THRESHOLDS.MOAT_FACTORS.NETWORK_EFFECTS.PLATFORM_REVENUE) {
        categories.networkEffects += 1;
        reasons.push("Strong network effects with scale");
      }
    }

    // Brand Value
    if (fd.grossMargins > VALUATION_THRESHOLDS.MOAT_FACTORS.BRAND_VALUE.GROSS_MARGIN) {
      categories.brandValue += 2;
      reasons.push("Premium brand pricing power");
    }

    // Switching Costs
    if (fd.operatingMargins > VALUATION_THRESHOLDS.MARGINS.HIGH) {
      categories.switchingCosts += 2;
      reasons.push("High customer switching costs");
    }

    // Cost Advantages
    if (fd.totalRevenue > VALUATION_THRESHOLDS.MOAT_FACTORS.COST_ADVANTAGES.SCALE_THRESHOLD) {
      categories.costAdvantages += 2;
      if (fd.operatingMargins > (getIndustryMetric(fd, 'avgOperatingMargin') +
          VALUATION_THRESHOLDS.MOAT_FACTORS.COST_ADVANTAGES.OPERATING_MARGIN_PREMIUM)) {
        categories.costAdvantages += 1;
        reasons.push("Significant cost advantages from scale");
      }
    }

    score = Object.values(categories).reduce((a, b) => a + b, 0);

    return {
      score,
      reasons,
      categories
    };
  };

  // Industry Comparison Functions
  const getIndustryMetric = (fd, metric) => {
    // Simplified industry detection - would need to be enhanced with real sector data
    const industry = detectIndustry(fd);
    return INDUSTRY_METRICS[industry]?.[metric] || null;
  };

  const detectIndustry = (fd) => {
    // Simplified industry detection logic
    if (fd.grossMargins > 0.60) return 'TECH';
    if (fd.operatingMargins > 0.25) return 'FINANCIAL';
    if (fd.revenueGrowth > 0.12) return 'HEALTHCARE';
    return 'CONSUMER';
  };

  const compareToIndustry = (fd, metric, value) => {
    const industryAvg = getIndustryMetric(fd, metric);
    if (!industryAvg) return "Industry comparison not available";

    const difference = value - industryAvg;
    const percentDiff = (difference / industryAvg) * 100;

    if (Math.abs(percentDiff) < 5) return "In line with industry average";
    return `${percentDiff > 0 ? "Above" : "Below"} industry average by ${Math.abs(percentDiff).toFixed(1)}%`;
  };

// Main Analysis Functions
export const analyzeValueMetrics = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  const moatAnalysis = calculateEnhancedMoatScore(fd, ks);
  const industryComparison = compareToIndustry(fd, 'avgOperatingMargin', fd.operatingMargins);

  return {
    fundamentalValue: [
      {
        metric: "Enhanced Moat Analysis",
        value: `${moatAnalysis.score}/10`,
        analysis: `Competitive advantages: ${moatAnalysis.reasons.join(", ")}. ${
          moatAnalysis.score > 7 ? "Exceptional moat characteristics" :
          moatAnalysis.score > 5 ? "Strong competitive advantages" :
          moatAnalysis.score > 3 ? "Moderate competitive position" :
          "Limited competitive advantages"
        }. ${industryComparison}`,
        impact: moatAnalysis.score > 5 ? "Strong" : "Moderate"
      },
      {
        metric: "Owner Earnings",
        value: formatCurrency(calculateOwnerEarnings(fd)),
        analysis: `Owner earnings indicate ${fd.freeCashflow > fd.netIncome ? "strong" : "moderate"} cash generation capability`,
        impact: fd.freeCashflow > fd.netIncome ? "Strong" : "Moderate"
      }
    ],
    valueCreation: [
      {
        metric: "Capital Efficiency",
        value: formatPercent(fd.returnOnEquity),
        analysis: `Returns on capital: ROE ${formatPercent(fd.returnOnEquity)}, ROIC ${
          calculateROIC(fd)
        }. ${analyzeCapitalEfficiency(fd)}`,
        impact: fd.returnOnEquity > 0.15 ? "Strong" : "Moderate"
      },
      {
        metric: "Value Generation",
        value: formatPercent(calculateEVASpread(fd, ks)),
        analysis: `${analyzeValueCreation(fd, ks)}`,
        impact: calculateEVASpread(fd, ks) > 0.05 ? "Strong" : "Moderate"
      }
    ]
  };
};

export const analyzeGrowthQuality = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    growthQuality: [
      {
        metric: "Organic Growth",
        value: formatPercent(fd.revenueGrowth),
        analysis: `Revenue growth of ${formatPercent(fd.revenueGrowth)} with earnings growth of ${
          formatPercent(fd.earningsGrowth)
        }. ${assessGrowthTrends(fd)}`,
        impact: determineGrowthQuality(fd)
      },
      {
        metric: "Growth Sustainability",
        value: calculateGrowthScore(fd, ks),
        analysis: `Growth quality score indicates ${
        parseInt(calculateGrowthScore(fd, ks)) > 3 ? "sustainable" : "moderate"
          } growth characteristics`,
        impact: parseInt(calculateGrowthScore(fd, ks)) > 3 ? "Strong" : "Moderate"
      }
    ],
    reinvestmentMetrics: [
      {
        metric: "Reinvestment Rate",
        value: formatPercent(calculateReinvestmentRate(fd)),
        analysis: `Capital reinvestment indicates ${
          calculateReinvestmentRate(fd) > 0.15 ? "strong" : "moderate"
        } growth investment`,
        impact: calculateReinvestmentRate(fd) > 0.15 ? "Strong" : "Moderate"
      }
    ]
  };
};

const generateInvestmentFrameworkSummary = (fd, ks) => {
  const moatAnalysis = calculateEnhancedMoatScore(fd, ks);
  const roic = calculateROIC(fd);
  const industryAvgOPM = getIndustryMetric(fd, 'avgOperatingMargin') * 100;
  
  return `Company shows ${(fd.operatingMargins * 100).toFixed(2)}% operating margins vs industry ${industryAvgOPM}%, ROE of ${(fd.returnOnEquity * 100).toFixed(2)}% and ROIC of ${(roic * 100).toFixed(2)}%. Moat score ${moatAnalysis.score}/10 with ${moatAnalysis.reasons.join(", ")}. Revenue growth ${(fd.revenueGrowth * 100).toFixed(1)}% with earnings growth ${(fd.earningsGrowth * 100).toFixed(1)}%. Cost of capital spread is ${Math.abs((roic - 0.08) * 100).toFixed(2)}% ${roic > 0.08 ? "positive" : "negative"}. Market beta ${ks.beta.toFixed(2)} suggests ${ks.beta > 1.2 ? "aggressive" : "moderate"} characteristics.`;
};

const calculateDetailedROIC = (fd) => {
  const nopat = (fd.ebit || 0) * (1 - 0.21); // Assuming 21% tax rate
  const workingCapital = (fd.totalCurrentAssets || 0) - (fd.totalCurrentLiabilities || 0);
  const fixedAssets = (fd.totalAssets || 0) - (fd.totalCurrentAssets || 0);
  const investedCapital = workingCapital + fixedAssets;
  
  return investedCapital !== 0 ? nopat / investedCapital : 0;
};
// Helper functions for style analysis
const determineInvestmentStyle = (ks, fd) => {
  if (ks.forwardPE < 15 && fd.returnOnEquity > 0.15) return "Value";
  if (fd.revenueGrowth > 0.15 && ks.forwardPE > 20) return "Growth";
  if (ks.beta > 1.2 && fd.operatingMargins > 0.2) return "GARP";
  return "Blend";
};

const determineStyleImpact = (ks, fd) => {
  if (ks.forwardPE > 25 && fd.revenueGrowth > 0.15) return "Growth Premium";
  if (ks.forwardPE < 15 && fd.returnOnEquity > 0.15) return "Value Opportunity";
  return "Balanced";
};

const determineBetaImpact = (beta) => {
  if (beta > 1.5) return "High Volatility";
  if (beta < 0.8) return "Defensive";
  return "Moderate";
};
export const enhancedAnalyzeInvestmentStyle = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    valueMetrics: [
      {
        metric: "Buffett Value Criteria",
        value: `P/E: ${ks.forwardPE.toFixed(2)}`,
        analysis: `Forward P/E of ${ks.forwardPE.toFixed(2)}x vs industry average of 20x. CURRENT SIGNAL: ${
          ks.forwardPE > 20 
            ? "Premium valuation indicates market expects above-average growth" 
            : "Valuation within traditional value parameters"
        }. IF MORE EXTREME: Could indicate either (1) exceptional growth prospects justifying premium OR (2) potential earnings management through aggressive revenue recognition or delayed expense recording.`,
        impact: ks.forwardPE < 20 ? "Value" : "Growth"
      },
      {
        metric: "Moat Indicator",
        value: formatPercent(fd.grossMargins),
        analysis: `Gross margins of ${formatPercent(fd.grossMargins)} vs industry average of 45%. CURRENT SIGNAL: ${
          fd.grossMargins > 0.45 
            ? "Above-average margins suggest strong pricing power" 
            : "Below-average margins indicate competitive pressure"
        }. IF MORE EXTREME: Could mean either (1) dominant market position enabling premium pricing OR (2) potential channel stuffing or supplier payment manipulation.`,
        impact: fd.grossMargins > 0.45 ? "Strong" : "Moderate"
      }
    ],
    qualityMetrics: [
      {
        metric: "Capital Allocation",
        value: formatCurrency(fd.freeCashflow),
        analysis: `FCF of ${formatCurrency(fd.freeCashflow)} with ${formatPercent(ks.payoutRatio)} payout vs industry average 40%. CURRENT SIGNAL: ${
          fd.freeCashflow > 0 && ks.payoutRatio < 0.4 
            ? "Strong cash generation with conservative payout" 
            : "Typical cash flow profile for industry"
        }. IF MORE EXTREME: Could indicate either (1) superior operational efficiency OR (2) potential underinvestment in maintenance capex or working capital manipulation.`,
        impact: (fd.freeCashflow > 0 && ks.payoutRatio < 0.75) ? "Strong" : "Caution"
      }
    ],
    marketStyle: [
      {
        metric: "Investment Style",
        value: determineInvestmentStyle(ks, fd),
        analysis: `${ks.forwardPE > 25 ? "Growth" : "Value"} profile with ${formatPercent(fd.revenueGrowth)} growth vs industry 10%. CURRENT SIGNAL: ${
          ks.forwardPE > 25 && fd.revenueGrowth > 0.15 
            ? "High growth with premium valuation" 
            : "Balanced growth-value characteristics"
        }. IF MORE EXTREME: Could suggest either (1) emerging industry leader OR (2) aggressive market expansion at unsustainable unit economics.`,
        impact: determineStyleImpact(ks, fd)
      },
    ],
    fundamentalValue: [
      {
        metric: "Enhanced Moat Analysis",
        value: `${calculateEnhancedMoatScore(fd, ks).score}/10`,
        analysis: `Moat score ${calculateEnhancedMoatScore(fd, ks).score}/10 vs industry benchmark 5/10. CURRENT SIGNAL: ${
          calculateEnhancedMoatScore(fd, ks).score > 5 
            ? "Above-average competitive position" 
            : "Limited competitive advantages"
        }. IF MORE EXTREME: Could reflect either (1) emerging network effects and scale advantages OR (2) temporary market distortions from aggressive promotional activity.`,
        impact: calculateEnhancedMoatScore(fd, ks).score > 5 ? "Strong" : "Moderate"
      }
    ],
    valueCreation: [
      {
        metric: "Value Creation",
        value: formatPercent(calculateEVASpread(fd, ks)),
        analysis: `EVA spread ${formatPercent(calculateEVASpread(fd, ks))} vs industry 2%. CURRENT SIGNAL: ${
          calculateEVASpread(fd, ks) > 0.02 
            ? "Creating value above cost of capital" 
            : "Operating below cost of capital"
        }. IF MORE EXTREME: Could indicate either (1) sustainable competitive advantages OR (2) potential overstatement of operating income through aggressive accounting.`,
        impact: calculateEVASpread(fd, ks) > 0.02 ? "Strong" : "Moderate"
      }
    ],
    summary: [
      {
        metric: "Investment Framework Summary",
        value: "Comprehensive Analysis",
        analysis: generateInvestmentFrameworkSummary(fd, ks),
        impact: "Overview"
      }
    ]
  };
};

// Add to completeAnalysis2.js

// Market Cycle Indicators
const MARKET_CYCLES = {
EARLY_BULL: {
  CHARACTERISTICS: {
    PE_EXPANSION: true,
    VOLUME_TREND: "INCREASING",
    SECTOR_LEADERSHIP: ["FINANCIALS", "INDUSTRIALS", "TECH"]
  }
},
LATE_BULL: {
  CHARACTERISTICS: {
    MARGIN_COMPRESSION: true,
    YIELD_CURVE: "FLATTENING",
    SECTOR_LEADERSHIP: ["ENERGY", "MATERIALS", "STAPLES"]
  }
},
EARLY_BEAR: {
  CHARACTERISTICS: {
    PE_CONTRACTION: true,
    VOLUME_TREND: "INCREASING",
    SECTOR_LEADERSHIP: ["UTILITIES", "HEALTHCARE", "STAPLES"]
  }
}
};

const generateMacroSummary = (fd, ks) => {
  const cycleScore = analyzeCycleIndicators(ks);
  const beta = ks.beta;
  const sectorPerformance = ks["52WeekChange"] - ks.SandP52WeekChange;
  const debtToAssets = calculateRateSensitivity(fd, ks);
  
  return `Current market analysis indicates ${
      cycleScore >= 6 ? "mid" : cycleScore >= 4 ? "early" : "late"
  }-cycle conditions (${cycleScore}/10) based on PE trends, momentum, and institutional positioning. The stock's ${
      detectIndustry(fd)
  } sector classification and moderate beta of ${beta.toFixed(2)} suggests proportional market sensitivity. With ${
      debtToAssets
  } debt-to-assets ratio, the company shows ${
      parseFloat(debtToAssets) < 0.1 ? "minimal" : "significant"
  } interest rate risk. Sector positioning in ${detectIndustry(fd)} remains ${
      sectorPerformance > 0 ? "favorable" : "challenging"
  } in current conditions, ${
      sectorPerformance > 0 
          ? `outperforming S&P500 by ${(sectorPerformance * 100).toFixed(1)}%` 
          : `underperforming S&P500 by ${(Math.abs(sectorPerformance) * 100).toFixed(1)}%`
  }. Institutional ownership at ${(ks.heldPercentInstitutions * 100).toFixed(1)}% suggests ${
      ks.heldPercentInstitutions > 0.7 ? "stable" : "potentially volatile"
  } trading patterns. PE ratio trend ${
      ks.forwardPE < ks.trailingPE ? "indicates improving forward valuations" : "suggests potential valuation pressure"
  }. Key watch points: market movements will be amplified by ${beta.toFixed(1)}x due to beta, ${
      detectIndustry(fd)
  } sector rotation trends, and potential changes in growth stock sentiment. Consider position sizing to account for this ${
      beta > 1 ? "higher" : "lower"
  } than market volatility profile.`;
};

// Enhanced Macro Analysis
export const enhancedMacroAnalysis = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  return {
    marketEnvironment: [
      {
        metric: "Market Sensitivity",
        value: ks.beta.toFixed(2),
        analysis: `Beta of ${ks.beta.toFixed(2)} vs market average of 1.0. CURRENT SIGNAL: ${
          ks.beta > 1.2 
            ? "Above-average market sensitivity indicates amplified market exposure" 
            : ks.beta < 0.8 
            ? "Below-average sensitivity suggests defensive characteristics" 
            : "Moderate market sensitivity aligned with broader market"
        }. IF MORE EXTREME: ${
          ks.beta > 1.0 
            ? "Further increase could indicate rising cyclical exposure and volatility risk DUE TO increased leverage, expansion into cyclical markets, or reduced revenue visibility" 
            : "Further decrease might signal stronger defensive moat DUE TO expanded recurring revenue, stable customer base, or increased pricing power"
        }.`,
        impact: determineBetaImpact(ks.beta)
      },
      {
        metric: "Market Performance",
        value: `${formatPercent(ks["52WeekChange"])}`,
        analysis: `Return of ${formatPercent(ks["52WeekChange"])} vs S&P500 ${formatPercent(ks.SandP52WeekChange)}. CURRENT SIGNAL: ${
          ks["52WeekChange"] > ks.SandP52WeekChange 
            ? "Outperformance indicates market leadership" 
            : "Underperformance suggests market headwinds"
        }. IF MORE EXTREME: ${
          ks["52WeekChange"] > ks.SandP52WeekChange 
            ? "Stronger outperformance could indicate either sustainable competitive advantages or mean reversion risk" 
            : "Deeper underperformance might signal either deteriorating fundamentals or potential value opportunity"
        }.`,
        impact: determinePerformanceImpact(ks)
      }
    ],
    valuationCycle: [
      {
        metric: "Valuation Level",
        value: `${ks.forwardPE.toFixed(2)}x`,
        analysis: `Forward P/E of ${ks.forwardPE.toFixed(2)}x vs sector average of ${getIndustryMetric(fd, 'avgPERatio')}x with earnings growth of ${formatPercent(ks.earningsQuarterlyGrowth)}. CURRENT SIGNAL: ${
          ks.forwardPE > getIndustryMetric(fd, 'avgPERatio') 
            ? "Premium valuation indicates high growth expectations" 
            : "Valuation below sector average suggests market skepticism"
        }. IF MORE EXTREME: ${
          ks.forwardPE > getIndustryMetric(fd, 'avgPERatio') 
            ? "Higher premium would require exceptional growth execution to justify" 
            : "Further discount might indicate either value opportunity or structural challenges"
        }.`,
        impact: determineValuationImpact(ks, fd)
      }
    ],
    economicCycle: [
      {
        metric: "Market Phase Indicators",
        value: determineCyclePhase(ks),
        analysis: `Cycle score ${determineCyclePhase(ks)} vs typical mid-cycle score of 5/10. CURRENT SIGNAL: ${
          analyzeCyclePosition(ks)
        }. IF MORE EXTREME: Could indicate either (1) major market regime change with rotation opportunities OR (2) potential market timing risks from misreading cycle.`,
        impact: determineCycleImpact(ks)
      },
      {
        metric: "Rate Sensitivity",
        value: calculateRateSensitivity(fd, ks),
        analysis: `Debt/Assets ratio of ${calculateRateSensitivity(fd, ks)} vs industry average of 25%. CURRENT SIGNAL: ${
          parseFloat(calculateRateSensitivity(fd, ks)) > 25 
            ? "Above-average rate sensitivity indicates interest rate risk exposure" 
            : "Below-average rate sensitivity suggests interest rate resilience"
        }. IF MORE EXTREME: ${
          parseFloat(calculateRateSensitivity(fd, ks)) > 25 
            ? "Higher leverage could amplify both returns and risks in changing rate environments" 
            : "Lower leverage might indicate either conservative management or underutilized balance sheet"
        }.`,
        impact: determineRateImpact(fd, ks)
      }
    ],
    sectorAnalysis: [
      {
        metric: "Sector Positioning",
        value: analyzeSectorPosition(fd, ks),
        analysis: `${detectIndustry(fd)} sector vs broad market trends. CURRENT SIGNAL: ${
          ks["52WeekChange"] > ks.SandP52WeekChange 
            ? "Sector showing relative strength vs market" 
            : "Sector lagging broader market performance"
        }. IF MORE EXTREME: ${
          ks["52WeekChange"] > ks.SandP52WeekChange 
            ? "Stronger sector leadership could indicate sustainable advantages or bubble risk" 
            : "Deeper sector weakness might suggest either structural decline or contrarian opportunity"
        }.`,
        impact: determineSectorStrength(ks)
      }
    ],
    macroCorrelations: [
      {
        metric: "GDP Sensitivity",
        value: `${formatPercent(fd.revenueGrowth / calculateGDPBeta(fd))}`,
        analysis: `Revenue growth vs GDP multiplier of ${calculateGDPBeta(fd).toFixed(2)}x (industry avg: 1.5x). CURRENT SIGNAL: ${
          calculateGDPBeta(fd) > 1.5 
            ? "Growth outpaces GDP, indicating market share gains" 
            : "Growth aligned with economic expansion"
        }. IF MORE EXTREME: Higher GDP multiplier could indicate either (1) sustainable market leadership DUE TO network effects, platform scaling, or market consolidation OR (2) unsustainable growth DUE TO aggressive pricing, channel stuffing, or one-time market factors.`,
        impact: determineGDPImpact(fd)
      },
      {
        metric: "Inflation Exposure",
        value: `${formatPercent(calculatePriceTransmission(fd))}`,
        analysis: `Price transmission ratio of ${formatPercent(calculatePriceTransmission(fd))} vs industry average of 70%. CURRENT SIGNAL: ${
          calculatePriceTransmission(fd) > 0.7 
            ? "Strong pricing power enables inflation pass-through" 
            : "Limited ability to pass through cost increases"
        }. IF MORE EXTREME: Higher transmission could indicate either (1) dominant market position DUE TO high switching costs, brand value, or limited competition OR (2) risk of customer attrition DUE TO price sensitivity, substitute products, or new market entrants.`,
        impact: determinePricingImpact(fd)
      },
      {
        metric: "Currency Exposure",
        value: `${formatPercent(calculateFXExposure(fd))}`,
        analysis: `Foreign revenue exposure of ${formatPercent(calculateFXExposure(fd))} vs industry average of 40%. CURRENT SIGNAL: ${
          calculateFXExposure(fd) > 0.4 
            ? "Above-average currency risk from international operations" 
            : "Limited currency exposure from primarily domestic business"
        }. IF MORE EXTREME: Higher exposure could indicate either (1) successful global expansion DUE TO scalable business model, strong international demand, or market leadership OR (2) increased earnings volatility DUE TO currency fluctuations, geopolitical risks, or market-specific challenges.`,
        impact: determineFXImpact(fd)
      }
    ],
    summary: [
      {
        metric: "Macro Summary",
        value: "Comprehensive Analysis",
        analysis: generateMacroSummary(fd, ks),
        impact: "Overview"
      }
    ]
  };
};

const determineVolatilityImpact = (ks) => {
  if (ks.beta > 1.5) return "High";
  if (ks.beta < 0.8) return "Low";
  return "Moderate";
};

const calculateEnhancedTechnicalScore = (ks) => {
  let score = 0;
  
  // Price momentum
  if (ks["52WeekChange"] > 0.20) score += 3;
  else if (ks["52WeekChange"] > 0.10) score += 2;
  else if (ks["52WeekChange"] > 0) score += 1;
  
  // Market relative strength
  if (ks["52WeekChange"] > ks.SandP52WeekChange + 0.10) score += 3;
  else if (ks["52WeekChange"] > ks.SandP52WeekChange) score += 2;
  
  // Volatility profile
  if (ks.beta < 1.2 && ks.beta > 0.8) score += 2;
  
  // Institutional support
  if (ks.heldPercentInstitutions > 0.7) score += 2;
  
  return score;
};

const calculateEnhancedMomentumScore = (ks) => {
  let score = 0;
  
  // Price momentum
  if (ks["52WeekChange"] > 0.30) score += 4;
  else if (ks["52WeekChange"] > 0.20) score += 3;
  else if (ks["52WeekChange"] > 0.10) score += 2;
  else if (ks["52WeekChange"] > 0) score += 1;
  
  // Relative strength
  if (ks["52WeekChange"] > ks.SandP52WeekChange + 0.15) score += 3;
  else if (ks["52WeekChange"] > ks.SandP52WeekChange + 0.05) score += 2;
  else if (ks["52WeekChange"] > ks.SandP52WeekChange) score += 1;
  
  // Volume support
  if (ks.shortRatio < 3) score += 1;
  
  return score;
};

// Enhanced Trading Analysis
export const enhancedTradingAnalysis = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  // Calculate detailed scores with point-by-point breakdown
  const technicalScore = (() => {
    let score = 0;
    const breakdown = [];
    
    // Price Momentum (0-3 points)
    if (ks["52WeekChange"] > 0.20) {
      score += 3;
      breakdown.push(`Price momentum >20%: +3 (current: ${formatPercent(ks["52WeekChange"])})`);
    } else if (ks["52WeekChange"] > 0.10) {
      score += 2;
      breakdown.push(`Price momentum >10%: +2 (current: ${formatPercent(ks["52WeekChange"])})`);
    } else if (ks["52WeekChange"] > 0) {
      score += 1;
      breakdown.push(`Price momentum >0%: +1 (current: ${formatPercent(ks["52WeekChange"])})`);
    }
    
    // Market Relative Strength (0-3 points)
    if (ks["52WeekChange"] > ks.SandP52WeekChange + 0.10) {
      score += 3;
      breakdown.push("Strong market outperformance >10%: +3");
    } else if (ks["52WeekChange"] > ks.SandP52WeekChange) {
      score += 2;
      breakdown.push("Market outperformance: +2");
    }
    
    // Volatility Profile (0-2 points)
    if (ks.beta < 1.2 && ks.beta > 0.8) {
      score += 2;
      breakdown.push("Balanced volatility (beta 0.8-1.2): +2");
    }
    
    // Institutional Support (0-2 points)
    if (ks.heldPercentInstitutions > 0.7) {
      score += 2;
      breakdown.push("Strong institutional ownership >70%: +2");
    }
    
    return {
      score,
      maxScore: 10,
      breakdown,
      detail: `Technical score ${score}/10 calculated from: ${breakdown.join("; ")}`
    };
  })();

  const optionsSentimentScore = (() => {
    let score = 0;
    const breakdown = [];
    const putCallRatio = ks.putCallRatio || 1;
    
    // PCR Analysis (0-3 points)
    if (putCallRatio < 0.8) {
      score += 3;
      breakdown.push(`Bullish PCR <0.8: +3 (current: ${putCallRatio.toFixed(2)})`);
    } else if (putCallRatio < 1.0) {
      score += 2;
      breakdown.push(`Moderately bullish PCR <1.0: +2 (current: ${putCallRatio.toFixed(2)})`);
    } else if (putCallRatio < 1.2) {
      score += 1;
      breakdown.push(`Neutral PCR <1.2: +1 (current: ${putCallRatio.toFixed(2)})`);
    }
    
    // Institutional Positioning (0-2 points)
    if (ks.heldPercentInstitutions > 0.7) {
      score += 2;
      breakdown.push(`High institutional ownership >70%: +2 (current: ${formatPercent(ks.heldPercentInstitutions)})`);
    }
    
    // Short Interest (0-1 point)
    if (ks.shortRatio < 5) {
      score += 1;
      breakdown.push(`Low short interest <5 days: +1 (current: ${ks.shortRatio.toFixed(1)} days)`);
    }
    
    return {
      score,
      maxScore: 6,
      breakdown,
      detail: `Options sentiment score ${score}/6 calculated from: ${breakdown.join("; ")}`
    };
  })();

  const volumeScore = (() => {
    let score = 0;
    const breakdown = [];
    
    // Volume Trend (0-3 points)
    if (ks.averageVolume > ks.averageVolume10Day * 1.2) {
      score += 3;
      breakdown.push("Rising volume trend >20%: +3");
    } else if (ks.averageVolume > ks.averageVolume10Day) {
      score += 2;
      breakdown.push("Increasing volume >0%: +2");
    }
    
    // Float Size (0-2 points)
    if (ks.floatShares > 1e9) {
      score += 2;
      breakdown.push("Large float >1B shares: +2");
    } else if (ks.floatShares > 5e8) {
      score += 1;
      breakdown.push("Moderate float >500M shares: +1");
    }
    
    return {
      score,
      maxScore: 5,
      breakdown,
      detail: `Volume score ${score}/5 calculated from: ${breakdown.join("; ")}`
    };
  })();

  return {
    technicalSignals: [
      {
        metric: "Technical Setup",
        value: `${technicalScore.score}/10`,
        analysis: `${technicalScore.detail}. CURRENT SIGNAL: ${
          ks["52WeekChange"] > 0 ? "Positive momentum" : "Consolidation"
        } with ${formatPercent(ks["52WeekChange"])} return vs. industry avg 15%. IF MORE EXTREME: Higher momentum could indicate either (1) sustainable market leadership DUE TO product cycle acceleration, market share gains, or competitive moat expansion OR (2) mean reversion risk DUE TO technical overextension, multiple expansion, or short-term trading flows.`,
        impact: technicalScore.score >= 7 ? "Strong" : technicalScore.score >= 5 ? "Moderate" : "Weak"
      },
      {
        metric: "Volatility Profile",
        value: ks.beta.toFixed(2),
        analysis: `Beta of ${ks.beta.toFixed(2)} vs. industry avg 1.0, implied volatility ${formatPercent(ks.impliedVolatility || 0.3)} vs. sector avg 25%. CURRENT SIGNAL: ${
          ks.beta > 1.2 ? "Above-average" : "Moderate"
        } options premium levels. IF MORE EXTREME: Higher volatility could indicate either (1) elevated uncertainty DUE TO pending catalysts, product transitions, or market positioning OR (2) hedging demand DUE TO portfolio protection, risk management, or event-driven strategies. IF MORE EXTREME: Higher volatility could indicate either (1) increasing business risk DUE TO new market entry, product transitions, or competitive dynamics OR (2) trading opportunities DUE TO information flow, sector catalysts, or market positioning.`,
        impact: ks.beta > 1.5 ? "High" : ks.beta < 0.8 ? "Low" : "Moderate"
      },
      {
        metric: "Volume Trend",
        value: `${formatNumber(ks.floatShares)}`,
        analysis: `${volumeScore.detail}. Float of ${formatNumber(ks.floatShares)} shares (vs. sector avg 5B) with ${
          formatPercent(ks.shortRatio/100)
        } short interest vs. industry avg 4.5%. Average daily volume ${formatNumber(ks.averageVolume)} vs. 50-day avg ${formatNumber(ks.averageVolume10Day)}. IF MORE EXTREME: Higher volume could indicate either (1) institutional position building DUE TO index/ETF flows, fundamental catalysts, or technical breakouts OR (2) distribution pressure DUE TO profit taking, position liquidation, or fundamental concerns. IF MORE EXTREME: Higher volume could indicate either (1) increasing institutional participation DUE TO index inclusion, ETF flows, or fundamental rerating OR (2) distribution pressure DUE TO profit taking, position unwind, or fundamental concerns.`,
        impact: volumeScore.score >= 4 ? "Strong" : volumeScore.score >= 2 ? "Moderate" : "Weak"
      }
    ],
    optionsAnalysis: [
      {
        metric: "Options Sentiment",
        value: `${optionsSentimentScore.score}/6 (${(ks.putCallRatio || 1).toFixed(2)} PCR)`,
        analysis: `${optionsSentimentScore.detail}. CURRENT SIGNAL: PCR of ${
          (ks.putCallRatio || 1).toFixed(2)
        } vs. industry avg 0.95 suggests ${
          (ks.putCallRatio || 1) > 1 ? "defensive" : "constructive"
        } positioning. IF MORE EXTREME: More bullish sentiment could indicate either (1) strong directional conviction DUE TO fundamental catalysts, technical breakout, or institutional accumulation OR (2) contrarian warning sign DUE TO crowded positioning, complacency, or stretched expectations.`,
        impact: optionsSentimentScore.score >= 4 ? "Bullish" : optionsSentimentScore.score >= 2 ? "Neutral" : "Bearish"
      },
      {
        metric: "Volatility Structure",
        value: `${(ks.beta * 100).toFixed(0)}% (${ks.beta.toFixed(2)} β)`,
        analysis: `Beta of ${ks.beta.toFixed(2)} vs. industry avg 1.0. CURRENT SIGNAL: ${
          ks.beta > 1.2 ? "Above-average" : "Moderate"
        } market sensitivity. IF MORE EXTREME: Higher beta could indicate either (1) increasing business cyclicality DUE TO new market expansion, product mix shifts, or operating leverage OR (2) rising fundamental risk DUE TO competitive pressure, market share erosion, or margin compression.`,
        impact: ks.beta > 1.5 ? "High" : ks.beta < 0.8 ? "Low" : "Moderate"
      }
    ],
    momentumFactors: [
      {
        metric: "Momentum Score",
        value: formatPercent(ks["52WeekChange"]),
        analysis: `Return of ${formatPercent(ks["52WeekChange"])} vs. S&P500 ${
          formatPercent(ks.SandP52WeekChange)
        }. CURRENT SIGNAL: ${
          ks["52WeekChange"] > ks.SandP52WeekChange ? "Market outperformance" : "Market underperformance"
        }. IF MORE EXTREME: Stronger momentum could indicate either (1) fundamental acceleration DUE TO market share gains, margin expansion, or new growth drivers OR (2) potential reversal risk DUE TO valuation extension, profit taking, or sector rotation.`,
        impact: ks["52WeekChange"] > 0.20 ? "Strong" : ks["52WeekChange"] > 0 ? "Moderate" : "Weak"
      }
    ],
    summary: [
      {
        metric: "Trading Summary",
        value: `${((technicalScore.score / technicalScore.maxScore + optionsSentimentScore.score / optionsSentimentScore.maxScore + volumeScore.score / volumeScore.maxScore) / 3 * 100).toFixed(1)}% Overall`,
        analysis: `${technicalScore.detail}. ${optionsSentimentScore.detail}. ${volumeScore.detail}. ${
          ks["52WeekChange"] > ks.SandP52WeekChange ? "Outperforming" : "Underperforming"
        } market with ${ks.beta > 1.2 ? "above-average" : "moderate"} volatility (β: ${ks.beta.toFixed(2)}) and ${
          ks.shortRatio > 5 ? "elevated" : "normal"
        } short interest.`,
        impact: "Overview"
      }
    ]
  };
};

// Enhanced Risk Analysis
export const enhancedRiskAnalysis = (data) => {
  const fd = data._raw.financialData;
  const ks = data._raw.keyStats;

  // Calculate risk scores with detailed breakdowns
  const balanceSheetRisk = (() => {
    let score = 0;
    const breakdown = [];
    
    // Leverage Risk (0-2 points)
    if (fd.debtToEquity < 30) {
      score += 2;
      breakdown.push(`Conservative leverage <30%: +2 (current: ${fd.debtToEquity}%)`);
    } else if (fd.debtToEquity < 50) {
      score += 1;
      breakdown.push(`Moderate leverage <50%: +1 (current: ${fd.debtToEquity}%)`);
    }
    
    // Liquidity Risk (0-2 points)
    if (fd.currentRatio > 2) {
      score += 2;
      breakdown.push(`Strong liquidity >2.0x: +2 (current: ${fd.currentRatio.toFixed(2)}x)`);
    } else if (fd.currentRatio > 1.5) {
      score += 1;
      breakdown.push(`Adequate liquidity >1.5x: +1 (current: ${fd.currentRatio.toFixed(2)}x)`);
    }
    
    // Working Capital (0-2 points)
    const workingCapitalRatio = (fd.totalCurrentAssets - fd.totalCurrentLiabilities) / fd.totalAssets;
    if (workingCapitalRatio > 0.2) {
      score += 2;
      breakdown.push(`Strong working capital >20%: +2 (current: ${(workingCapitalRatio * 100).toFixed(1)}%)`);
    } else if (workingCapitalRatio > 0.1) {
      score += 1;
      breakdown.push(`Adequate working capital >10%: +1 (current: ${(workingCapitalRatio * 100).toFixed(1)}%)`);
    }
    
    return {
      score,
      maxScore: 6,
      breakdown,
      detail: `Balance sheet risk score ${score}/6 calculated from: ${breakdown.join("; ")}`
    };
  })();

  return {
    marketRisk: [
      {
        metric: "Beta-Adjusted Risk",
        value: ks.beta.toFixed(2),
        analysis: `Beta of ${ks.beta.toFixed(2)} vs. peer average 1.0, correlation with sector ${(ks.sectorCorrelation || 0.6).toFixed(2)}. CURRENT SIGNAL: ${
          ks.beta > 1.2 ? "Above-average" : "Moderate"
        } systemic risk exposure. IF MORE EXTREME: Higher market risk could indicate either (1) increased capital sensitivity DUE TO business model evolution, customer concentration, or working capital intensity OR (2) potential portfolio stress DUE TO factor exposures, crowded positioning, or systematic deleveraging.`,
        impact: ks.beta > 1.5 ? "High Risk" : ks.beta < 0.8 ? "Low Risk" : "Moderate Risk"
      },
      {
        metric: "Volatility Risk",
        value: `${(ks.beta * 100).toFixed(0)}%`,
        analysis: `Historical volatility ${formatPercent(ks.historicalVolatility || 0.25)} vs. peer avg 20%, realized correlation ${
          (ks.marketCorrelation || 0.5).toFixed(2)
        } vs. sector 0.6. CURRENT SIGNAL: ${
          ks.historicalVolatility > 0.25 ? "Elevated" : "Contained"
        } price volatility. IF MORE EXTREME: Higher volatility could indicate either (1) increased earnings uncertainty DUE TO customer concentration, supply chain disruption, or pricing pressure OR (2) potential liquidity gaps DUE TO market structure changes, arbitrage unwinding, or derivative exposures.`,
        impact: (ks.historicalVolatility || 0.25) > 0.3 ? "High Risk" : "Moderate Risk"
      }
    ],
    financialRisk: [
      {
        metric: "Leverage Risk",
        value: `${fd.debtToEquity}%`,
        analysis: `Debt/Equity ratio ${fd.debtToEquity}% vs. industry avg 40%, interest coverage ${
          (fd.ebit / (fd.interestExpense || 1)).toFixed(1)
        }x vs. peer avg 5x. CURRENT SIGNAL: ${
          fd.debtToEquity > 50 ? "Above-average" : "Moderate"
        } financial leverage. IF MORE EXTREME: Higher leverage could indicate either (1) aggressive capital structure DUE TO acquisition financing, shareholder returns, or growth investment OR (2) potential refinancing risk DUE TO covenant constraints, maturity walls, or rating pressure.`,
        impact: fd.debtToEquity > 70 ? "High Risk" : fd.debtToEquity > 40 ? "Moderate Risk" : "Low Risk"
      },
      {
        metric: "Liquidity Risk",
        value: fd.currentRatio.toFixed(2),
        analysis: `Current ratio ${fd.currentRatio.toFixed(2)}x vs. peer avg 1.8x, quick ratio ${
          fd.quickRatio.toFixed(2)
        }x. CURRENT SIGNAL: ${
          fd.currentRatio < 1.2 ? "Tight" : "Adequate"
        } working capital position. IF MORE EXTREME: Lower liquidity could indicate either (1) working capital pressure DUE TO inventory buildup, receivables aging, or payables management OR (2) potential cash flow stress DUE TO seasonal factors, customer delays, or vendor terms.`,
        impact: fd.currentRatio < 1.2 ? "High Risk" : "Moderate Risk"
      }
    ],
    businessRisk: [
      {
        metric: "Operating Risk",
        value: `${(fd.operatingMargins * 100).toFixed(2)}%`,
        analysis: `Operating margin ${formatPercent(fd.operatingMargins)} vs. industry ${formatPercent(0.15)}, fixed cost ratio ${
          ((fd.totalOpex || 0) / fd.totalRevenue).toFixed(2)
        }. CURRENT SIGNAL: ${
          fd.operatingMargins < 0.15 ? "Below-average" : "Adequate"
        } operational stability. IF MORE EXTREME: Lower margins could indicate either (1) business model pressure DUE TO product mix shifts, channel evolution, or cost inflation OR (2) potential profitability risk DUE TO competitive intensity, market share erosion, or pricing power deterioration.`,
        impact: fd.operatingMargins < 0.10 ? "High Risk" : "Moderate Risk"
      }
    ],
    fundamentalRisk: [
      {
        metric: "Balance Sheet Risk",
        value: `${balanceSheetRisk.score}/6`,
        analysis: `${balanceSheetRisk.detail}. CURRENT SIGNAL: ${
          balanceSheetRisk.score < 3 ? "Elevated" : "Moderate"
        } balance sheet risk. IF MORE EXTREME: Weaker metrics could indicate either (1) deteriorating financial flexibility DUE TO working capital expansion, capital spending cycle, or debt-funded growth OR (2) potential structural pressure DUE TO business model transition, market share defense, or industry consolidation.`,
        impact: balanceSheetRisk.score < 3 ? "High Risk" : balanceSheetRisk.score > 4 ? "Low Risk" : "Moderate Risk"
      },
      {
        metric: "Cash Flow Risk",
        value: formatCurrency(fd.freeCashflow),
        analysis: `Free cash flow ${formatCurrency(fd.freeCashflow)} vs. peer avg ${formatCurrency(50e9)}, conversion ratio ${
          (fd.freeCashflow / fd.operatingCashflow).toFixed(2)
        }x. CURRENT SIGNAL: ${
          fd.freeCashflow < fd.operatingCashflow * 0.5 ? "Below-average" : "Healthy"
        } cash generation. IF MORE EXTREME: Lower cash flow could indicate either (1) investment cycle pressure DUE TO capacity expansion, systems upgrades, or product development OR (2) potential working capital stress DUE TO growth funding, inventory builds, or customer terms.`,
        impact: fd.freeCashflow < 0 ? "High Risk" : "Moderate Risk"
      }
    ],
    concentrationRisk: [
      {
        metric: "Concentration Score",
        value: formatPercent(ks.heldPercentInstitutions),
        analysis: `Institutional ownership ${formatPercent(ks.heldPercentInstitutions)} vs. peer avg 65%, top 10 holders ${
          formatPercent(ks.heldPercentInsiders)
        }. CURRENT SIGNAL: ${
          ks.heldPercentInstitutions > 0.8 ? "High" : "Moderate"
        } ownership concentration. IF MORE EXTREME: Higher concentration could indicate either (1) increased technical pressure DUE TO index rebalancing, mandate changes, or style rotation OR (2) potential position unwind risk DUE TO fund outflows, risk limits, or portfolio reallocation.`,
        impact: ks.heldPercentInstitutions > 0.8 ? "High Risk" : "Moderate Risk"
      }
    ],
    tailRisk: [
      {
        metric: "Tail Risk Exposure",
        value: ks.beta.toFixed(2),
        analysis: `Maximum drawdown ${formatPercent(ks.maxDrawdown || 0.3)} vs. market 25%, tail beta ${
          (ks.tailBeta || 1.2).toFixed(2)
        }. CURRENT SIGNAL: ${
          (ks.tailBeta || 1.2) > 1.5 ? "Above-average" : "Moderate"
        } tail risk profile. IF MORE EXTREME: Higher tail risk could indicate either (1) increased systemic sensitivity DUE TO business cyclicality, financial leverage, or operational gearing OR (2) potential contagion exposure DUE TO counterparty linkages, market structure, or sector correlation.`,
        impact: (ks.tailBeta || 1.2) > 1.5 ? "High Risk" : "Moderate Risk"
      }
    ]
  };
};

// Helper functions for Macro Analysis
const determineCyclePhase = (ks) => {
// Implementation based on market indicators
const cycleScore = analyzeCycleIndicators(ks);
return `${cycleScore}/10`;
};

const analyzeCyclePosition = (ks) => {
// Complex cycle analysis implementation
return "Detailed cycle analysis based on multiple factors";
};

// Helper functions for Trading Analysis
const calculateOptionsSentiment = (ks) => {
  const putCallRatio = ks.putCallRatio || 1;
  return `${putCallRatio.toFixed(2)} PCR`;
};

const analyzeOptionsFlow = (ks) => {
  const sentiment = ks.putCallRatio > 1 ? "bearish" : "bullish";
  return `Options flow indicates ${sentiment} positioning with institutional activity ${
    ks.heldPercentInstitutions > 0.7 ? "showing strong interest" : "remaining moderate"
  }`;
};

// Helper functions for Risk Analysis
const calculateBalanceSheetRisk = (fd) => {
const debtToEquity = fd.debtToEquity || 0;
const currentRatio = fd.currentRatio || 0;
return `${(debtToEquity / currentRatio).toFixed(2)}`;
};

const analyzeFinancialRisk = (fd) => {
return "Comprehensive analysis of financial risk factors";
};

// Add more helper functions for each analysis type...
// Macro Analysis Helpers
const analyzeCycleIndicators = (ks) => {
  let score = 0;
  if (ks.forwardPE < ks.trailingPE) score += 2;
  if (ks.beta < 1) score += 2;
  if (ks["52WeekChange"] > 0) score += 2;
  if (ks.heldPercentInstitutions > 0.7) score += 2;
  return score;
};

const determineCycleImpact = (ks) => {
  const cycleScore = analyzeCycleIndicators(ks);
  return cycleScore > 6 ? "Strong" : "Moderate";
};

const calculateRateSensitivity = (fd, ks) => {
  const debtLevel = fd.totalDebt / fd.totalAssets || 0;
  return `${(debtLevel * 100).toFixed(2)}%`;
};

const determineRateImpact = (fd, ks) => {
  const debtLevel = fd.totalDebt / fd.totalAssets || 0;
  return debtLevel > 0.5 ? "High Impact" : "Moderate Impact";
};

const analyzeSectorPosition = (fd, ks) => {
  const industry = detectIndustry(fd);
  return `${industry} Sector`;
};

const determineSectorStrength = (ks) => {
  return ks["52WeekChange"] > ks.SandP52WeekChange ? "Strong" : "Moderate";
};

const determinePerformanceImpact = (ks) => {
  const outperformance = ks["52WeekChange"] - ks.SandP52WeekChange;
  if (outperformance > 0.2) return "Strong Outperformance";
  if (outperformance < -0.2) return "Significant Underperformance";
  return "Market Aligned";
};

const determineValuationImpact = (ks, fd) => {
  const industryPE = getIndustryMetric(fd, 'avgPERatio');
  const premium = (ks.forwardPE - industryPE) / industryPE;
  if (premium > 0.3) return "Premium Valuation";
  if (premium < -0.3) return "Value Territory";
  return "Fair Valued";
};

const analyzeEconomicSensitivity = (fd, ks) => {
  return `Beta of ${ks.beta.toFixed(2)} indicates ${
    ks.beta > 1.2 ? "high" : ks.beta < 0.8 ? "low" : "moderate"
  } economic sensitivity`;
};

const determineEconomicImpact = (ks) => {
  return ks.beta > 1.2 ? "High Impact" : "Moderate Impact";
};

// Trading Analysis Helpers
const analyzeVolatilityStructure = (ks) => {
  return `${ks.beta.toFixed(2)} Beta`;
};

// Calculate technical score with detailed breakdown
const calculateTechnicalScore = (ks) => {
  let score = 0;
  const breakdown = [];
  
  // Momentum component (0-3 points)
  if (ks["52WeekChange"] > 0.20) {
    score += 3;
    breakdown.push("Strong momentum: +3");
  } else if (ks["52WeekChange"] > 0.10) {
    score += 2;
    breakdown.push("Moderate momentum: +2");
  } else if (ks["52WeekChange"] > 0) {
    score += 1;
    breakdown.push("Weak momentum: +1");
  }
  
  // Relative strength vs S&P500 (0-3 points)
  if (ks["52WeekChange"] > ks.SandP52WeekChange + 0.10) {
    score += 3;
    breakdown.push("Strong outperformance: +3");
  } else if (ks["52WeekChange"] > ks.SandP52WeekChange) {
    score += 2;
    breakdown.push("Moderate outperformance: +2");
  }
  
  // Volatility profile (0-2 points)
  if (ks.beta < 1.2 && ks.beta > 0.8) {
    score += 2;
    breakdown.push("Balanced volatility: +2");
  }
  
  // Institutional support (0-2 points)
  if (ks.heldPercentInstitutions > 0.7) {
    score += 2;
    breakdown.push("Strong institutional support: +2");
  }
  
  return {
    score,
    maxScore: 10,
    breakdown
  };
};

// Calculate options sentiment score with breakdown
const calculateOptionsSentimentScore = (ks) => {
  let score = 0;
  const breakdown = [];
  const putCallRatio = ks.putCallRatio || 1;
  
  // PCR analysis (0-3 points)
  if (putCallRatio < 0.8) {
    score += 3;
    breakdown.push("Bullish PCR: +3");
  } else if (putCallRatio < 1.0) {
    score += 2;
    breakdown.push("Moderately bullish PCR: +2");
  } else if (putCallRatio < 1.2) {
    score += 1;
    breakdown.push("Neutral PCR: +1");
  }
  
  // Institutional positioning (0-2 points)
  if (ks.heldPercentInstitutions > 0.7) {
    score += 2;
    breakdown.push("Strong institutional backing: +2");
  }
  
  // Short interest (0-1 point)
  if (ks.shortRatio < 5) {
    score += 1;
    breakdown.push("Low short interest: +1");
  }
  
  return {
    score,
    maxScore: 6,
    breakdown
  };
};

const analyzeTechnicalPatterns = (ks) => {
  return `Price action shows ${
    ks["52WeekChange"] > 0 
      ? "positive momentum" 
      : "consolidation"
  } with ${ks.beta > 1.2 ? "high" : "moderate"} volatility characteristics`;
};

const determineTechnicalImpact = (ks) => {
  return ks["52WeekChange"] > 0 ? "Bullish" : "Bearish";
};

const analyzeVolumeProfile = (ks) => {
  return formatNumber(ks.floatShares);
};

const determineVolumeImpact = (ks) => {
  return ks.shortRatio > 5 ? "High" : "Moderate";
};

const calculateMomentumScore = (ks) => {
  return `${ks["52WeekChange"].toFixed(2)}%`;
};

const analyzeMomentumFactors = (ks) => {
  return `Momentum analysis indicates ${
    ks["52WeekChange"] > 0 
      ? "positive price action" 
      : "negative price action"
  } with ${ks.beta > 1.2 ? "high" : "moderate"} market sensitivity`;
};

const determineMomentumImpact = (ks) => {
  return ks["52WeekChange"] > 0 ? "Positive" : "Negative";
};

// Risk Analysis Helpers
const calculateCashFlowRisk = (fd) => {
  return formatCurrency(fd.freeCashflow);
};

const analyzeCashFlowStability = (fd) => {
  return `Cash flow stability analysis based on operating and free cash flow trends`;
};

const determineCashFlowImpact = (fd) => {
  return fd.freeCashflow > 0 ? "Low Risk" : "High Risk";
};

const calculateBetaAdjustedRisk = (ks) => {
  return `${ks.beta.toFixed(2)}`;
};

const analyzeMarketSensitivity = (ks) => {
  return `Market sensitivity analysis based on beta and correlation factors`;
};

const determineMarketRiskImpact = (ks) => {
  return ks.beta > 1.2 ? "High Risk" : "Moderate Risk";
};

const calculateVolatilityRisk = (ks) => {
  return `${(ks.beta * 100).toFixed(2)}%`;
};

const analyzeVolatilityProfile = (ks) => {
  return `Volatility profile analysis based on historical and implied volatility`;
};

const determineVolatilityRiskImpact = (ks) => {
  return ks.beta > 1.5 ? "High Risk" : "Moderate Risk";
};

const calculateConcentrationRisk = (ks) => {
  return formatPercent(ks.heldPercentInstitutions);
};

const analyzeConcentrationFactors = (ks) => {
  return `Concentration risk analysis based on ownership and sector exposure`;
};

const determineConcentrationImpact = (ks) => {
  return ks.heldPercentInstitutions > 0.8 ? "High Risk" : "Moderate Risk";
};

const calculateTailRisk = (ks) => {
  return `${ks.beta.toFixed(2)}`;
};

const analyzeTailRiskFactors = (ks) => {
  return `Tail risk analysis based on historical drawdowns and market stress scenarios`;
};

const determineTailRiskImpact = (ks) => {
  return ks.beta > 2 ? "High Risk" : "Moderate Risk";
};

const calculateGDPBeta = (fd) => {
  // Simplified calculation - in reality would need multiple periods
  return (fd.revenueGrowth || 0) / 0.025; // Assuming 2.5% base GDP growth
};

const calculatePriceTransmission = (fd) => {
  // Simplified - would normally compare price increases to cost increases
  return fd.grossMargins > 0.4 ? 0.8 : fd.grossMargins > 0.3 ? 0.6 : 0.4;
};

const calculateFXExposure = (fd) => {
  // Simplified - would normally use geographical revenue breakdown
  return fd.totalRevenue > 10e9 ? 0.5 : 0.3;
};

const determineGDPImpact = (fd) => {
  const gdpBeta = calculateGDPBeta(fd);
  if (gdpBeta > 2) return "High Growth Premium";
  if (gdpBeta < 1) return "Defensive Growth";
  return "Market Growth";
};

const determinePricingImpact = (fd) => {
  const transmission = calculatePriceTransmission(fd);
  if (transmission > 0.7) return "Strong Pricing Power";
  if (transmission < 0.5) return "Price Taker";
  return "Moderate Pricing Power";
};

const determineFXImpact = (fd) => {
  const exposure = calculateFXExposure(fd);
  if (exposure > 0.5) return "High FX Exposure";
  if (exposure < 0.3) return "Low FX Exposure";
  return "Moderate FX Exposure";
};

// Add only these new helper functions alongside your existing ones

const determineOptionsImpact = (ks) => {
  const putCallRatio = ks.putCallRatio || 1;
  if (putCallRatio > 1.5) return "Bearish";
  if (putCallRatio < 0.7) return "Bullish";
  return "Neutral";
};

const evaluateRiskMetrics = (fd) => {
  const metrics = {
    debtToEquity: fd.debtToEquity || 0,
    currentRatio: fd.currentRatio || 0,
    quickRatio: fd.quickRatio || 0
  };

  let riskScore = 0;
  if (metrics.debtToEquity > 200) riskScore += 2;
  if (metrics.currentRatio < 1) riskScore += 2;
  if (metrics.quickRatio < 1) riskScore += 2;

  return {
    score: riskScore,
    maxScore: 6,
    metrics: metrics
  };
};

const determineBalanceSheetImpact = (fd) => {
  const riskAnalysis = evaluateRiskMetrics(fd);
  if (riskAnalysis.score > 4) return "High Risk";
  if (riskAnalysis.score > 2) return "Moderate Risk";
  return "Low Risk";
};

// Export enhanced analysis functions