import React from 'react';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  info?: string;
  color?: 'default' | 'indigo' | 'emerald' | 'rose' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subValue, 
  trend, 
  trendValue,
  color = 'default'
}) => {
  
  const getColorClass = () => {
    switch (color) {
      case 'indigo': return 'text-indigo-400';
      case 'emerald': return 'text-emerald-400';
      case 'rose': return 'text-rose-400';
      case 'amber': return 'text-amber-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        {trend && (
           <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
             trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 
             trend === 'down' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-300'
           }`}>
             {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
             {trendValue}
           </div>
        )}
      </div>
      
      <div>
        <div className={`text-2xl font-bold ${getColorClass()}`}>
          {value}
        </div>
        {subValue && (
          <div className="text-slate-500 text-xs mt-1">{subValue}</div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;