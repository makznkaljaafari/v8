
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { Sale } from '../types';
import { formatSaleInvoice, shareToWhatsApp } from '../services/shareService';

const SalesList: React.FC = () => {
  const { sales, navigate, deleteSale, user, theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter(s => s.customer_name.includes(searchTerm) || s.qat_type.includes(searchTerm));
  }, [sales, searchTerm]);

  return (
    <PageLayout title="سجل المبيعات" onBack={() => navigate('dashboard')}>
      <div className="space-y-8 lg:space-y-12 pb-32 max-w-7xl mx-auto w-full">
        
        {/* Search Bar - Professional Look */}
        <div className="relative group max-w-3xl mx-auto w-full px-1">
          <input 
            type="text" placeholder="ابحث باسم العميل أو الصنف..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-transparent focus:border-emerald-500 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-10 pr-16 lg:pr-24 font-black text-lg lg:text-2xl text-slate-900 dark:text-white shadow-2xl transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 text-2xl lg:text-4xl opacity-20">🔍</span>
        </div>

        {/* Dynamic Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 px-1">
          {filteredSales.map((sale) => (
            <div 
              key={sale.id} 
              className={`p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border-2 transition-all hover:shadow-2xl hover:-translate-y-2 group ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start mb-8 lg:mb-12">
                <div>
                  <h3 className="font-black text-xl lg:text-3xl text-slate-900 dark:text-white leading-tight mb-2">{sale.customer_name}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] lg:text-sm font-black px-4 py-1.5 rounded-xl border border-emerald-500/20">🌿 {sale.qat_type}</span>
                    <span className="text-[10px] lg:text-sm font-bold text-slate-400 tabular-nums">📅 {new Date(sale.date).toLocaleDateString('ar-YE')}</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-3xl lg:text-5xl font-black text-sky-900 dark:text-emerald-400 tabular-nums tracking-tighter">{sale.total.toLocaleString()}</p>
                  <p className="text-[10px] lg:text-sm font-black text-slate-400 uppercase tracking-widest mt-1">YER</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-white/5">
                <div className="flex gap-8 lg:gap-12">
                  <div className="flex flex-col">
                    <span className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">الكمية</span>
                    <span className="text-sm lg:text-xl font-black">{sale.quantity} أكياس</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">الحالة</span>
                    <span className={`text-sm lg:text-xl font-black ${sale.status === 'نقدي' ? 'text-emerald-500' : 'text-orange-500'}`}>{sale.status}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 lg:gap-4">
                   <div className="flex flex-col items-center">
                     <button onClick={() => shareToWhatsApp(formatSaleInvoice(sale, user?.agency_name || 'وكالة الشويع'))} className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl lg:rounded-3xl flex items-center justify-center text-xl lg:text-3xl border border-emerald-200 hover:bg-emerald-200 transition-colors">💬</button>
                     <span className="text-[8px] font-black mt-1 text-emerald-600">مشاركة</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <button onClick={() => navigate('invoice-view', { sale })} className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl lg:rounded-3xl flex items-center justify-center text-xl lg:text-3xl border border-slate-200 hover:bg-slate-200 transition-colors">📄</button>
                     <span className="text-[8px] font-black mt-1 text-slate-500">عرض</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <button onClick={() => { if(window.confirm('حذف؟')) deleteSale(sale.id) }} className="w-12 h-12 lg:w-16 lg:h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl lg:rounded-3xl flex items-center justify-center text-xl lg:text-3xl border border-rose-100 hover:bg-rose-100 transition-colors">🗑️</button>
                     <span className="text-[8px] font-black mt-1 text-rose-500">حذف</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-8">
            <span className="text-[10rem]">📦</span>
            <p className="font-black text-3xl">لا توجد سجلات مبيعات تطابق بحثك</p>
          </div>
        )}
      </div>
      
      {/* Smart FAB placement */}
      <button 
        onClick={() => navigate('add-sale')} 
        className="fixed bottom-10 lg:bottom-16 left-6 lg:left-16 group flex items-center gap-3"
      >
        <span className="hidden lg:block bg-sky-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl border-2 border-white">إضافة عملية بيع</span>
        <div className="w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-[2.5rem] bg-sky-600 text-white shadow-[0_20px_60px_-15px_rgba(14,165,233,0.5)] flex flex-col items-center justify-center border-4 lg:border-8 border-white dark:border-slate-800 z-40 active:scale-90 hover:scale-110 transition-all">
          <span className="text-4xl lg:text-7xl font-light">＋</span>
          <span className="text-[8px] lg:hidden font-black -mt-2">إضافة بيع</span>
        </div>
      </button>
    </PageLayout>
  );
};

export default SalesList;
