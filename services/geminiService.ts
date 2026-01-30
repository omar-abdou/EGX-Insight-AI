
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, MarketOverview } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeStock = async (symbol: string): Promise<AnalysisResult> => {
  const prompt = `
    ابحث عن البيانات المباشرة والتقارير المالية والأخبار الأخيرة لسهم ${symbol} في البورصة المصرية (EGX). 
    استخدم محرك بحث جوجل للوصول إلى أحدث البيانات من TradingView, Investing.com, Yahoo Finance, Thndr، ومنصات التواصل الاجتماعي والمنتديات المالية المصرية.
    
    يجب أن يتضمن التحليل ثلاثة أقسام رئيسية:
    
    1. التحليل الفني (Technical): السعر الحالي، التغير، نقاط الدعم والمقاومة، والمؤشرات الفنية (RSI, Moving Averages).
    2. التحليل الأساسي (Fundamental): القيمة الجوهرية، مكرر الربحية (P/E)، ربحية السهم (EPS)، توزيعات الأرباح، تقييم الإدارة.
    3. تحليل المشاعر (Sentiment): قياس "مزاج السوق" (خوف vs طمع)، ملخص للآراء السائدة في الأخبار ومنصات التداول، وتحديد درجة التفاؤل/التشاؤم برقم من 0 إلى 100.
    
    النتيجة يجب أن تكون JSON باللغة العربية حصراً.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentPrice: { type: Type.STRING },
            priceChange: { type: Type.STRING },
            summary: { type: Type.STRING },
            technicalAnalysis: {
              type: Type.OBJECT,
              properties: {
                signal: { type: Type.STRING, enum: ['BUY', 'SELL', 'NEUTRAL'] },
                support: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                resistance: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                indicators: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['signal', 'support', 'resistance', 'indicators']
            },
            fundamentalAnalysis: {
              type: Type.OBJECT,
              properties: {
                intrinsicValue: { type: Type.STRING },
                valuationStatus: { type: Type.STRING, enum: ['UNDERVALUED', 'OVERVALUED', 'FAIR'] },
                peRatio: { type: Type.STRING },
                eps: { type: Type.STRING },
                dividendYield: { type: Type.STRING },
                managementQuality: { type: Type.STRING },
                competitivePosition: { type: Type.STRING },
                analystVerdict: { type: Type.STRING }
              },
              required: ['intrinsicValue', 'valuationStatus', 'peRatio', 'eps', 'analystVerdict']
            },
            sentimentAnalysis: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER, description: "درجة المشاعر من 0 (خوف شديد) إلى 100 (طمع شديد)" },
                label: { type: Type.STRING, description: "تسمية الحالة (مثلاً: طمع، خوف، محايد)" },
                summary: { type: Type.STRING, description: "ملخص لمشاعر المتداولين" },
                keyOpinions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "أبرز الآراء والتوجهات الحالية" }
              },
              required: ['score', 'label', 'summary', 'keyOpinions']
            },
            financialMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                }
              }
            }
          },
          required: ['currentPrice', 'priceChange', 'summary', 'technicalAnalysis', 'fundamentalAnalysis', 'sentimentAnalysis', 'financialMetrics']
        }
      },
    });

    const result = JSON.parse(response.text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "المصدر",
      uri: chunk.web?.uri || "#"
    })) || [];

    return { ...result, sources };
  } catch (error) {
    console.error("Error analyzing stock:", error);
    throw error;
  }
};

export const getMarketOverview = async (): Promise<MarketOverview> => {
  const prompt = `
    ابحث عن القيم الحالية لمؤشرات البورصة المصرية (EGX30, EGX70, EGX100) اليوم.
    استخرج أيضاً:
    1. قائمة بأكثر 3 أسهم ارتفاعاً اليوم (Top Gainers).
    2. قائمة بأكثر 3 أسهم نشاطاً من حيث قيمة التداول أو الحجم (Most Active Stocks).
    3. ملخص قصير لحالة السوق الحالية.
    يجب أن تشمل البيانات السعر، رمز السهم، والتغير المئوي.
    النتيجة JSON فقط.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            indices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  change: { type: Type.NUMBER },
                  changePercent: { type: Type.NUMBER }
                }
              }
            },
            topGainers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  symbol: { type: Type.STRING },
                  price: { type: Type.STRING },
                  change: { type: Type.STRING }
                }
              }
            },
            mostActive: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  symbol: { type: Type.STRING },
                  price: { type: Type.STRING },
                  change: { type: Type.STRING },
                  volume: { type: Type.STRING }
                }
              }
            },
            marketSentiment: { type: Type.STRING }
          },
          required: ['indices', 'topGainers', 'mostActive', 'marketSentiment']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching market overview:", error);
    return {
      indices: [],
      topGainers: [],
      mostActive: [],
      marketSentiment: "فشل في جلب البيانات الحالية للسوق."
    };
  }
};
