
import React, { memo } from 'react';
import { useApp } from '../context/AppContext';

const BottomNav: React.FC = () => {
  const { currentPage, navigate } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
    { id: 'sales', label: 'المبيعات', icon: '💰' },
    { id: 'add-sale', label: 'إضافة', icon: '＋', primary: true },
    { id: 'ai-advisor', label: 'الذكاء', icon: '🤖' },
    { id: 'customers', label: 'العملاء', icon: '👥' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 safe-bottom pointer-events-none lg:hidden">
      <nav className="w-full max-w-md bg-white dark:bg-[#020617] h-14 flex justify-around items-center rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] pointer-events-auto border-t border-slate-100 dark:border-white/10">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => navigate(item.id as any)}
            className={`flex flex-col items-center justify-center transition-all relative flex-1 h-full ${
              item.primary ? 'pb-0' : 'active:scale-90'
            }`}
          >
            {item.primary ? (
              <div className="relative -top-5">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-700 rounded-xl flex items-center justify-center text-2xl text-white shadow-xl border-2 border-white dark:border-slate-900 transform active:scale-90">
                  {item.icon}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center pt-1">
                <span className={`text-lg transition-all ${currentPage === item.id ? 'scale-110 text-sky-600 dark:text-emerald-400' : 'opacity-40 text-slate-500'}`}>
                  {item.icon}
                </span>
                <span className={`text-[7px] font-black tracking-tighter uppercase mt-0.5 ${currentPage === item.id ? 'text-sky-700 dark:text-emerald-400' : 'opacity-40 text-slate-500'}`}>
                  {item.label}
                </span>
                {currentPage === item.id && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-600 dark:bg-emerald-400"></div>
                )}
              </div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default memo(BottomNav);
