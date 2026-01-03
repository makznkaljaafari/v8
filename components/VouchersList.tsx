
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatVoucherReceipt } from '../services/shareService';
import { Voucher } from '../types';

const VouchersList: React.FC = () => {
  const { vouchers, navigate, theme } = useApp();
  const [filter, setFilter] = useState<'الكل' | 'قبض' | 'دفع'>('الكل');

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => filter === 'الكل' || v.type === filter);
  }, [vouchers, filter]);

  const stats = useMemo(() => {
    const receipts = vouchers.filter(v => v.type === 'قبض').reduce((sum, v) => sum + v.amount, 0);
    const payments = vouchers.filter(v => v.type === 'دفع').reduce((sum, v) => sum + v.amount, 0);
    return { receipts, payments };
  }, [vouchers]);

  return (
    <PageLayout title="السندات المالية" onBack={() => navigate('dashboard')}>
      <div className="space-y-10 lg:space-y-16 pb-32 max-w-7xl mx-auto w-full px-1">
        
        {/* Stats Section - 4 columns on Desktop, 2 columns on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 px-1">
           <div className={`p-6 lg:p-10 rounded-[2.5rem] border-2 flex flex-col items-center justify-center text-center transition-all ${theme === 'dark' ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`}>
              <p className="text-[10px] lg:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase mb-3 lg:mb-5 tracking-widest">إجمالي المقبوضات</p>
              <p className="text-3xl lg:text-5xl font-black text-emerald-600 tabular-nums">+{stats.receipts.toLocaleString()}</p>
           </div>
           <div className={`p-6 lg:p-10 rounded-[2.5rem] border-2 flex flex-col items-center justify-center text-center transition-all ${theme === 'dark' ? 'bg-rose-900/10 border-rose-500/20' : 'bg-rose-50 border-rose-100 shadow-sm'}`}>
              <p className="text-[10px] lg:text-sm font-black text-rose-600 dark:text-rose-400 uppercase mb-3 lg:mb-5 tracking-widest">إجمالي المدفوعات</p>
              <p className="text-3xl lg:text-5xl font-black text-rose-600 tabular-nums">-{stats.payments.toLocaleString()}</p>
           </div>
           <div className={`hidden lg:flex p-10 rounded-[2.5rem] border-2 flex-col items-center justify-center bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-500/20`}>
              <p className="text-sm font-black text-sky-600 dark:text-sky-400 uppercase mb-5 tracking-widest">عدد العمليات</p>
              <p className="text-5xl font-black text-sky-600 tabular-nums">{vouchers.length}</p>
           </div>
           <div className={`hidden lg:flex p-10 rounded-[2.5rem] border-2 flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5`}>
              <p className="text-sm font-black text-slate-400 uppercase mb-5 tracking-widest">الحالة اليوم</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300">مستقر ✅</p>
           </div>
        </div>

        {/* Professional Filter - Centered on Desktop */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-2 lg:p-3 rounded-2xl lg:rounded-3xl flex max-w-xl mx-auto w-full shadow-inner border border-slate-200 dark:border-white/5">
          {['الكل', 'قبض', 'دفع'].map(f => (
            <button
              key={f} onClick={() => setFilter(f as any)}
              className={`flex-1 py-4 lg:py-6 rounded-xl lg:rounded-2xl font-black text-sm lg:text-xl transition-all ${filter === f ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-emerald-400 shadow-xl scale-105' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Adaptive Grid for Vouchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 px-1">
          {filteredVouchers.map((v) => (
            <div 
              key={v.id} 
              className={`p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border-2 transition-all hover:shadow-2xl hover:-translate-y-2 group ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-center mb-8 lg:mb-12">
                <div className="flex items-center gap-5 lg:gap-8">
                  <div className={`w-16 h-16 lg:w-24 lg:h-24 rounded-[1.8rem] lg:rounded-[2.2rem] flex items-center justify-center text-3xl lg:text-5xl shadow-sm ${
                    v.type === 'قبض' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                  }`}>
                    {v.type === 'قبض' ? '📥' : '📤'}
                  </div>
                  <div>
                    <h3 className="font-black text-xl lg:text-3xl text-slate-900 dark:text-white leading-tight mb-2">{v.person_name}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] lg:text-xs font-black uppercase px-3 py-1 rounded-xl border ${v.type === 'قبض' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{v.type}</span>
                      <span className="text-[10px] lg:text-xs font-bold text-slate-400 tabular-nums">📅 {new Date(v.date).toLocaleDateString('ar-YE')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-2xl lg:text-4xl font-black tabular-nums tracking-tighter ${v.type === 'قبض' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {v.type === 'قبض' ? '+' : '-'}{v.amount.toLocaleString()}
                  </p>
                  <small className="text-[9px] lg:text-xs font-black opacity-30 uppercase tracking-widest block text-left">{v.currency}</small>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] mb-8 border border-slate-100 dark:border-slate-800 italic text-sm lg:text-lg text-slate-500 dark:text-slate-400 font-bold shadow-inner">
                 "{v.notes || 'سند مالي موثق في النظام السحابي'}"
              </div>

              <div className="flex gap-4 pt-8 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => shareToWhatsApp(formatVoucherReceipt(v))} className="flex-[2] bg-sky-600 text-white py-5 lg:py-7 rounded-2xl lg:rounded-3xl font-black text-sm lg:text-lg shadow-lg hover:bg-sky-500 transition-all flex items-center justify-center gap-3 border-b-4 border-sky-800">💬 مشاركة</button>
                <button onClick={() => navigate('add-voucher', { id: v.id })} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 py-5 lg:py-7 rounded-2xl lg:rounded-3xl font-black text-sm lg:text-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all">📝 تفاصيل</button>
              </div>
            </div>
          ))}
        </div>

        {filteredVouchers.length === 0 && (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-10">
            <span className="text-[10rem]">📑</span>
            <p className="font-black text-3xl">لا توجد سندات مسجلة حالياً</p>
          </div>
        )}
      </div>
      
      {/* Dynamic Action Buttons Placement */}
      <div className="fixed bottom-10 lg:bottom-16 left-6 lg:left-16 flex flex-col gap-6 lg:gap-10 z-40">
        <div className="group flex items-center gap-3">
          <span className="hidden lg:block bg-rose-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl border-2 border-white">سند دفع مالي</span>
          <button onClick={() => navigate('add-voucher', { type: 'دفع' })} className="w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-[2.5rem] bg-rose-600 text-white shadow-2xl flex flex-col items-center justify-center border-4 lg:border-8 border-white dark:border-slate-800 active:scale-90 hover:scale-110 transition-all hover:rotate-12">
            <span className="text-3xl lg:text-6xl">📤</span>
            <span className="text-[8px] lg:hidden font-black -mt-1">سند دفع</span>
          </button>
        </div>
        <div className="group flex items-center gap-3">
          <span className="hidden lg:block bg-sky-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl border-2 border-white">سند قبض مالي</span>
          <button onClick={() => navigate('add-voucher', { type: 'قبض' })} className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl lg:rounded-[3rem] bg-sky-600 text-white shadow-[0_20px_50px_rgba(14,165,233,0.4)] flex flex-col items-center justify-center border-4 lg:border-8 border-white dark:border-slate-800 active:scale-90 hover:scale-110 transition-all hover:-rotate-12">
            <span className="text-4xl lg:text-8xl">📥</span>
            <span className="text-[8px] lg:hidden font-black -mt-2">سند قبض</span>
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default VouchersList;
