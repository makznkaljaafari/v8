
import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PageLayout } from './ui/Layout';
import { getFinancialForecast } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { exportService } from '../services/exportService';
import { shareToWhatsApp, formatDailyClosingReport } from '../services/shareService';

// Recharts components loaded lazily
const Recharts = {
  ResponsiveContainer: lazy(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer }))),
  AreaChart: lazy(() => import('recharts').then(mod => ({ default: mod.AreaChart }))),
  Area: lazy(() => import('recharts').then(mod => ({ default: mod.Area }))),
  XAxis: lazy(() => import('recharts').then(mod => ({ default: mod.XAxis }))),
  YAxis: lazy(() => import('recharts').then(mod => ({ default: mod.YAxis }))),
  Tooltip: lazy(() => import('recharts').then(mod => ({ default: mod.Tooltip }))),
  CartesianGrid: lazy(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })))
};

const Reports: React.FC = () => {
  const { navigate, addNotification } = useUI();
  const { user } = useAuth();
  const { sales, expenses, purchases, vouchers, categories, theme } = useData();
  
  const [forecast, setForecast] = useState<string>('جاري تحليل البيانات سحابياً...');
  const [isLoadingForecast, setIsLoadingForecast] = useState(true);
  const [financialStats, setFinancialStats] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        const stats = await dataService.getFinancialSummary(start.toISOString(), end.toISOString());
        setFinancialStats(stats || []);
      } catch (e) {
        console.error("Stats Error:", e);
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchForecast = async () => {
      try {
        const aiForecast = await getFinancialForecast(sales, expenses, categories);
        setForecast(aiForecast);
      } catch (e) {
        setForecast("تعذر التحليل حالياً، يرجى المحاولة لاحقاً.");
      } finally {
        setIsLoadingForecast(false);
      }
    };

    fetchStats();
    fetchForecast();
  }, [sales, expenses, categories]);

  const chartData = useMemo(() => {
    return sales.slice(0, 15).reverse().map((s: any, i: number) => ({
      name: `ع ${i+1}`,
      sales: s.total,
      date: new Date(s.date).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' })
    }));
  }, [sales]);

  const handleExportData = (type: 'sales' | 'purchases' | 'expenses') => {
    const dataMap = { sales, purchases, expenses };
    exportService.exportToCSV(dataMap[type], `تقرير_${type}`);
    addNotification("تم التصدير ✅", `تم تجهيز ملف CSV لبيانات ${type}`, "success");
  };

  const handleDailyShare = () => {
    const reportText = formatDailyClosingReport({
      sales, expenses, purchases, vouchers,
      agencyName: user?.agency_name || 'وكالة الشويع'
    });
    shareToWhatsApp(reportText);
    addNotification("تقرير الواتساب 💬", "تم تجهيز ملخص الإغلاق اليومي", "info");
  };

  return (
    <PageLayout title="المحلل المالي الذكي" onBack={() => navigate('dashboard')}>
      <div className="space-y-12 lg:space-y-20 pb-32 max-w-7xl mx-auto w-full">
        
        {/* Statistics Grid - Adapts to 1, 2, or 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 px-1">
           {isLoadingStats ? (
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-16 rounded-[3rem] flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 shadow-2xl animate-pulse">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6"></div>
                   <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded-full mb-4"></div>
                   <div className="h-12 w-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                </div>
              ))
           ) : financialStats.map((s, idx) => (
                <div key={idx} className={`p-10 lg:p-14 rounded-[3.5rem] shadow-2xl border-2 transition-all group overflow-hidden relative ${
                  theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-sky-50 shadow-sky-900/5'
                }`}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                   
                   <div className="flex justify-between items-start mb-10 relative z-10">
                      <div>
                         <span className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-widest shadow-lg">{s.currency}</span>
                         <p className="text-[10px] lg:text-sm font-black text-slate-400 mt-5 uppercase tracking-tighter">الربح التشغيلي (30 يوم)</p>
                      </div>
                      <div className="text-left">
                         <p className={`font-black text-3xl lg:text-5xl tabular-nums ${Number(s.net_profit) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {Number(s.net_profit) >= 0 ? '+' : ''}{Math.round(Number(s.net_profit)).toLocaleString()}
                         </p>
                      </div>
                   </div>
                   
                   <div className="space-y-4 lg:space-y-6 relative z-10">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-5 lg:p-8 rounded-2xl lg:rounded-3xl border border-slate-100 dark:border-white/5">
                         <span className="text-[10px] lg:text-xs font-black text-slate-500 uppercase">المبيعات</span>
                         <span className="font-black text-xl lg:text-3xl tabular-nums text-slate-900 dark:text-slate-100">{Math.round(Number(s.total_sales)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/10 p-5 lg:p-8 rounded-2xl lg:rounded-3xl border border-rose-100 dark:border-rose-900/20">
                         <span className="text-[10px] lg:text-xs font-black text-rose-500 uppercase">المصاريف</span>
                         <span className="font-black text-xl lg:text-3xl tabular-nums text-rose-600 dark:text-rose-400">{Math.round(Number(s.total_expenses)).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
              ))}
        </div>

        {/* AI Insight - Horizontal Layout for Desktop */}
        <section className={`p-10 lg:p-20 rounded-[4rem] lg:rounded-[6rem] text-white shadow-3xl relative overflow-hidden border-4 ${
          theme === 'dark' ? 'bg-slate-950 border-white/5 shadow-emerald-500/5' : 'bg-slate-900 border-white/10 shadow-indigo-900/20'
        }`}>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
             <div className="w-28 h-28 lg:w-56 lg:h-56 bg-white/10 rounded-[2.5rem] lg:rounded-[4rem] flex items-center justify-center text-6xl lg:text-[8rem] shadow-inner border border-white/10 animate-pulse-glow">🔮</div>
             <div className="text-center lg:text-right flex-1 space-y-6 lg:space-y-10">
                <h3 className="font-black text-3xl lg:text-7xl leading-tight">الرؤية الاستراتيجية الذكية</h3>
                <div className="bg-white/5 backdrop-blur-2xl p-8 lg:p-14 rounded-[2.5rem] lg:rounded-[4rem] border border-white/10 mt-8">
                   {isLoadingForecast ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-6">
                         <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                         <p className="font-black text-sm text-indigo-300 uppercase tracking-widest">تحليل سحابي جاري...</p>
                      </div>
                   ) : (
                      <p className="font-bold leading-relaxed text-lg lg:text-3xl whitespace-pre-line text-indigo-50 italic">
                         "{forecast}"
                      </p>
                   )}
                </div>
             </div>
          </div>
        </section>

        {/* Charts & Actions - Multi column desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
           <div className="lg:col-span-2 space-y-10">
              <section className={`p-10 lg:p-16 rounded-[3.5rem] shadow-2xl border-2 ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-sky-900/5'
              }`}>
                <h3 className="font-black text-xl lg:text-3xl text-slate-800 dark:text-white mb-12 flex items-center gap-4">
                  <span className="w-4 h-4 bg-indigo-500 rounded-full animate-ping"></span>
                  اتجاه المبيعات الأخير
                </h3>
                <div className="h-96 lg:h-[500px] w-full">
                  <Suspense fallback={<div className="h-full flex items-center justify-center opacity-20">تحميل البيانات...</div>}>
                    <Recharts.ResponsiveContainer width="100%" height="100%">
                      <Recharts.AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Recharts.CartesianGrid strokeDasharray="10 10" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                        <Recharts.XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: '900'}} />
                        <Recharts.YAxis hide />
                        <Recharts.Tooltip 
                          contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', background: theme === 'dark' ? '#0f172a' : '#fff' }} 
                        />
                        <Recharts.Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={8} fillOpacity={1} fill="url(#salesGradient)" />
                      </Recharts.AreaChart>
                    </Recharts.ResponsiveContainer>
                  </Suspense>
                </div>
              </section>
           </div>
           
           <div className="flex flex-col gap-8">
              <button 
                onClick={handleDailyShare}
                className="flex-1 bg-emerald-600 text-white p-10 lg:p-16 rounded-[3.5rem] font-black text-xl lg:text-3xl shadow-2xl flex flex-col items-center justify-center gap-8 active:scale-95 hover:bg-emerald-500 transition-all border-b-8 border-emerald-800"
              >
                <span className="text-6xl lg:text-9xl">📊</span>
                إغلاق اليوم (واتساب)
              </button>
              <button 
                onClick={() => handleExportData('sales')}
                className="flex-1 bg-slate-900 dark:bg-slate-800 text-white p-10 lg:p-16 rounded-[3.5rem] font-black text-xl lg:text-3xl shadow-2xl flex flex-col items-center justify-center gap-8 active:scale-95 hover:bg-slate-700 transition-all border-b-8 border-slate-950"
              >
                <span className="text-6xl lg:text-9xl">📥</span>
                تصدير Excel/CSV
              </button>
           </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default Reports;
