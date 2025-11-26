import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
  ReferenceDot
} from 'recharts';
import { MarketData, AnalysisResult } from '../types';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, AlertCircle } from 'lucide-react';

interface Props {
  data: MarketData['history'];
  analysis: AnalysisResult | null;
}

const PriceHistoryChart: React.FC<Props> = ({ data, analysis }) => {
  // Calculate simple moving average for visual flair
  const processedData = data.map((item, index, arr) => {
    const slice = arr.slice(Math.max(0, index - 9), index + 1);
    const avg = slice.reduce((sum, curr) => sum + curr.price, 0) / slice.length;
    return { ...item, ma10: avg };
  });

  const lastPoint = processedData[processedData.length - 1];

  // Helper to determine signal visuals based on AI recommendation
  const getSignalConfig = (rec: string) => {
    switch (rec) {
      case 'STRONG_BUY': 
        return { color: '#10b981', Icon: ArrowUpCircle, label: '强力买入' }; // emerald-500
      case 'BUY': 
        return { color: '#34d399', Icon: ArrowUpCircle, label: '买入' }; // emerald-400
      case 'STRONG_SELL': 
        return { color: '#f43f5e', Icon: ArrowDownCircle, label: '清仓' }; // rose-500
      case 'SELL': 
        return { color: '#fb7185', Icon: ArrowDownCircle, label: '卖出' }; // rose-400
      default: 
        return { color: '#fbbf24', Icon: MinusCircle, label: '持有' }; // amber-400
    }
  };

  // Custom Dot Component for the signal
  const CustomSignalDot = (props: any) => {
    const { cx, cy } = props;
    if (!analysis || !cx || !cy) return null;

    const { color, Icon, label } = getSignalConfig(analysis.recommendation);
    const isStrong = analysis.recommendation.includes('STRONG');

    return (
        <g transform={`translate(${cx},${cy})`} style={{ pointerEvents: 'none' }}>
            {/* Pulsing effect for strong signals */}
            {isStrong && (
                <circle r="25" fill={color} opacity="0.2">
                    <animate attributeName="r" from="15" to="35" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
            )}
            
            {/* Main Dot Background */}
            <circle r="14" fill="#0f172a" stroke={color} strokeWidth="2" />
            
            {/* Icon via foreignObject to use Lucide React Component */}
            <foreignObject x="-10" y="-10" width="20" height="20">
                <div className="flex items-center justify-center w-full h-full text-white">
                    <Icon size={16} color={color} strokeWidth={3} />
                </div>
            </foreignObject>

            {/* Label Text */}
            <text 
                x="0" 
                y="-22" 
                textAnchor="middle" 
                fill={color} 
                fontSize="11" 
                fontWeight="bold"
                style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
            >
                {label}
            </text>
             {/* Score Text */}
             <text 
                x="0" 
                y="28" 
                textAnchor="middle" 
                fill={color} 
                fontSize="10" 
                opacity="0.8"
            >
                {analysis.score}分
            </text>
        </g>
    );
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">价格与估值趋势 (90天)</h3>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-indigo-400 rounded-full"></span> 收盘价
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-amber-400/50 rounded-full"></span> PE估值
          </span>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(str) => str.slice(5)} // Show MM-DD
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left"
              stroke="#64748b" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(val) => val.toFixed(0)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#d97706" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              hide={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="price" 
              stroke="#818cf8" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              name="Price"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="pe" 
              stroke="#fbbf24" 
              strokeWidth={1} 
              dot={false}
              strokeDasharray="5 5"
              name="PE Ratio"
              alpha={0.7}
            />

            {/* AI Signal Overlay */}
            {analysis && lastPoint && (
              <ReferenceDot 
                yAxisId="left"
                x={lastPoint.date} 
                y={lastPoint.price} 
                shape={CustomSignalDot}
                isFront={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;