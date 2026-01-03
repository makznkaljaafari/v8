
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { Supplier } from '../types';
import { financeService } from '../services/financeService';

const SuppliersList: React.FC = () => {
  const { 
    suppliers, 
    purchases, 
    vouchers, 
    navigate,
    deleteSupplier,
    addNotification,
    theme
  } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`هل أنت متأكد من حذف المورد "${supplier.name}"؟ سيتم حذف بياناته وسجله نهائياً.`)) {
      try {
        await deleteSupplier(supplier.id);
        addNotification("تم الحذف 🗑️", `تم حذف المورد ${supplier.name} من النظام.`, "success");
      } catch (err: any) {
        addNotification("فشل الحذف ⚠️", err.message || "لا يمكن حذف المورد لوجود عمليات مرتبطة به.", "warning");
      }
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s: Supplier) => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.phone && s.phone.includes(searchTerm))
    );
  }, [suppliers, searchTerm]);

  return (
    <PageLayout 
      title="دليل الموردين" 
      onBack={() => navigate('dashboard')} 
    >
      <div className="space-y-6 pt-2 page-enter pb-44 max-w-7xl mx-auto w-full">
        <div className="relative group max-w-2xl mx-auto w-full px-1">
          <input 
            type="text"
            placeholder="ابحث عن مورد بالاسم أو الهاتف..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-transparent focus:border-orange-500 rounded-2xl p-5 pr-14 outline-none transition-all font-black text-xl shadow-xl text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-30">🔍</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-1">
          {filteredSuppliers.map((s: Supplier) => {
            const balances = financeService.getSupplierBalances(s.id, purchases, vouchers);
            const totalDue = balances.find(b => b.currency === 'YER')?.amount || 0;

            return (
              <div 
                key={s.id} 
                className={`p-8 rounded-[2.5rem] border-2 transition-all hover:shadow-2xl hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-xl'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-3 transition-transform">🚛</div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{s.name}</h3>
                      <p className="text-sm font-bold text-slate-400 mt-1 tabular-nums">📱 {s.phone || 'بدون هاتف'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 flex justify-between items-center border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المستحقات (لنا/علينا)</p>
                    <p className={`text-2xl font-black tabular-nums ${totalDue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {totalDue.toLocaleString()} <small className="text-xs font-bold uppercase">YER</small>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-2xl">⚖️</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate('account-statement', { personId: s.id, personType: 'مورد' })} 
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-4 rounded-2xl font-black text-xs border border-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    📑 كشف حساب
                  </button>
                  
                  <button 
                    onClick={() => navigate('add-voucher', { type: 'دفع', personId: s.id, personType: 'مورد', currency: 'YER' })} 
                    className="bg-orange-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-orange-500 transition-all"
                  >
                    📤 سداد نقدي
                  </button>
                  
                  <button 
                    onClick={() => navigate('add-purchase', { supplierId: s.id })} 
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-xs border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    📦 توريد جديد
                  </button>

                  <button 
                    onClick={() => handleDelete(s)} 
                    className="bg-rose-50 dark:bg-rose-900/30 text-rose-500 py-4 rounded-2xl font-black text-xs border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 hover:bg-rose-600 hover:text-white transition-all"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-32 opacity-20 flex flex-col items-center gap-6">
            <span className="text-8xl">🚛</span>
            <p className="font-black text-2xl">لا توجد سجلات موردين</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigate('add-supplier')} 
        className="fixed bottom-10 lg:bottom-16 right-6 lg:right-16 w-16 lg:w-20 h-16 lg:h-20 rounded-2xl lg:rounded-[1.8rem] bg-orange-600 text-white shadow-2xl flex items-center justify-center text-4xl border-4 border-white dark:border-slate-800 z-40 active:scale-90 hover:scale-110 transition-all"
      >🚛＋</button>
    </PageLayout>
  );
};

export default SuppliersList;
