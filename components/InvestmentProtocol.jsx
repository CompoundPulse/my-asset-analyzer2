import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, BookOpen, BarChart2, Building2, Users2, Brain, Shield, Rocket } from 'lucide-react';

const InvestmentProtocol = () => {
  const sections = [
    {
      title: "1. Define Your Investment Philosophy",
      icon: <BookOpen className="w-8 h-8 mb-4" />,
      content: [
        "Value Investing (Buffett & Munger): Buy fundamentally strong businesses at a discount",
        "Speculation & Macro Investing (Soros): Bet on macroeconomic trends and market inefficiencies",
        "Quant & Technical Analysis: Use patterns, statistics, and algorithms for trading decisions"
      ],
      subsections: [
        {
          title: "Sources of Research",
          items: [
            "Federal Reserve reports",
            "IMF documentation",
            "SEC filings",
            "Industry whitepapers",
            "Investor calls"
          ]
        }
      ]
    },
    {
      title: "2. Industry & Macro Analysis",
      icon: <Building2 className="w-8 h-8 mb-4" />,
      content: [
        "Economic Indicators: Analyze GDP growth, interest rates, inflation, and fiscal policies",
        "Market Cycles: Identify whether the economy is in expansion, contraction, or transition",
        "Sector Trends: Choose industries with strong future prospects",
        "Regulatory Impact: Watch government policies affecting industries (e.g., energy regulations, AI restrictions)"
      ]
    },
    {
      title: "3. Company Analysis",
      icon: <BarChart2 className="w-8 h-8 mb-4" />,
      content: [
        "Business Model & Competitive Advantage: Identify moats (Brand, cost leadership, network effects) and sustainable growth drivers",
        "Financial Health: Analyze income statements (Revenue growth, Profit margins, ROE > 15%), balance sheets (D/E < 0.5), and cash flows",
        "Management Quality: Evaluate leadership track record, insider transactions, and corporate governance",
        "Valuation Metrics: Study P/E, P/B, EV/EBITDA ratios and DCF models for intrinsic value"
      ],
      subsections: [
        {
          title: "Financial Analysis Deep Dive",
          items: [
            "Income Statement: Track 5-10 year revenue growth, profit margins (Gross, Operating, Net), and ROE",
            "Balance Sheet: Analyze debt ratios, cash reserves, and asset quality",
            "Cash Flow: Monitor free cash flow growth and operating cash flow vs. net income",
            "Management Review: Study shareholder letters, earnings calls, and insider transactions"
          ]
        }
      ]
    },
    {
      title: "4. Market Sentiment & Behavioral Analysis",
      icon: <Brain className="w-8 h-8 mb-4" />,
      content: [
        "Monitor institutional investor movements and order flow patterns",
        "Analyze media narratives, market psychology, and hype cycles",
        "Study options market sentiment through open interest, put-call ratios, and IV",
        "Watch for irrational optimism or fear using Soros-style reflexivity principles"
      ]
    },
    {
      title: "5. Advanced Trading Considerations",
      icon: <TrendingUp className="w-8 h-8 mb-4" />,
      content: [
        "Options Trading: Use options for asymmetric bets, analyze IV crush, delta, and gamma exposure",
        "Technical Analysis: Study moving averages, RSI, MACD, Bollinger Bands, and institutional order flow",
        "Quantitative Models: Implement statistical arbitrage strategies and machine learning signals",
        "Backtesting: Validate trading strategies with historical data"
      ]
    },
    {
      title: "6. Risk Management & Exit Strategy",
      icon: <Shield className="w-8 h-8 mb-4" />,
      content: [
        "Buffett Approach: Buy & hold unless fundamentals break",
        "Soros Method: Cut losses fast if thesis is wrong, use strict risk limits",
        "Position Sizing: Concentrated bets for high conviction (Buffett) vs. diversified positions for traders",
        "Stop-Loss Implementation: Set clear exit points and stick to them"
      ]
    },
    {
      title: "7. Execution & Monitoring",
      icon: <Rocket className="w-8 h-8 mb-4" />,
      content: [
        "Time entries based on valuation (Buffett's dips) or macro shifts (Soros)",
        "Track fundamental changes through earnings and industry developments",
        "Monitor market conditions and adapt thesis as needed",
        "Maintain disciplined execution of strategy"
      ],
      subsections: [
        {
          title: "Style Integration",
          items: [
            "Long-Term Investors: Focus on Buffett/Munger deep value & management quality",
            "Macro & Speculators: Apply Soros' reflexivity & global trends",
            "Active Traders: Combine quant tools, technical analysis, and options strategies"
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8">
      <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-white flex items-center gap-4 justify-center">
            <Users2 className="w-10 h-10" />
            Investment Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sections.map((section, index) => (
              <Card key={index} className="bg-black/40 border-white/10 hover:bg-black/60 transition-all p-6">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-white flex flex-col items-center mb-6">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-white/90 text-lg leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                  {section.subsections && section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="mt-6">
                      <h4 className="text-white font-semibold mb-3">{subsection.title}</h4>
                      <ul className="space-y-2">
                        {subsection.items.map((item, i) => (
                          <li key={i} className="text-white/80 text-base leading-relaxed pl-4">
                            ◦ {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentProtocol;