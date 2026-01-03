
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { Purchase } from '../types';

const PurchasesList: React.FC = () => {
  const { purchases, navigate, returnPurchase, theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => p.supplier_name.includes(searchTerm) || p.qat_type.includes(searchTerm));
  }, [purchases, searchTerm]);

  return (
    <PageLayout title="سجل التوريد" onBack={() => navigate('dashboard')}>
      <div className="space-y-8 lg:space-y-12 pb-32 max-w-7xl mx-auto w-full px-1">
        
        {/* Search Bar - Responsive Padding */}
        <div className="relative group max-w-3xl mx-auto w-full px-1">
          <input 
            type="text" placeholder="ابحث باسم المورد أو الصنف..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-transparent focus:border-orange-500 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-10 pr-16 lg:pr-24 font-black text-lg lg:text-2xl text-slate-900 dark:text-white shadow-2xl transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 text-2xl lg:text-4xl opacity-20">🔍</span>
        </div>

        {/* Adaptive Grid: 1 col on mobile, 3 cols on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 px-1">
          {filteredPurchases.map((purchase) => (
            <div 
              key={purchase.id} 
              className={`p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border-2 transition-all hover:shadow-2xl hover:-translate-y-2 group ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start mb-8 lg:mb-12">
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="w-14 h-14 lg:w-20 lg:h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl lg:rounded-3xl flex items-center justify-center text-3xl lg:text-5xl shadow-inner group-hover:scale-110 transition-transform">🚛</div>
                  <div>
                    <h3 className="font-black text-xl lg:text-2xl text-slate-900 dark:text-white leading-tight">{purchase.supplier_name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] lg:text-xs font-black px-3 py-1 rounded-xl border border-orange-500/20">🌿 {purchase.qat_type}</span>
                      <span className="text-[10px] lg:text-xs font-bold text-slate-400 tabular-nums">📅 {new Date(purchase.date).toLocaleDateString('ar-YE')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl lg:text-4xl font-black text-orange-600 tabular-nums tracking-tighter">{purchase.total.toLocaleString()}</p>
                  <p className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">YER</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-white/5">
                <div className="flex gap-8 lg:gap-12">
                  <div className="flex flex-col">
                    <span className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">الكمية</span>
                    <span className="text-sm lg:text-xl font-black">{purchase.quantity} أكياس</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">الحالة</span>
                    <span className={`text-sm lg:text-xl font-black ${purchase.status === 'نقدي' ? 'text-emerald-500' : 'text-orange-500'}`}>{purchase.status}</span>
                  </div>
                </div>
                <div className="flex gap-2 lg:gap-4">
                   {!purchase.is_returned ? (
                     <button 
                       onClick={() => { if(window.confirm('إرجاع توريد؟')) returnPurchase(purchase.id) }} 
                       className="bg-rose-50 dark:bg-rose-900/30 text-rose-500 px-6 py-3 lg:px-8 lg:py-4 rounded-2xl text-[11px] lg:text-sm font-black border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                     >
                       🔄 إرجاع
                     </button>
                   ) : (
                     <span className="text-[10px] lg:text-xs font-black text-rose-500 uppercase italic bg-rose-50 dark:bg-rose-950 px-4 py-2 rounded-xl">تم المرتجع</span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredPurchases.length === 0 && (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-8">
            <span className="text-[10rem]">📦</span>
            <p className="font-black text-3xl">لا توجد سجلات توريد تطابق بحثك</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigate('add-purchase')} 
        className="fixed bottom-10 lg:bottom-16 left-6 lg:left-16 group flex items-center gap-3"
      >
        <span className="hidden lg:block bg-orange-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl border-2 border-white">إضافة توريد جديد</span>
        <div className="w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-[2.5rem] bg-orange-600 text-white shadow-[0_20px_60px_-15px_rgba(249,115,22,0.5)] flex flex-col items-center justify-center border-4 lg:border-8 border-white dark:border-slate-800 z-40 active:scale-90 hover:scale-110 transition-all hover:-rotate-6">
          <span className="text-4xl lg:text-7xl font-light">＋</span>
          <span className="text-[8px] lg:hidden font-black -mt-2">إضافة توريد</span>
        </div>
      </button>
    </PageLayout>
  );
};

export default PurchasesList;
