
import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  title: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
}

const GlobalSearch: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    customers, suppliers, categories, sales, vouchers, navigate, theme 
  } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const matchedPages = [
      { id: 'reports', label: 'التقارير والتحليلات', icon: '📊', page: 'reports' },
      { id: 'debts', label: 'الميزانية والديون', icon: '⚖️', page: 'debts' },
      { id: 'settings', label: 'الإعدادات', icon: '⚙️', page: 'settings' },
      { id: 'activity-log', label: 'سجل الرقابة', icon: '🛡️', page: 'activity-log' },
      { id: 'waste', label: 'سجل التالف', icon: '🥀', page: 'waste' },
    ].filter(p => p.label.includes(q));

    const matchedCustomers = (customers || []).filter((c: any) => c.name.includes(q) || c.phone?.includes(q)).slice(0, 5);
    const matchedCategories = (categories || []).filter((c: any) => c.name.includes(q)).slice(0, 5);
    const matchedSales = (sales || []).filter((s: any) => s.customer_name.includes(q) || s.total.toString().includes(q)).slice(0, 5);
    const matchedVouchers = (vouchers || []).filter((v: any) => v.person_name.includes(q) || v.amount.toString().includes(q)).slice(0, 5);

    return { matchedPages, matchedCustomers, matchedCategories, matchedSales, matchedVouchers };
  }, [query, customers, categories, sales, vouchers]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-start justify-center p-4 lg:p-10 transition-all duration-300"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" />
      
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden flex flex-col max-h-[80vh] lg:max-h-[60vh] animate-in slide-in-from-top-10 fade-in duration-500 origin-top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 lg:p-10 border-b border-slate-100 dark:border-white/5 flex items-center gap-4 lg:gap-6 sticky top-0 bg-inherit z-10">
          <span className="text-3xl lg:text-5xl text-sky-500">🔍</span>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="ابحث عن عميل أو فاتورة..."
            className="flex-1 bg-transparent border-none outline-none text-lg lg:text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-all"
            style={{ fontSize: '16px' }} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose} 
            className="w-10 h-10 lg:w-14 lg:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm lg:text-xl font-black hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-sm"
          >✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar space-y-8">
          {!query.trim() ? (
            <div className="text-center py-12 lg:py-20 opacity-30 flex flex-col items-center gap-4">
              <span className="text-6xl lg:text-8xl animate-float">📊</span>
              <p className="text-sm lg:text-xl font-black italic text-slate-400">البحث السحابي جاهز يا مدير...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {results && results.matchedPages.length > 0 && (
                <section>
                  <h4 className="text-[9px] lg:text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 px-3">الوصول السريع</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.matchedPages.map(p => (
                      <button key={p.id} onClick={() => { navigate(p.page as any); onClose(); }} className="w-full flex items-center gap-4 p-4 lg:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-indigo-600 hover:text-white transition-all text-right shadow-sm group">
                        <span className="text-2xl lg:text-3xl">{p.icon}</span>
                        <span className="font-black text-xs lg:text-lg">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {results && results.matchedCustomers.length > 0 && (
                <section>
                  <h4 className="text-[9px] lg:text-xs font-black text-sky-500 uppercase tracking-widest mb-3 px-3">العملاء</h4>
                  <div className="space-y-2">
                    {results.matchedCustomers.map((c: any) => (
                      <button key={c.id} onClick={() => { navigate('account-statement', { personId: c.id, personType: 'عميل' }); onClose(); }} className="w-full flex items-center justify-between p-4 lg:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-sky-600 hover:text-white transition-all text-right shadow-sm group">
                        <div className="flex items-center gap-4">
                           <span className="text-xl lg:text-2xl">👤</span>
                           <div>
                              <p className="font-black text-xs lg:text-lg">{c.name}</p>
                              <p className="text-[9px] lg:text-xs font-bold opacity-50 tabular-nums">{c.phone}</p>
                           </div>
                        </div>
                        <span className="text-xs opacity-40">📑 كشف حساب</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {results && results.matchedSales.length > 0 && (
                <section>
                  <h4 className="text-[9px] lg:text-xs font-black text-orange-500 uppercase tracking-widest mb-3 px-3">الفواتير الأخيرة</h4>
                  <div className="space-y-2">
                    {results.matchedSales.map((s: any) => (
                      <button key={s.id} onClick={() => { navigate('invoice-view', { sale: s }); onClose(); }} className="w-full flex items-center justify-between p-4 lg:p-5 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-orange-600 hover:text-white transition-all text-right shadow-sm group">
                        <div className="flex items-center gap-4">
                           <span className="text-xl lg:text-2xl">📄</span>
                           <span className="font-black text-xs lg:text-lg">{s.customer_name}</span>
                        </div>
                        <span className="font-black text-xs lg:text-xl tabular-nums">{s.total.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CloudStatus = memo(() => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
      <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter">Cloud Live</span>
    </div>
  );
});

const DigitalClock = memo(() => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = time.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="flex flex-col items-end justify-center px-2 lg:px-4 border-r border-white/10 ml-2">
      <div className="text-[10px] lg:text-[16px] font-black tabular-nums text-white dark:text-emerald-400 leading-none">{timeString}</div>
    </div>
  );
});

export const PageLayout: React.FC<LayoutProps> = ({ title, headerExtra, children, onBack }) => {
  const { navigate, notifications, isLoggedIn } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg transition-colors duration-500 w-full relative">
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Modern Fixed Header with Settings Re-added */}
      <div className="z-40 w-full flex justify-center px-2 lg:px-10 pt-2 lg:pt-8 shrink-0">
        <header className="w-full max-w-7xl bg-sky-600 dark:bg-slate-900 rounded-[1.5rem] lg:rounded-[3rem] border border-white/10 shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between px-3 lg:px-10 h-14 lg:h-24 gap-2 lg:gap-8">
            
            {/* Left Section: Back/Brand */}
            <div className="flex items-center gap-1.5 lg:gap-6 min-w-fit max-w-[30%]">
              {onBack && (
                <button onClick={onBack} className="w-8 h-8 lg:w-14 lg:h-14 rounded-lg bg-white/20 flex items-center justify-center text-base lg:text-2xl text-white active:scale-90 transition-all">
                  <span>→</span>
                </button>
              )}
              <div className="flex flex-col truncate">
                <h1 className="text-[11px] lg:text-2xl font-black text-white dark:text-emerald-400 truncate leading-none mb-0.5 lg:mb-1">{title}</h1>
                {isLoggedIn && <CloudStatus />}
              </div>
            </div>

            {/* Middle Section: Integrated Search Trigger */}
            <div className="flex-1 max-w-md">
               <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full h-8 lg:h-14 bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 rounded-xl lg:rounded-2xl border border-white/10 flex items-center px-2 lg:px-5 gap-2 lg:gap-4 transition-all active:scale-95 group"
               >
                  <span className="text-base lg:text-2xl opacity-40 group-hover:scale-110 transition-transform">🔍</span>
                  <span className="text-[9px] lg:text-base font-bold text-white/30 truncate">ابحث هنا...</span>
               </button>
            </div>
            
            {/* Right Section: Actions & Settings Icon */}
            <div className="flex items-center gap-1 lg:gap-4 min-w-fit justify-end">
              <div className="hidden sm:block">
                <DigitalClock />
              </div>
              
              <div className="flex items-center gap-1 lg:gap-4">
                {headerExtra}
                
                {/* Notifications Button */}
                <button 
                  onClick={() => navigate('notifications')} 
                  className="relative w-8 h-8 lg:w-14 lg:h-14 rounded-lg bg-white/20 flex items-center justify-center text-sm lg:text-2xl text-white active:scale-90 transition-all"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-3 h-3 lg:w-5 lg:h-5 bg-rose-500 rounded-full border border-sky-600 flex items-center justify-center text-[7px] lg:text-[10px] font-black">
                       {unreadCount}
                    </span>
                  )}
                </button>

                {/* Settings Button */}
                <button 
                  onClick={() => navigate('settings')} 
                  className="w-8 h-8 lg:w-14 lg:h-14 rounded-lg bg-white/20 flex items-center justify-center text-sm lg:text-2xl text-white active:scale-90 transition-all"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="flex-1 w-full px-2 lg:px-16 pt-4 lg:pt-8 pb-32 overflow-y-auto no-scrollbar flex flex-col items-center">
        <div className="w-full max-w-7xl page-enter h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
