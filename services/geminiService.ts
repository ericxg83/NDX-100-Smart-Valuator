import { GoogleGenAI, Type } from "@google/genai";
import { MarketData, AnalysisResult, RiskLevel } from '../types';

// Initialize Gemini Client
// Note: API Key must be provided in environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMarket = async (data: MarketData, riskLevel: RiskLevel): Promise<AnalysisResult> => {
  
  // Detailed prompt with specific scoring rules to ensure consistency
  const prompt = `
    You are a strict Quantitative Financial Analyst Algorithm.
    Your Task: Analyze the NASDAQ 100 (NDX) data and output a DETERMINISTIC investment score for a "${riskLevel}" investor.

    Input Data:
    - Current Price: ${data.price}
    - PE Ratio: ${data.peRatio} (Historical Percentile: ${data.pePercentile}%)
    - Trend (Daily): ${data.changePercent}%
    - Range: ${data.low52Week} - ${data.high52Week}

    SCORING RUBRIC (Total 100 Points) - YOU MUST FOLLOW THIS MATH:
    
    1. VALUATION SCORE (Max 40 pts):
       - If PE Percentile < 20%: +40 pts (Undervalued)
       - If PE Percentile 20-50%: +30 pts (Fair)
       - If PE Percentile 50-80%: +15 pts (Overvalued)
       - If PE Percentile > 80%: +0 pts (Bubble)
       
    2. TREND SCORE (Max 30 pts):
       - If Price > Previous Close (Green): +30 pts (Momentum is positive)
       - If Price < Previous Close (Red): +10 pts (Momentum is weak)
       - Note: For "Value Investors", a dip might actually increase the "Buy" score, but for this generic model, follow momentum slightly.
       
    3. RISK PROFILE MATCH (Max 30 pts):
       - Conservative Investor: Penalize high volatility or high PE. 
       - Aggressive Investor: Reward high momentum even if PE is high.
       - Logic:
         - If Risk=CONSERVATIVE and PE > 80%: Score 0 for this section.
         - If Risk=AGGRESSIVE and Trend is Positive: Score 30 for this section.
         - Adjust linearly for others.

    OUTPUT RULES:
    - "score": The sum of the above components.
    - "recommendation": 
       - Score > 75: "STRONG_BUY"
       - Score 60-75: "BUY"
       - Score 40-59: "HOLD"
       - Score 25-39: "SELL"
       - Score < 25: "STRONG_SELL"
    - The language must be SIMPLIFIED CHINESE (zh-CN).

    Return pure JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0, // CRITICAL: Zero temperature forces deterministic/consistent outputs
        seed: 42,       // Fixed seed for reproducibility
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: {
              type: Type.STRING,
              enum: ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"]
            },
            score: {
              type: Type.NUMBER,
              description: "Final calculated score based on the rubric."
            },
            summary: { type: Type.STRING },
            reasoning: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            riskWarning: { type: Type.STRING },
            strategy: { type: Type.STRING }
          },
          required: ["recommendation", "score", "summary", "reasoning", "riskWarning", "strategy"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback/Error object
    return {
      recommendation: "HOLD",
      score: 50,
      summary: "AI分析暂时无法连接，请稍后重试。",
      reasoning: ["API Error or Timeout"],
      riskWarning: "无法获取实时分析数据。",
      strategy: "建议观望。"
    };
  }
};