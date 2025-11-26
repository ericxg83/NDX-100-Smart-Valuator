import React from 'react';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onRefresh, loading }) => {
  return (
    <header className="flex items-center justify-between py-6 border-b border-slate-800 mb-8">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <LayoutDashboard className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NDX-100 智能估值</h1>
          <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Nasdaq 100 Valuation System</p>
        </div>
      </div>
      
      <button 
        onClick={onRefresh}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
          ${loading 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-slate-800 hover:bg-slate-700 text-white hover:text-indigo-400 border border-slate-700'}
        `}
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? '更新数据中...' : '刷新数据'}
      </button>
    </header>
  );
};

export default Header;