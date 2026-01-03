
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';

const ReturnsList: React.FC = () => {
  const { sales, purchases, navigate, theme } = useApp();

  const allReturns = useMemo(() => {
    const returnedSales = sales.filter(s => s.is_returned).map(s => ({ 
      id: s.id, 
      type: 'بيع', 
      person: s.customer_name, 
      qat: s.qat_type, 
      amount: s.total, 
      date: s.returned_at || s.date,
      quantity: s.quantity
    }));
    
    const returnedPurchases = purchases.filter(p => p.is_returned).map(p => ({ 
      id: p.id, 
      type: 'شراء', 
      person: p.supplier_name, 
      qat: p.qat_type, 
      amount: p.total, 
      date: p.returned_at || p.date,
      quantity: p.quantity
    }));

    return [...returnedSales, ...returnedPurchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, purchases]);

  return (
    <PageLayout title="سجل المرتجعات" onBack={() => navigate('dashboard')}>
      <div className="space-y-8 lg:space-y-12 pb-32 max-w-7xl mx-auto w-full px-1">
        
        <div className="bg-rose-50 dark:bg-rose-950/20 p-6 lg:p-10 rounded-[2.5rem] border-2 border-dashed border-rose-200 dark:border-rose-800/30 flex items-center justify-center">
           <p className="text-sm lg:text-xl font-black text-rose-600 dark:text-rose-400 leading-relaxed text-center italic">
             ⚠️ سجل المرتجعات يحتوي على العمليات الملغاة التي استرد النظام كمياتها للمخازن آلياً
           </p>
        </div>

        {/* Adaptive Grid: 1 col on mobile, 3 cols on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {allReturns.map((item) => (
            <div 
              key={`${item.type}-${item.id}`} 
              className={`p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-2xl ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center text-3xl lg:text-5xl shadow-inner ${
                    item.type === 'بيع' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {item.type === 'بيع' ? '💰' : '📦'}
                  </div>
                  <div>
                    <h3 className="font-black text-xl lg:text-2xl text-slate-900 dark:text-white leading-tight">{item.person}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className={`text-[10px] lg:text-xs font-black uppercase px-3 py-1 rounded-lg border ${
                         item.type === 'بيع' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                       }`}>مرتجع {item.type}</span>
                       <span className="text-[10px] lg:text-xs font-bold text-slate-400">🌿 {item.qat}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl lg:text-3xl font-black text-rose-500 tabular-nums">-{item.amount.toLocaleString()}</p>
                  <p className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">YER</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase mb-1">تاريخ العملية</span>
                  <span className="text-sm lg:text-lg font-black text-slate-500">{new Date(item.date).toLocaleDateString('ar-YE')}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase mb-1">الكمية المستردة</span>
                  <span className="text-sm lg:text-lg font-black text-slate-900 dark:text-slate-100">{item.quantity} أكياس</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allReturns.length === 0 && (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-8">
            <span className="text-[10rem]">🔄</span>
            <p className="font-black text-3xl">لا توجد مرتجعات مسجلة في السحابة</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ReturnsList;
