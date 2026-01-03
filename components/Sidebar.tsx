
import React from 'react';
import { useApp } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { currentPage, navigate, logoutAction, user, isSidebarCollapsed, toggleSidebar } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
    { id: 'sales', label: 'المبيعات', icon: '💰' },
    { id: 'purchases', label: 'المشتريات', icon: '📦' },
    { id: 'vouchers', label: 'السندات', icon: '📥' },
    { id: 'debts', label: 'الميزانية', icon: '⚖️' },
    { id: 'customers', label: 'العملاء', icon: '👥' },
    { id: 'suppliers', label: 'الموردين', icon: '🚛' },
    { id: 'categories', label: 'المخزون', icon: '🌿' },
    { id: 'reports', label: 'التقارير', icon: '📊' },
    { id: 'expenses', label: 'المصاريف', icon: '💸' },
    { id: 'waste', label: 'التالف', icon: '🥀' },
    { id: 'activity-log', label: 'الرقابة', icon: '🛡️' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  ];

  return (
    <aside 
      className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-screen sticky top-0 right-0 z-50 transition-all duration-500 overflow-y-auto no-scrollbar shadow-[25px_0_60px_-15px_rgba(0,0,0,0.1)] ${isSidebarCollapsed ? 'w-24' : 'w-80'}`}
    >
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute left-4 top-10 w-10 h-10 bg-sky-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-sky-500 active:scale-90 transition-all z-50 border-4 border-white dark:border-slate-800"
      >
        <span className={`text-xl transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}`}>
          ←
        </span>
      </button>

      <div className={`p-8 lg:p-10 flex flex-col h-full transition-all duration-500 ${isSidebarCollapsed ? 'items-center' : ''}`}>
        
        {/* Logo Section */}
        <div className={`flex items-center gap-6 mb-16 group cursor-pointer transition-all duration-500 ${isSidebarCollapsed ? 'justify-center' : ''}`} onClick={() => navigate('dashboard')}>
          <div className={`bg-gradient-to-br from-sky-400 to-sky-700 dark:from-emerald-400 dark:to-emerald-800 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-all ${isSidebarCollapsed ? 'w-14 h-14 text-2xl' : 'w-18 h-18 text-3xl'}`}>🌿</div>
          {!isSidebarCollapsed && (
            <div className="text-right">
              <h1 className="font-black text-sky-900 dark:text-emerald-400 text-2xl tracking-tighter">وكالة الشويع</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">الذكاء المحاسبي</p>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id as any)}
              className={`w-full flex items-center gap-6 rounded-[1.5rem] font-black transition-all duration-300 ${isSidebarCollapsed ? 'justify-center p-4' : 'px-6 py-4 text-sm'} ${
                currentPage === item.id
                  ? 'bg-sky-600 text-white shadow-xl translate-x-[-8px]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-sky-600'
              }`}
            >
              <span className={`${isSidebarCollapsed ? 'text-3xl' : 'text-2xl'}`}>{item.icon}</span>
              {!isSidebarCollapsed && <span className="flex-1 text-right">{item.label}</span>}
              {!isSidebarCollapsed && currentPage === item.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>}
            </button>
          ))}
        </nav>

        {/* User & Logout Section */}
        <div className={`mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center text-white font-black">{user?.full_name?.[0] || 'A'}</div>
              <div className="text-right flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.full_name || 'المدير'}</p>
                <p className="text-[10px] text-slate-400 truncate italic">مشرف النظام</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => logoutAction()}
            className={`w-full flex items-center gap-6 rounded-2xl font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all ${isSidebarCollapsed ? 'justify-center p-4' : 'px-6 py-4 text-sm'}`}
          >
            <span className="text-2xl">🚪</span>
            {!isSidebarCollapsed && <span className="flex-1 text-right">تسجيل خروج</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
