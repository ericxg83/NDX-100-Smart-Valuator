import React from 'react';
import { AnalysisResult } from '../types';
import { BrainCircuit, ShieldAlert, TrendingUp, Target } from 'lucide-react';

interface Props {
  analysis: AnalysisResult | null;
  loading: boolean;
}

const AIInsight: React.FC<Props> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="h-full min-h-[400px] bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 flex flex-col items-center justify-center animate-pulse">
        <BrainCircuit className="w-12 h-12 text-slate-600 mb-4 animate-spin-slow" />
        <p className="text-slate-400 font-medium">Gemini AI 正在深度分析市场数据...</p>
        <p className="text-slate-600 text-sm mt-2">正在计算估值百分位、回撤风险与入场概率</p>
      </div>
    );
  }

  if (!analysis) return null;

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('BUY')) return 'bg-emerald-500 text-white';
    if (rec.includes('SELL')) return 'bg-rose-500 text-white';
    return 'bg-amber-500 text-white';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score <= 30) return 'text-rose-400';
    return 'text-amber-400';
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
      
      {/* Header Section */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI 智能决策报告</h3>
            <p className="text-xs text-slate-400">Based on Gemini 2.5 Flash Model</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
             <span className="block text-xs text-slate-400 uppercase tracking-wider">入场评分</span>
             <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>{analysis.score}<span className="text-sm text-slate-500">/100</span></span>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide shadow-lg ${getRecommendationColor(analysis.recommendation)}`}>
            {analysis.recommendation === 'STRONG_BUY' ? '强力买入' : 
             analysis.recommendation === 'BUY' ? '建议买入' :
             analysis.recommendation === 'HOLD' ? '观望持有' :
             analysis.recommendation === 'SELL' ? '建议卖出' : '清仓离场'}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        
        {/* Summary */}
        <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700/50">
          <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> 核心观点
          </h4>
          <p className="text-slate-300 leading-relaxed text-sm">
            {analysis.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reasoning */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">分析逻辑</h4>
            <ul className="space-y-2">
              {analysis.reasoning.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Strategy & Risk */}
          <div className="space-y-4">
             <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> 建议操作
                </h4>
                <p className="text-sm text-slate-300 bg-emerald-900/10 border border-emerald-900/30 p-3 rounded-lg">
                  {analysis.strategy}
                </p>
             </div>
             <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> 风险提示
                </h4>
                <p className="text-sm text-slate-300 bg-rose-900/10 border border-rose-900/30 p-3 rounded-lg">
                  {analysis.riskWarning}
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIInsight;