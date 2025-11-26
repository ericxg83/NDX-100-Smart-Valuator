
import { GoogleGenAI } from "@google/genai";
import { MarketData, MOCK_HISTORY_LENGTH } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to generate a history array that ends exactly at the current real price
// This ensures the chart visually matches the real-time data we just fetched.
const generateHistoryFromRealData = (currentPrice: number, currentPe: number) => {
  const history = [];
  let price = currentPrice;
  let pe = currentPe;
  const today = new Date();
  
  // We generate backwards from today
  for (let i = 0; i < MOCK_HISTORY_LENGTH; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    history.unshift({
      date: date.toISOString().split('T')[0],
      price: Number(price.toFixed(2)),
      pe: Number(pe.toFixed(2))
    });

    // Random walk backwards
    // If today is higher, yesterday was likely lower (or higher, it's random, but we want a trend)
    // We use a slight trend bias to simulate the recent bull market if price is high
    const volatility = price * 0.015; // 1.5% volatility
    const change = (Math.random() - 0.48) * volatility; 
    price -= change;
    
    // Adjust PE roughly with price
    pe = (price / currentPrice) * currentPe + (Math.random() - 0.5);
  }
  return history;
};

// Helper to parse numeric strings like "24,873.85" or "24873.85"
const parseValue = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove commas, remove % sign, remove + sign
  const clean = val.replace(/,/g, '').replace(/%/g, '').replace(/\+/g, '').trim();
  return parseFloat(clean) || 0;
};

export const fetchMarketData = async (): Promise<MarketData> => {
  try {
    // Use Gemini with Google Search to get REAL data
    // UPDATED PROMPT: Strictly enforces selection of Current Price over Previous Close
    const prompt = `
      You are a specialized financial data extractor. 
      Your Task: Retrieve the current LIVE price for "Nasdaq 100 Index (NDX)" using Google Search.

      STRICT SOURCE RULE:
      - Look at the "Google Finance" card or the primary search summary.
      - **Do NOT** use Yahoo Finance, CNBC, or other news links if the Google summary is available.
      - **Do NOT** return multiple conflicting values.

      CRITICAL ACCURACY FIX - READ CAREFULLY:
      1. **Target**: The BIGGEST, BOLDEST number on the screen.
      2. **Trap to Avoid**: The "Previous Close" (Prev Close) is usually smaller and labeled. **DO NOT USE PREVIOUS CLOSE**.
      3. **Logic Check**: 
         - If the market is Open, the Price changes every second.
         - If the market is Closed, the "Price" is the last trade, which is different from "Previous Close" (yesterday's close).
         - Example: If Google shows "24,873" (Large) and "Prev Close: 24,239" (Small), you MUST return **24873**.
      
      Required Fields:
      1. Current Price (The Big Number)
      2. Change Percent (e.g. +1.5%)
      3. PE Ratio (Price to Earnings)
      4. 52 Week High
      5. 52 Week Low

      Return a JSON object with keys: "price", "changePercent", "peRatio", "high52Week", "low52Week", "volume".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    // Extract JSON block using regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    let liveData: any = {};
    if (jsonMatch) {
      try {
        liveData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn("JSON parsing failed, falling back to mock");
        throw e;
      }
    } else {
      throw new Error("No JSON found in AI response");
    }

    // Extract ONLY the top source URL to ensure consistency (single source of truth)
    const allChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    let bestSource: { title: string; uri: string } | null = null;

    // Try to find Google Finance or the first available web source
    const googleSource = allChunks.find(c => c.web?.title?.includes("Google") || c.web?.uri?.includes("google"));
    if (googleSource && googleSource.web) {
        bestSource = { title: "Google Finance", uri: googleSource.web.uri || "https://www.google.com/finance" };
    } else if (allChunks.length > 0 && allChunks[0].web) {
        // Fallback to the very first source provided by Grounding
        bestSource = { title: allChunks[0].web.title || "Search Result", uri: allChunks[0].web.uri || "#" };
    }

    const sourceUrls = bestSource ? [bestSource] : [];

    const price = parseValue(liveData.price);
    const peRatio = parseValue(liveData.peRatio) || 32.5; // Default fallback if PE not found
    
    // Heuristic for PE Percentile (Historical NDX PE ranges roughly 20-40)
    // 20 is 0%, 40 is 100%
    const pePercentile = Math.min(100, Math.max(0, ((peRatio - 22) / (38 - 22)) * 100));

    return {
      price: price,
      changePercent: parseValue(liveData.changePercent),
      peRatio: peRatio,
      pePercentile: Number(pePercentile.toFixed(1)),
      pbRatio: Number((peRatio / 6.5).toFixed(2)), // Rough estimation based on sector avg
      high52Week: parseValue(liveData.high52Week),
      low52Week: parseValue(liveData.low52Week),
      volume: liveData.volume?.toString() || "N/A",
      lastUpdated: new Date().toLocaleString('zh-CN'),
      history: generateHistoryFromRealData(price, peRatio),
      sourceUrls: sourceUrls
    };

  } catch (error) {
    console.error("Failed to fetch real data:", error);
    // Fallback Mock Data if search fails entirely
    const fallbackPrice = 24500; 
    return {
      price: fallbackPrice,
      changePercent: 0.5,
      peRatio: 30,
      pePercentile: 50,
      pbRatio: 5,
      high52Week: 26000,
      low52Week: 17000,
      volume: "Error Fetching",
      lastUpdated: "数据获取失败",
      history: generateHistoryFromRealData(fallbackPrice, 30),
      sourceUrls: []
    };
  }
};
