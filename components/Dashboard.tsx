
import React, { useMemo, useState, memo } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PageLayout } from './ui/Layout';
import { financeService } from '../services/financeService';

const ServiceButton = memo(({ s, onClick, theme }: any) => (
  <button 
    onClick={() => onClick(s.id)}
    className={`flex flex-col items-center justify-center gap-1.5 lg:gap-6 p-4 lg:p-10 rounded-[1.5rem] lg:rounded-[3.5rem] border transition-all active:scale-95 hover:shadow-2xl hover:-translate-y-1 ${
      theme === 'dark' ? 'bg-slate-900/40 border-white/5 hover:bg-slate-800 backdrop-blur-md' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'
    }`}
  >
    <div className={`w-10 h-10 lg:w-20 lg:h-20 rounded-2xl lg:rounded-[2.5rem] flex items-center justify-center text-xl lg:text-5xl shadow-lg ${s.bg}`}>
      {s.icon}
    </div>
    <span className={`text-[10px] lg:text-lg font-black tracking-tighter text-center ${s.text}`}>{s.label}</span>
  </button>
));

const Dashboard: React.FC = () => {
  const { navigate, theme, toggleTheme } = useUI();
  const { user } = useAuth();
  const { sales, purchases, vouchers, customers, suppliers, expenses } = useData();
  const [isMasked, setIsMasked] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<'YER' | 'SAR' | 'OMR'>('YER');

  const budgetSummary = useMemo(() => {
    return financeService.getGlobalBudgetSummary(customers, suppliers, sales, purchases, vouchers, expenses);
  }, [customers, suppliers, sales, purchases, vouchers, expenses]);

  const currentSummary = useMemo(() => {
    return budgetSummary.find(s => s.currency === activeCurrency) || { 
      assets: 0, liabilities: 0, cash: 0, net: 0, currency: activeCurrency,
      customerDebts: 0, supplierDebts: 0, customerCredits: 0, supplierCredits: 0
    };
  }, [budgetSummary, activeCurrency]);

  const mainServices = useMemo(() => [
    { id: 'sales', label: 'المبيعات', icon: '💰', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-900 dark:text-emerald-400' },
    { id: 'purchases', label: 'المشتريات', icon: '📦', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-400' },
    { id: 'vouchers', label: 'السندات', icon: '📥', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-900 dark:text-indigo-400' },
    { id: 'debts', label: 'الميزانية', icon: '⚖️', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-900 dark:text-rose-400' },
    { id: 'customers', label: 'العملاء', icon: '👥', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-400' },
    { id: 'categories', label: 'المخزون', icon: '🌿', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-900 dark:text-teal-400' },
    { id: 'returns', label: 'المرتجعات', icon: '🔄', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-900 dark:text-red-400' },
    { id: 'waste', label: 'التالف', icon: '🥀', bg: 'bg-rose-200 dark:bg-rose-900/20', text: 'text-rose-900 dark:text-rose-400' },
    { id: 'expenses', label: 'المصاريف', icon: '💸', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-900 dark:text-amber-400' },
    { id: 'suppliers', label: 'الموردين', icon: '🚛', bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-900 dark:text-slate-400' },
    { id: 'activity-log', label: 'الرقابة', icon: '🛡️', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
    { id: 'reports', label: 'التقارير', icon: '📊', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-400' },
  ], []);

  const formatAmount = (val: number) => isMasked ? '••••••' : val.toLocaleString();

  return (
    <PageLayout 
      title={user?.agency_name || 'وكالة الشويع'}
      headerExtra={
        <button onClick={toggleTheme} className="w-8 h-8 lg:w-14 lg:h-14 rounded-lg bg-white/20 dark:bg-white/5 flex items-center justify-center text-sm lg:text-2xl text-white border border-white/10 active:scale-90 transition-all">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      }
    >
      <div className="space-y-4 lg:space-y-10 pb-6 w-full max-w-7xl mx-auto px-1">
        
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
          <div className="space-y-0.5 lg:space-y-2">
            <h2 className="text-3xl lg:text-7xl font-black text-vibrant-hero leading-tight animate-vibrant-pulse inline-block">
              أهلاً، {user?.full_name?.split(' ')[0] || 'عبدالكريم'}
            </h2>
            <p className="text-[10px] lg:text-xl font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-70">
              إدارة أعمالك بذكاء سحابي
            </p>
          </div>
          
          <div 
            onClick={() => navigate('ai-advisor')}
            className={`relative overflow-hidden p-4 lg:p-10 rounded-[2rem] lg:rounded-[3rem] shadow-lg cursor-pointer active:scale-95 transition-all border group ${
              theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/20 text-white' : 'bg-sky-50 border-sky-100 text-sky-950'
            }`}
          >
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 lg:gap-8 relative z-10">
              <div className="w-12 h-12 lg:w-20 lg:h-20 bg-indigo-600 dark:bg-indigo-500 rounded-2xl lg:rounded-[1.5rem] flex items-center justify-center text-2xl lg:text-5xl shadow-2xl border-2 border-white/20">🤖</div>
              <div className="flex-1 text-right">
                <h3 className="text-sm lg:text-2xl font-black leading-none">المحاسب الذكي</h3>
                <p className={`text-[8px] lg:text-sm font-bold mt-1 lg:mt-3 opacity-60 tracking-wider`}>اسأل Gemini عن أي قيد مالي</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview Card */}
        <div className={`relative overflow-hidden rounded-[2rem] lg:rounded-[4rem] p-6 lg:p-16 shadow-2xl transition-all border ${
          theme === 'dark' ? 'bg-slate-900 border-white/5 text-white shadow-emerald-900/5' : 'bg-white border-sky-50 text-slate-950 shadow-sky-900/5'
        }`}>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/5 to-transparent"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 lg:mb-12 gap-4">
            <div className="flex flex-col">
               <span className="text-[10px] lg:text-xl font-black uppercase tracking-[0.3em] opacity-40">الموقف المالي الحالي ({activeCurrency})</span>
            </div>
            
            {/* Currency Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl gap-1">
               {(['YER', 'SAR', 'OMR'] as const).map(cur => (
                 <button
                   key={cur}
                   onClick={() => setActiveCurrency(cur)}
                   className={`px-4 lg:px-8 py-2 rounded-xl font-black text-xs lg:text-sm transition-all ${
                     activeCurrency === cur 
                       ? 'bg-sky-600 text-white shadow-lg scale-105' 
                       : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                   }`}
                 >
                   {cur === 'YER' ? 'يمني' : cur === 'SAR' ? 'سعودي' : 'عماني'}
                 </button>
               ))}
               <div className="w-[1px] bg-slate-200 dark:bg-white/10 mx-1"></div>
               <button onClick={() => setIsMasked(!isMasked)} className="px-3 text-lg lg:text-xl opacity-40 hover:opacity-100 transition-all">{isMasked ? '👁️' : '🙈'}</button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-20">
            <div className="flex flex-col">
              <p className="text-[10px] lg:text-sm font-black text-slate-400 uppercase mb-2">إجمالي السيولة (الصندوق)</p>
              <h1 className={`text-5xl lg:text-[8rem] font-black tabular-nums tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-sky-900'}`}>
                {formatAmount(currentSummary.cash)}
              </h1>
              <p className="text-xs lg:text-2xl font-black opacity-20 mt-2 tracking-widest">{activeCurrency} CASH IN SAFE</p>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-6 lg:gap-10 border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-white/5 pt-6 lg:pt-0 lg:pr-16 w-full lg:w-auto">
              <div className="flex-1 lg:text-right">
                <p className="text-[8px] lg:text-sm font-black text-slate-400 uppercase mb-1 tracking-widest">إجمالي الأصول (ما لنا)</p>
                <p className="text-xl lg:text-5xl font-black text-emerald-500 tabular-nums">+{formatAmount(currentSummary.assets)}</p>
                <p className="text-[7px] lg:text-[10px] opacity-40 font-bold mt-1">تشمل ديون العملاء والفائض للموردين</p>
              </div>
              <div className="flex-1 lg:text-right border-r lg:border-r-0 lg:border-t border-slate-100 dark:border-white/5 pr-6 lg:pr-0 lg:pt-10">
                <p className="text-[8px] lg:text-sm font-black text-slate-400 uppercase mb-1 tracking-widest">إجمالي الخصوم (ديون علينا)</p>
                <p className="text-xl lg:text-5xl font-black text-rose-500 tabular-nums">-{formatAmount(currentSummary.liabilities)}</p>
                <p className="text-[7px] lg:text-[10px] opacity-40 font-bold mt-1">تشمل ديون الموردين ومبالغ العملاء الفائضة</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
             <span className="text-[10px] lg:text-base font-black text-slate-400 opacity-60">صافي القيمة التقديرية (سيولة + أصول - خصوم):</span>
             <span className={`text-lg lg:text-3xl font-black tabular-nums ${currentSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatAmount(currentSummary.net)} {activeCurrency}
             </span>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-10">
          {mainServices.map((s) => (
            <ServiceButton key={s.id} s={s} onClick={navigate} theme={theme} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
