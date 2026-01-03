
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatBudgetSummary } from '../services/shareService';
import { financeService } from '../services/financeService';
import { dataService } from '../services/dataService';

const DebtsReport: React.FC = () => {
  const { customers, suppliers, sales, purchases, vouchers, expenses, navigate, theme } = useApp();
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

  const handleShareSummary = () => {
    const activeSummary = budgetSummary.filter(s => s.assets > 0 || s.liabilities > 0 || s.cash !== 0);
    const text = formatBudgetSummary(activeSummary as any);
    shareToWhatsApp(text);
  };

  return (
    <PageLayout 
      title="الميزانية والديون" 
      onBack={() => navigate('dashboard')} 
      headerExtra={
        <button 
          onClick={handleShareSummary} 
          className="w-10 h-10 lg:w-14 lg:h-14 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-lg active:scale-90 border border-white/20 hover:bg-white/20 transition-all"
        >
          📤
        </button>
      }
    >
      <div className="space-y-6 pt-2 page-enter pb-44 max-w-4xl mx-auto w-full px-1">
        
        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl gap-1 w-fit mx-auto border border-slate-200 dark:border-white/5 shadow-inner">
           {(['YER', 'SAR', 'OMR'] as const).map(cur => (
             <button
               key={cur}
               onClick={() => setActiveCurrency(cur)}
               className={`px-6 py-2.5 rounded-xl font-black text-xs lg:text-sm transition-all duration-300 ${
                 activeCurrency === cur 
                   ? 'bg-sky-600 text-white shadow-lg scale-105' 
                   : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
               }`}
             >
               {cur === 'YER' ? 'ريال يمني' : cur === 'SAR' ? 'ريال سعودي' : 'ريال عماني'}
             </button>
           ))}
        </div>

        {/* Global Stats Card */}
        <div className={`rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">صافي المركز المالي ({activeCurrency})</p>
                <h3 className="text-sm font-bold opacity-40">السيولة + الأصول - الخصوم</h3>
              </div>
              <span className="bg-sky-500/10 text-sky-500 px-4 py-1.5 rounded-xl text-[10px] font-black border border-sky-500/20">دقة محاسبية كاملة</span>
            </div>
            
            <h2 className={`text-6xl lg:text-[6rem] font-black tabular-nums tracking-tighter mb-10 transition-colors duration-500 ${currentSummary.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {currentSummary.net.toLocaleString()}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 tracking-widest">السيولة (الصندوق)</p>
                <p className="text-2xl font-black tabular-nums">{currentSummary.cash.toLocaleString()}</p>
              </div>
              <div className="bg-sky-500/5 p-6 rounded-3xl border border-sky-500/10">
                <p className="text-[9px] font-black text-sky-500 uppercase mb-2 tracking-widest">إجمالي الأصول (+)</p>
                <p className="text-2xl font-black tabular-nums">{currentSummary.assets.toLocaleString()}</p>
              </div>
              <div className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10">
                <p className="text-[9px] font-black text-rose-500 uppercase mb-2 tracking-widest">إجمالي الخصوم (-)</p>
                <p className="text-2xl font-black tabular-nums">{currentSummary.liabilities.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Section: Liabilities (Debts we owe to customers) */}
        {currentSummary.customerCredits > 0 && (
          <section className="space-y-4 pt-6">
            <div className="px-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest">مبالغ مستحقة للعملاء (ديون علينا)</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {customers.map(c => {
                const balances = financeService.getCustomerBalances(c.id, sales, vouchers);
                const bal = balances.find(b => b.currency === activeCurrency)?.amount || 0;
                if (bal >= 0) return null; // ليس له فائق عندنا

                return (
                  <div key={c.id} className="p-6 rounded-[2rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6 border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 transition-all">
                    <div className="text-right flex-1 w-full lg:w-auto">
                      <h4 className="font-black text-xl text-slate-800 dark:text-white">{c.name}</h4>
                      <p className="text-[10px] font-bold mt-1 text-amber-600">رصيد دائن: هذا العميل دفع مبالغ زائدة وله حق عندنا</p>
                    </div>
                    
                    <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-left">
                        <p className="text-3xl font-black tabular-nums text-amber-600">
                          {Math.abs(bal).toLocaleString()}
                        </p>
                        <small className="text-[10px] font-black opacity-30 uppercase">{activeCurrency}</small>
                      </div>
                      <button 
                        onClick={() => navigate('account-statement', { personId: c.id, personType: 'عميل' })} 
                        className="bg-amber-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg"
                      >
                        📑 كشف الحساب
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Debts from customers */}
        <section className="space-y-4 pt-6">
          <div className="px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">ديون العملاء (مبالغ لنا)</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {customers.map(c => {
              const balances = financeService.getCustomerBalances(c.id, sales, vouchers);
              const bal = balances.find(b => b.currency === activeCurrency)?.amount || 0;
              if (bal <= 0) return null;

              return (
                <div key={c.id} className="p-6 rounded-[2rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6 border bg-white dark:bg-slate-900 border-gray-50 dark:border-white/5 transition-all">
                  <div className="text-right flex-1 w-full lg:w-auto">
                    <h4 className="font-black text-xl text-slate-800 dark:text-white">{c.name}</h4>
                    <p className="text-[10px] font-bold mt-1 text-slate-400">رصيد مدين: هذا العميل عليه ديون سابقة للوكالة</p>
                  </div>
                  
                  <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="text-left">
                      <p className="text-3xl font-black tabular-nums text-rose-500">
                        {bal.toLocaleString()}
                      </p>
                      <small className="text-[10px] font-black opacity-30 uppercase">{activeCurrency}</small>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate('account-statement', { personId: c.id, personType: 'عميل' })} 
                        className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-4 rounded-2xl text-[10px] font-black"
                      >
                        📑 كشف
                      </button>
                      <button 
                        onClick={() => navigate('add-voucher', { type: 'قبض', personId: c.id, personType: 'عميل', amount: bal, currency: activeCurrency })} 
                        className="bg-sky-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg"
                      >
                        قبض ✅
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </PageLayout>
  );
};

export default DebtsReport;
