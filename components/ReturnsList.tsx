
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
      <div className="space-y-4 pt-2 page-enter pb-32">
        <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-[2rem] border-2 border-dashed border-rose-200 dark:border-rose-800/30">
           <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 leading-relaxed text-center italic">
             ⚠️ قائمة المرتجعات هي أرشيف للعمليات الملغاة التي تمت إعادة كمياتها للمخازن تلقائياً.
           </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {allReturns.map((item) => (
            <div 
              key={`${item.type}-${item.id}`} 
              className={`p-5 rounded-[1.8rem] border-2 transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                    item.type === 'بيع' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {item.type === 'بيع' ? '💰' : '📦'}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{item.person}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">مرتجع {item.type} • {item.qat}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-rose-500 tabular-nums">-{item.amount.toLocaleString()}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">YER</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-400">
                <span>تاريخ الإرجاع: {new Date(item.date).toLocaleDateString('ar-YE')}</span>
                <span>الكمية المرجعة: {item.quantity} كيس</span>
              </div>
            </div>
          ))}
          {allReturns.length === 0 && (
            <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
              <span className="text-6xl">🔄</span>
              <p className="font-black text-xl text-slate-400">لا توجد مرتجعات مسجلة</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ReturnsList;
