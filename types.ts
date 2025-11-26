
export enum RiskLevel {
  CONSERVATIVE = "保守型",
  MODERATE = "稳健型",
  AGGRESSIVE = "激进型"
}

export interface MarketData {
  price: number;
  changePercent: number;
  peRatio: number; // Price to Earnings
  pePercentile: number; // 0-100, where current PE stands historically
  pbRatio: number; // Price to Book
  high52Week: number;
  low52Week: number;
  volume: string;
  lastUpdated: string;
  history: { date: string; price: number; pe: number }[];
  sourceUrls?: { title: string; uri: string }[];
}

export interface AnalysisResult {
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  score: number; // 0-100 Entry Score (Higher is better for buying)
  summary: string;
  reasoning: string[];
  riskWarning: string;
  strategy: string;
}

export const MOCK_HISTORY_LENGTH = 90; // 90 days of history
