
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import PriceHistoryChart from './components/PriceHistoryChart';
import AIInsight from './components/AIInsight';
import { MarketData, AnalysisResult, RiskLevel } from './types';
import { fetchMarketData } from './services/marketService';
import { analyzeMarket } from './services/geminiService';
import { Settings, Clock, Link as LinkIcon, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.MODERATE);
  
  const loadData = useCallback(async () => {
    if (!process.env.API_KEY) {
        alert("System Error: API Key is missing.");
        return;
    }

    setLoading(true);
    // Only reset analysis if we are doing a full reload
    setAnalysis(null); 
    
    try {
      // 1. Fetch Market Data (Now uses Gemini Search)
      const data = await fetchMarketData();
      setMarketData(data);

      // 2. Analyze with Gemini
      const aiResult = await analyzeMarket(data, riskLevel);
      setAnalysis(aiResult);

    } catch (error) {
      console.error("Failed to load system:", error);
    } finally {
      setLoading(false);
    }
  }, [riskLevel]);

  // Initial load
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Handle re-analysis when risk level changes
  useEffect(() => {
      if (marketData && !loading) {
          setLoading(true);
          analyzeMarket(marketData, riskLevel).then(res => {
              setAnalysis(res);
              setLoading(false);
          });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskLevel]); 

  // Automatic Refresh at 15:00 Daily
  useEffect(() => {
    const getDelayToNext1500 = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(15, 0, 0, 0); // Set to 15:00:00 today

      if (now.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      return target.getTime() - now.getTime();
    };

    let timerId: ReturnType<typeof setTimeout>;

    const scheduleRefresh = () => {
      const delay = getDelayToNext1500();
      console.log(`System: Next auto-refresh scheduled in ${(delay / 1000 / 60).toFixed(1)} minutes`);
      
      timerId = setTimeout(() => {
        loadData();
        scheduleRefresh(); 
      }, delay);
    };

    scheduleRefresh();

    return () => clearTimeout(timerId);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <Header onRefresh={loadData} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Metrics & Chart (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard 
                title="最新价格" 
                value={marketData?.price.toLocaleString() || '---'} 
                subValue="NDX Index"
                trend={marketData && marketData.changePercent >= 0 ? 'up' : 'down'}
                trendValue={`${marketData?.changePercent}%`}
                color="indigo"
              />
              <MetricCard 
                title="市盈率 (PE)" 
                value={marketData?.peRatio.toFixed(2) || '---'} 
                subValue={`Percentile: ${marketData?.pePercentile}%`}
                color={marketData ? (marketData.pePercentile > 80 ? 'rose' : marketData.pePercentile < 30 ? 'emerald' : 'amber') : 'default'}
              />
              <MetricCard 
                title="市净率 (PB)" 
                value={marketData?.pbRatio.toFixed(2) || '---'} 
                subValue="Tech Sector Avg"
              />
              <MetricCard 
                title="52周高点" 
                value={marketData?.high52Week.toLocaleString() || '---'}
                subValue={`Low: ${marketData?.low52Week.toLocaleString()}`}
              />
            </div>

            {/* Chart */}
            {marketData && <PriceHistoryChart data={marketData.history} analysis={analysis} />}
            
            {/* Risk Settings Panel */}
             <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">投资风险偏好设置</span>
                </div>
                <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                    {(Object.values(RiskLevel) as RiskLevel[]).map((level) => (
                        <button
                            key={level}
                            onClick={() => setRiskLevel(level)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                riskLevel === level 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
             </div>

          </div>

          {/* Right Column: AI Insights (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
               <AIInsight analysis={analysis} loading={loading} />
               
               <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-xs text-slate-500 space-y-4">
                 
                 <div className="flex items-center gap-2 text-indigo-400/80">
                   <Clock className="w-3 h-3" />
                   <span>每日 15:00 系统自动刷新数据</span>
                 </div>

                 {/* Source Links (Grounding) */}
                 {marketData?.sourceUrls && marketData.sourceUrls.length > 0 && (
                   <div className="border-t border-slate-700/50 pt-3">
                     <p className="font-semibold mb-2 text-slate-400 flex items-center gap-2">
                       <LinkIcon className="w-3 h-3" /> 数据来源 (Google Search)
                     </p>
                     <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                       {marketData.sourceUrls.map((source, idx) => (
                         <li key={idx}>
                           <a 
                             href={source.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-start gap-1.5 hover:text-indigo-300 transition-colors group"
                           >
                             <ExternalLink className="w-3 h-3 mt-0.5 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                             <span className="truncate">{source.title}</span>
                           </a>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 <div>
                   <p className="font-semibold mb-1 text-slate-400">免责声明</p>
                   <p className="opacity-70">
                      本系统利用 AI 搜索引擎获取实时数据并进行分析。金融数据可能存在延迟。分析结果仅供参考，不构成投资建议。
                   </p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;