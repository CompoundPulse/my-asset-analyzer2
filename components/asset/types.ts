export interface AssetData {
    symbol: string;
    price: string;
    quantity: string;
    change: string;
    changePercent: string;
    overview: {
      marketCap?: string;
      volume?: string;
      pe?: string;
      eps?: string;
      beta?: string;
      high52?: string;
      low52?: string;
      dividend?: string;
    } | null;
  }
  
  export interface Analysis {
    totalValue: string;
    monthlyChange: string;
    riskLevel: string;
    recommendation: string;
  }
  
  export interface HistoricalDataPoint {
    date: string;
    value: number;
  }