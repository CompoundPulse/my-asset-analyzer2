// sections.js
import { BookOpen, Building2, BarChart2, Brain, Compass, Shield, Activity, Target, Lightbulb } from 'lucide-react';
import { 
  analyzeFinancials, 
  analyzeMarketSentiment, 
  analyzeTechnicals, 
  analyzeBusiness,
  analyzeMacro,
  analyzeTrading,
  analyzeRisk,
  analyzeMonitoring,
  analyzeSummaryDashboard
} from './completeAnalysisFramework';

import { 
  enhancedAnalyzeInvestmentStyle,
  analyzeValueMetrics,
  analyzeGrowthQuality,
  enhancedMacroAnalysis,
  enhancedTradingAnalysis,
  enhancedRiskAnalysis
} from './completeAnalysis2';

const createErrorMetrics = (error, title) => ({
  title,
  metrics: {},
  summary: `Error generating analysis: ${error.message || 'Unknown error'}`
});

const handleAnalysisError = (error, title) => {
  console.error(`Error in ${title}:`, error);
  return createErrorMetrics(error, title);
};

export const analysisSections = [
  {
    id: 'summary',
    title: "Executive Summary",
    icon: <Lightbulb className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      console.log("Summary analyze called with:", financialData);
      
      if (!financialData) {
        return {
          title: "Executive Summary",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }
      
      try {
        const metrics = analyzeSummaryDashboard(financialData);
        
        return {
          title: "Investment Summary Dashboard",
          metrics: metrics,
          summary: "Comprehensive overview of valuation, performance, and risk metrics."
        };
      } catch (error) {
        return handleAnalysisError(error, "Investment Summary Dashboard");
      }
    }
  },
  {
    id: 'investment-style',
    title: "Investment Framework",
    icon: <BookOpen className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Investment Framework",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }
      
      try {
        const metrics = enhancedAnalyzeInvestmentStyle(financialData);
        return {
          title: "Investment Framework Analysis",
          metrics: metrics,
          summary: metrics?.summary?.[0]?.analysis || "Analysis not available"
        };
      } catch (error) {
        return handleAnalysisError(error, "Investment Framework Analysis");
      }
    }
  },
  {
    id: 'macro',
    title: "Macro Analysis",
    icon: <Compass className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Macro Analysis",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }

      try {
        const basicMetrics = analyzeMacro(financialData);
        const enhancedMetrics = enhancedMacroAnalysis(financialData);
        return {
          title: "Macro & Market Analysis",
          metrics: {
            ...basicMetrics,
            ...enhancedMetrics
          },
          summary: "Comprehensive analysis of market cycles, sector trends, and macroeconomic factors."
        };
      } catch (error) {
        return handleAnalysisError(error, "Macro & Market Analysis");
      }
    }
  },
  {
    id: 'business',
    title: "Business Analysis",
    icon: <Building2 className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Business Analysis",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }

      try {
        const metrics = analyzeBusiness(financialData);
        return {
          title: "Business Analysis",
          metrics,
          summary: "Analysis of competitive position, operational efficiency, and management effectiveness."
        };
      } catch (error) {
        return handleAnalysisError(error, "Business Analysis");
      }
    }
  },
  {
    id: 'financials',
    title: "Financial Analysis",
    icon: <BarChart2 className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Financial Analysis",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }
      
      try {
        const metrics = analyzeFinancials(financialData);
        return {
          title: "Financial Analysis",
          metrics: metrics,
          summary: "Comprehensive analysis of profitability, growth, financial health, and valuation metrics with industry comparisons."
        };
      } catch (error) {
        return handleAnalysisError(error, "Financial Analysis");
      }
    }
  },
  {
    id: 'trading',
    title: "Trading Analysis",
    icon: <Activity className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Trading Analysis",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }

      try {
        const basicMetrics = analyzeTrading(financialData);
        const enhancedMetrics = enhancedTradingAnalysis(financialData);
        return {
          title: "Advanced Trading Analysis",
          metrics: {
            ...basicMetrics,
            ...enhancedMetrics
          },
          summary: "Detailed analysis of technical patterns, options sentiment, and trading dynamics."
        };
      } catch (error) {
        return handleAnalysisError(error, "Advanced Trading Analysis");
      }
    }
  },
  {
    id: 'risk',
    title: "Risk Analysis",
    icon: <Shield className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Risk Analysis",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }

      try {
        const basicMetrics = analyzeRisk(financialData);
        const enhancedMetrics = enhancedRiskAnalysis(financialData);
        return {
          title: "Risk Management Framework",
          metrics: {
            ...basicMetrics,
            ...enhancedMetrics
          },
          summary: "Comprehensive risk assessment including fundamental, market, concentration, and tail risks."
        };
      } catch (error) {
        return handleAnalysisError(error, "Risk Management Framework");
      }
    }
  },
  {
    id: 'monitoring',
    title: "Monitoring Dashboard",
    icon: <Target className="w-6 h-6" />,
    analyze: ({ financialData }) => {
      if (!financialData) {
        return {
          title: "Monitoring Dashboard",
          metrics: {},
          summary: "No financial data available for analysis"
        };
      }

      try {
        const metrics = analyzeMonitoring(financialData);
        return {
          title: "Monitoring Framework",
          metrics,
          summary: "Key metrics and indicators for ongoing monitoring and position management."
        };
      } catch (error) {
        return handleAnalysisError(error, "Monitoring Framework");
      }
    }
  },
  {
    id: 'sentiment',
    title: "Market Sentiment",
    icon: <Brain className="w-6 h-6" />,
    analyze: ({ financialData, historicalData, marketData }) => {
      if (!financialData) {
        return {
          title: "Market Sentiment",
          indicators: [],
          summary: "No financial data available for analysis"
        };
      }

      try {
        const sentiment = analyzeMarketSentiment(financialData);
        const technical = analyzeTechnicals(historicalData, marketData);
        return {
          title: "Market Sentiment Analysis",
          indicators: [...sentiment, ...technical],
          summary: "Analysis of market sentiment combining institutional positioning, technical indicators, and price action."
        };
      } catch (error) {
        return {
          title: "Market Sentiment Analysis",
          indicators: [],
          summary: `Error generating analysis: ${error.message || 'Unknown error'}`
        };
      }
    }
  }
];