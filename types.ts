
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: string;
  peRatio?: number;
  volume?: string;
  high52w?: number;
  low52w?: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketOverview {
  indices: MarketIndex[];
  topGainers: { name: string; symbol: string; price: string; change: string }[];
  mostActive: { name: string; symbol: string; price: string; change: string; volume?: string }[];
  marketSentiment: string;
}

export interface AnalysisResult {
  currentPrice: string;
  priceChange: string;
  summary: string;
  technicalAnalysis: {
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    support: number[];
    resistance: number[];
    indicators: string[];
  };
  fundamentalAnalysis: {
    intrinsicValue: string;
    valuationStatus: 'UNDERVALUED' | 'OVERVALUED' | 'FAIR';
    peRatio: string;
    eps: string;
    dividendYield: string;
    managementQuality: string;
    competitivePosition: string;
    analystVerdict: string;
  };
  sentimentAnalysis: {
    score: number; // 0-100
    label: string; // e.g., "طمع شديد", "خوف", "محايد"
    summary: string;
    keyOpinions: string[];
  };
  financialMetrics: {
    label: string;
    value: string;
  }[];
  sources: { title: string; uri: string }[];
}

export interface PricePoint {
  date: string;
  price: number;
}
