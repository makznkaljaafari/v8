
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp } from '../services/shareService';

const AccountStatement: React.FC = () => {
  const { 
    navigationParams, navigate, sales, purchases, vouchers, 
    customers, suppliers, theme, user 
  } = useApp();
  
  const personId = navigationParams?.personId;
  const personType = navigationParams?.personType; // 'عميل' | 'مورد'
  const [selectedCurrency, setSelectedCurrency] = useState<'YER' | 'SAR' | 'OMR'>('YER');

  const person = useMemo(() => {
    if (personType === 'عميل') return customers.find(c => c.id === personId);
    return suppliers.find(s => s.id === personId);
  }, [personId, personType, customers, suppliers]);

  const statementData = useMemo(() => {
    if (!person) return [];
    let transactions: any[] = [];

    if (personType === 'عميل') {
      const customerSales = sales.filter(s => s.customer_id === personId && s.currency === selectedCurrency && !s.is_returned);
      customerSales.forEach(s => {
        transactions.push({
          date: s.date,
          type: 'فاتورة بيع',
          details: `بيع ${s.qat_type} (${s.quantity} كيس)`,
          debit: s.status === 'آجل' ? s.total : 0,
          credit: s.status === 'نقدي' ? s.total : 0,
          reference: s
        });
      });
      const customerVouchers = vouchers.filter(v => v.person_id === personId && v.person_type === 'عميل' && v.type === 'قبض' && v.currency === selectedCurrency);
      customerVouchers.forEach(v => {
        transactions.push({ date: v.date, type: 'سند قبض', details: v.notes || 'استلام نقدي', debit: 0, credit: v.amount, reference: v });
      });
    } else {
      const supplierPurchases = purchases.filter(p => p.supplier_id === personId && p.currency === selectedCurrency && !p.is_returned);
      supplierPurchases.forEach(p => {
        transactions.push({
          date: p.date,
          type: 'توريد قات',
          details: `شراء ${p.qat_type} (${p.quantity} كيس)`,
          debit: p.status === 'نقدي' ? p.total : 0,
          credit: p.status === 'آجل' ? p.total : 0,
          reference: p
        });
      });
      const supplierVouchers = vouchers.filter(v => v.person_id === personId && v.person_type === 'مورد' && v.type === 'دفع' && v.currency === selectedCurrency);
      supplierVouchers.forEach(v => {
        transactions.push({ date: v.date, type: 'سند دفع', details: v.notes || 'تسديد نقدي', debit: v.amount, credit: 0, reference: v });
      });
    }

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    const finalData = transactions.map(t => {
      if (personType === 'عميل') runningBalance += (t.debit - t.credit);
      else runningBalance += (t.credit - t.debit);
      return { ...t, balance: runningBalance };
    });
    return finalData.reverse();
  }, [person, personId, personType, sales, purchases, vouchers, selectedCurrency]);

  const handleShare = () => {
    if (!person) return;
    let text = `*📊 كشف حساب ${personType}: ${person.name}*\n*🏢 ${user?.agency_name || 'وكالة الشويع'}*\n*💰 العملة: ${selectedCurrency}*\n--------------------------------\n📅 التاريخ | البيان | الرصيد\n--------------------------------\n`;
    statementData.slice(0, 15).forEach(row => { text += `📅 ${new Date(row.date).toLocaleDateString('ar-YE')} | ${row.details} | *${row.balance.toLocaleString()}*\n`; });
    const finalBalance = statementData[0]?.balance || 0;
    
    let statusText = "";
    if (personType === 'عميل') {
      statusText = finalBalance > 0 ? `عليكم مديونية: ${finalBalance.toLocaleString()}` : finalBalance < 0 ? `لكم رصيد فائض عندنا: ${Math.abs(finalBalance).toLocaleString()}` : "الحساب مصفى";
    } else {
      statusText = finalBalance > 0 ? `علينا مديونية لكم: ${finalBalance.toLocaleString()}` : finalBalance < 0 ? `لدينا رصيد فائض عندكم: ${Math.abs(finalBalance).toLocaleString()}` : "الحساب مصفى";
    }

    text += `--------------------------------\n*⚠️ ${statusText} ${selectedCurrency}*\n--------------------------------\n✅ تم التوليد آلياً من نظام الشويع الذكي`;
    shareToWhatsApp(text, person.phone);
  };

  if (!person) return <PageLayout title="خطأ" onBack={() => navigate('dashboard')}><p>العميل/المورد غير موجود</p></PageLayout>;

  const finalBalance = statementData[0]?.balance || 0;
  const isCreditForCustomer = personType === 'عميل' && finalBalance < 0;

  return (
    <PageLayout 
      title={`كشف حساب: ${person.name}`} 
      onBack={() => navigate(personType === 'عميل' ? 'customers' : 'suppliers')}
      headerExtra={
        <button onClick={handleShare} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
          مشاركة واتساب 💬
        </button>
      }
    >
      <div className="space-y-8 lg:space-y-12 pb-44 max-w-7xl mx-auto w-full px-1">
        
        {/* Top Section - Large Stats & Currency */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          <div className={`flex-1 p-10 lg:p-14 rounded-[3rem] lg:rounded-[4rem] shadow-2xl border relative overflow-hidden group transition-all duration-500 ${
            isCreditForCustomer ? 'bg-amber-900 border-amber-500/30' : 'bg-slate-900 border-white/5'
          }`}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
             <div className="relative z-10 flex justify-between items-end">
                <div className="text-right">
                   <p className="text-[10px] lg:text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
                     {isCreditForCustomer ? 'رصيد دائن (مبالغ للعميل عندنا)' : 'إجمالي الرصيد المستحق'} ({selectedCurrency})
                   </p>
                   <h2 className={`text-5xl lg:text-[7rem] font-black tabular-nums tracking-tighter leading-none ${
                     isCreditForCustomer ? 'text-amber-400' : (finalBalance > 0 ? 'text-rose-500' : 'text-emerald-500')
                   }`}>
                     {Math.abs(finalBalance).toLocaleString()}
                   </h2>
                   {isCreditForCustomer && <p className="text-amber-400/60 font-black text-xs mt-4">هذا المبلغ يُعتبر ديناً على الوكالة لصالح العميل</p>}
                </div>
                <div className={`w-20 h-20 lg:w-32 lg:h-32 rounded-[2.5rem] flex items-center justify-center text-5xl lg:text-7xl shadow-inner border transition-all ${
                  isCreditForCustomer ? 'bg-amber-600/20 border-amber-400/20' : 'bg-white/5 border-white/10'
                }`}>
                  {isCreditForCustomer ? '⚖️' : '📊'}
                </div>
             </div>
          </div>

          <div className="w-full lg:w-80 bg-white dark:bg-slate-900 rounded-[3rem] p-4 lg:p-6 shadow-xl border border-slate-100 dark:border-white/5 flex flex-col gap-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">تغيير عرض العملة</p>
             {['YER', 'SAR', 'OMR'].map((cur) => (
                <button
                  key={cur} onClick={() => setSelectedCurrency(cur as any)}
                  className={`flex-1 p-5 rounded-2xl font-black text-lg transition-all ${
                    selectedCurrency === cur ? 'bg-sky-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cur}
                </button>
             ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-950 rounded-[3rem] shadow-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-800">
                       <th className="p-8 lg:p-10 font-black text-xs lg:text-sm uppercase border-l border-slate-100 dark:border-slate-800 w-32">التاريخ</th>
                       <th className="p-8 lg:p-10 font-black text-xs lg:text-sm uppercase border-l border-slate-100 dark:border-slate-800">البيان / التفاصيل</th>
                       <th className="p-8 lg:p-10 font-black text-xs lg:text-sm uppercase border-l border-slate-100 dark:border-slate-800 text-center">مدين (+)</th>
                       <th className="p-8 lg:p-10 font-black text-xs lg:text-sm uppercase border-l border-slate-100 dark:border-slate-800 text-center">دائن (-)</th>
                       <th className="p-8 lg:p-10 font-black text-xs lg:text-sm uppercase text-center bg-slate-100/50 dark:bg-slate-800/50 min-w-[150px]">الرصيد التراكمي</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {statementData.map((row, idx) => (
                       <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50/20 dark:bg-slate-900/5'} hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-colors`}>
                          <td className="p-8 lg:p-10 border-l border-slate-100 dark:border-slate-800">
                             <p className="text-xs lg:text-base font-black tabular-nums">{new Date(row.date).toLocaleDateString('ar-YE')}</p>
                             <p className="text-[10px] text-slate-400 mt-1 opacity-50">{new Date(row.date).toLocaleTimeString('ar-YE', {hour:'2-digit', minute:'2-digit'})}</p>
                          </td>
                          <td className="p-8 lg:p-10 border-l border-slate-100 dark:border-slate-800">
                             <p className="font-black text-sm lg:text-xl text-slate-900 dark:text-white">{row.type}</p>
                             <p className="text-xs lg:text-base text-slate-400 mt-2 font-bold italic opacity-80">{row.details}</p>
                          </td>
                          <td className={`p-8 lg:p-10 border-l border-slate-100 dark:border-slate-800 text-center font-black tabular-nums text-lg lg:text-3xl ${row.debit > 0 ? 'text-rose-500 bg-rose-50/20' : 'text-slate-300 dark:text-slate-800'}`}>
                             {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                          </td>
                          <td className={`p-8 lg:p-10 border-l border-slate-100 dark:border-slate-800 text-center font-black tabular-nums text-lg lg:text-3xl ${row.credit > 0 ? 'text-emerald-500 bg-emerald-50/20' : 'text-slate-300 dark:text-slate-800'}`}>
                             {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                          </td>
                          <td className={`p-8 lg:p-10 text-center font-black tabular-nums text-xl lg:text-4xl bg-slate-50 dark:bg-slate-800/40 ${row.balance > 0 ? 'text-rose-600' : (row.balance < 0 ? 'text-amber-600' : 'text-emerald-600')}`}>
                             {Math.abs(row.balance).toLocaleString()}
                          </td>
                       </tr>
                    ))}
                    {statementData.length === 0 && (
                       <tr><td colSpan={5} className="p-40 text-center opacity-30 font-black text-2xl italic">لا توجد تحركات مالية مسجلة لهذه العملة حالياً</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default AccountStatement;
