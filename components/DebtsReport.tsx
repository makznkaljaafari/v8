
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatBudgetSummary } from '../services/shareService';
import { financeService } from '../services/financeService';
import { dataService } from '../services/dataService';

const DebtsReport: React.FC = () => {
  const { customers, suppliers, sales, purchases, vouchers, expenses, navigate, theme } = useApp();
  const [openingBalances, setOpeningBalances] = useState<any[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [activeCurrency, setActiveCurrency] = useState<'YER' | 'SAR' | 'OMR'>('YER');

  const budgetSummary = useMemo(() => {
    // تمرير كافة المعاملات المالية لحساب الميزانية الشاملة
    return financeService.getGlobalBudgetSummary(customers, suppliers, sales, purchases, vouchers, expenses);
  }, [customers, suppliers, sales, purchases, vouchers, expenses]);

  const currentSummary = useMemo(() => {
    return budgetSummary.find(s => s.currency === activeCurrency) || { assets: 0, liabilities: 0, cash: 0, net: 0, currency: activeCurrency };
  }, [budgetSummary, activeCurrency]);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const data = await dataService.getOpeningBalances();
        setOpeningBalances(data || []);
      } catch (e) {
        console.error("Failed to fetch opening balances", e);
      } finally {
        setLoadingBalances(false);
      }
    };
    fetchBalances();
  }, [sales]);

  const handleShareSummary = () => {
    const activeSummary = budgetSummary.filter(s => s.assets > 0 || s.liabilities > 0 || s.cash !== 0);
    const text = formatBudgetSummary(activeSummary);
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
          title="مشاركة الملخص"
        >
          📤
        </button>
      }
    >
      <div className="space-y-6 pt-2 page-enter pb-44 max-w-4xl mx-auto w-full px-1">
        
        {/* Currency Selector - Elegant Glassmorphism */}
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

        {/* Dynamic Financial Status Card */}
        <div className={`rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden border transition-all duration-500 ${
          theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">صافي المركز المالي ({activeCurrency})</p>
                <h3 className="text-sm font-bold opacity-40">السيولة + الديون المستحقة</h3>
              </div>
              <span className="bg-sky-500/10 text-sky-500 px-4 py-1.5 rounded-xl text-[10px] font-black border border-sky-500/20">حساب سحابي دقيق</span>
            </div>
            
            <h2 className={`text-6xl lg:text-[6rem] font-black tabular-nums tracking-tighter mb-10 transition-colors duration-500 ${currentSummary.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {currentSummary.net.toLocaleString()}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 tracking-widest">السيولة (الصندوق)</p>
                <p className="text-2xl font-black tabular-nums">{currentSummary.cash.toLocaleString()}</p>
                <div className="mt-2 h-1 w-12 bg-emerald-500/20 rounded-full"></div>
              </div>
              <div className="bg-sky-500/5 p-6 rounded-3xl border border-sky-500/10 group hover:border-sky-500/30 transition-all">
                <p className="text-[9px] font-black text-sky-500 uppercase mb-2 tracking-widest">ديون العملاء (+)</p>
                <p className="text-2xl font-black tabular-nums">{currentSummary.assets.toLocaleString()}</p>
                <div className="mt-2 h-1 w-12 bg-sky-500/20 rounded-full"></div>
              </div>
              <div className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10 group hover:border-rose-500/30 transition-all">
                <p className="text-[9px] font-black text-rose-500 uppercase mb-2 tracking-widest">ديون الموردين (-)</p>
                <p className="text-2xl font-black tabular-nums">{currentSummary.liabilities.toLocaleString()}</p>
                <div className="mt-2 h-1 w-12 bg-rose-500/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Balances Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">الأرصدة الافتتاحية والديون السابقة</h3>
            <button 
              onClick={() => navigate('add-opening-balance')} 
              className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all border border-white/10"
            >
              إضافة رصيد سابق ＋
            </button>
          </div>
          
          <div className="space-y-3">
            {loadingBalances ? (
              <div className="p-12 text-center bg-white/5 rounded-3xl animate-pulse flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black opacity-30 uppercase">جاري مزامنة البيانات السحابية...</p>
              </div>
            ) : openingBalances.filter(ob => ob.currency === activeCurrency).length > 0 ? (
              openingBalances.filter(ob => ob.currency === activeCurrency).map(ob => (
                <div key={ob.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 flex justify-between items-center group hover:border-sky-500/20 transition-all">
                  <div className="text-right">
                    <h4 className="font-black text-sm lg:text-lg text-slate-800 dark:text-white">{ob.person_name} <span className="text-[10px] opacity-40 mr-1">({ob.person_type})</span></h4>
                    <p className={`text-[10px] lg:text-xs font-bold text-slate-400 mt-1`}>{ob.notes || 'قيد رصيد افتتاحي'}</p>
                  </div>
                  <div className="text-left">
                    <p className={`text-xl lg:text-2xl font-black tabular-nums ${ob.balance_type === 'مدين' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {ob.balance_type === 'مدين' ? '+' : '-'}{ob.amount.toLocaleString()}
                    </p>
                    <small className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{ob.currency}</small>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 opacity-30 font-black text-xs flex flex-col items-center gap-4">
                <span className="text-5xl">📄</span>
                لا توجد أرصدة افتتاحية مسجلة بعملة {activeCurrency}
              </div>
            )}
          </div>
        </section>

        {/* Active Customer Debts Detailed */}
        <section className="space-y-4 pt-6">
          <div className="px-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">تفصيل ديون العملاء النشطة</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {customers.map(c => {
              const balances = financeService.getCustomerBalances(c.id, sales, vouchers);
              const bal = balances.find(b => b.currency === activeCurrency)?.amount || 0;
              if (bal <= 0) return null;
              
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6 border border-gray-50 dark:border-white/5 group hover:border-sky-500/30 transition-all">
                  <div className="text-right flex-1 w-full lg:w-auto">
                    <h4 className="font-black text-xl text-slate-800 dark:text-white">{c.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">المستحق آجل حالياً ({activeCurrency})</p>
                  </div>
                  
                  <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="text-left">
                      <p className="text-3xl font-black text-rose-500 tabular-nums">{bal.toLocaleString()}</p>
                      <small className="text-[10px] font-black opacity-30 uppercase">{activeCurrency}</small>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate('account-statement', { personId: c.id, personType: 'عميل' })} 
                        className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-4 rounded-2xl text-[10px] font-black hover:bg-slate-200 transition-all"
                        title="عرض كشف الحساب"
                      >
                        📑 كشف
                      </button>
                      <button 
                        onClick={() => navigate('add-voucher', { type: 'قبض', personId: c.id, personType: 'عميل', amount: bal, currency: activeCurrency })} 
                        className="bg-sky-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-lg hover:bg-sky-500 transition-all border-b-4 border-sky-800 active:translate-y-1"
                        title="قبض المبلغ"
                      >
                        قبض المبلغ ✅
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
