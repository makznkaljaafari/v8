
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatSaleInvoice } from '../services/shareService';

const AddSale: React.FC = () => {
  const { customers, categories, addSale, navigate, navigationParams, addNotification, user, theme } = useApp();
  const [formData, setFormData] = useState({
    customer_id: navigationParams?.customerId || '',
    qat_type: navigationParams?.qatType || '',
    quantity: 1,
    unit_price: 0,
    status: 'نقدي' as 'نقدي' | 'آجل',
    currency: 'YER' as 'YER' | 'SAR' | 'OMR',
    notes: ''
  });
  
  const [shareAfterSave, setShareAfterSave] = useState(true);

  useEffect(() => {
    if (!formData.qat_type && categories.length > 0) {
      setFormData(prev => ({ ...prev, qat_type: categories[0].name }));
    }
  }, [categories, formData.qat_type]);

  const handleQuickQuantity = (val: number) => {
    setFormData(p => ({ ...p, quantity: parseFloat((p.quantity + val).toFixed(2)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customer_id);
    if (!customer) { addNotification("تنبيه ⚠️", "يرجى اختيار العميل أولاً", "warning"); return; }
    if (formData.unit_price <= 0) { addNotification("خطأ ⚠️", "يرجى إدخال سعر البيع", "warning"); return; }
    if (formData.quantity <= 0) { addNotification("خطأ ⚠️", "الكمية يجب أن تكون أكبر من صفر", "warning"); return; }

    const total = formData.quantity * formData.unit_price;
    const saleData = { ...formData, customer_name: customer.name, total, date: new Date().toISOString() };
    await addSale(saleData);
    if (shareAfterSave) shareToWhatsApp(formatSaleInvoice(saleData as any, user?.agency_name || 'وكالة الشويع'), customer.phone);
    navigate('sales');
  };

  return (
    <PageLayout title="فاتورة بيع" onBack={() => navigate('sales')}>
      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-10 page-enter pb-24 max-w-2xl mx-auto w-full">
        
        {/* Main Content Area */}
        <div className={`p-4 lg:p-14 rounded-3xl lg:rounded-[4rem] border-2 shadow-xl space-y-5 lg:space-y-8 ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-10">
            <div className="space-y-1">
              <label className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-widest px-1">العميل</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 lg:p-7 font-black text-sm lg:text-2xl text-slate-900 dark:text-white border-none outline-none shadow-inner"
                value={formData.customer_id}
                onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                required
              >
                <option value="">-- اختر العميل --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-widest px-1">النوع</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 lg:p-7 font-black text-sm lg:text-2xl text-slate-900 dark:text-white border-none outline-none shadow-inner"
                value={formData.qat_type}
                onChange={e => setFormData({ ...formData, qat_type: e.target.value })}
                required
              >
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl flex border border-slate-100 dark:border-white/5">
                {['YER', 'SAR'].map(cur => (
                  <button
                    key={cur} type="button"
                    onClick={() => setFormData({...formData, currency: cur as any})}
                    className={`flex-1 py-2.5 lg:py-6 rounded-lg font-black text-[10px] lg:text-lg transition-all ${formData.currency === cur ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400'}`}
                  >
                    {cur}
                  </button>
                ))}
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl flex border border-slate-100 dark:border-white/5">
                {['نقدي', 'آجل'].map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setFormData({...formData, status: s as any})}
                    className={`flex-1 py-2.5 lg:py-6 rounded-lg font-black text-[10px] lg:text-lg transition-all ${formData.status === s ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <label className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-widest block text-center">الكمية (أكياس / حبة)</label>
            
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-4 lg:gap-10">
                <button type="button" onClick={() => handleQuickQuantity(-1)} className="w-12 h-12 lg:w-20 lg:h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xl lg:text-3xl font-black shadow active:scale-90">－1</button>
                <span className="text-4xl lg:text-[6rem] font-black tabular-nums text-slate-900 dark:text-white leading-none min-w-[120px] text-center">{formData.quantity}</span>
                <button type="button" onClick={() => handleQuickQuantity(1)} className="w-12 h-12 lg:w-20 lg:h-20 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-2xl text-xl lg:text-3xl font-black shadow active:scale-90">＋1</button>
              </div>

              {/* أزرار الكسور السريعة */}
              <div className="flex gap-2 w-full max-w-sm">
                <button type="button" onClick={() => handleQuickQuantity(0.25)} className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl font-black text-[10px] lg:text-xs border border-emerald-100 dark:border-emerald-800">＋ ربع</button>
                <button type="button" onClick={() => handleQuickQuantity(0.50)} className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl font-black text-[10px] lg:text-xs border border-emerald-100 dark:border-emerald-800">＋ نصف</button>
                <button type="button" onClick={() => handleQuickQuantity(0.75)} className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl font-black text-[10px] lg:text-xs border border-emerald-100 dark:border-emerald-800">＋ 0.75</button>
                <button type="button" onClick={() => setFormData(p => ({...p, quantity: 0}))} className="py-3 px-4 bg-rose-50 text-rose-500 rounded-xl font-black text-[10px]">صفر</button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-widest block text-center">السعر ({formData.currency})</label>
            <input 
              type="number" 
              className="w-full bg-transparent text-center font-black text-4xl lg:text-[7rem] outline-none text-sky-900 dark:text-emerald-400 tabular-nums border-b-2 border-slate-100 dark:border-white/5 pb-2" 
              value={formData.unit_price || ''} 
              placeholder="0" 
              onChange={e => setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })} 
            />
          </div>
        </div>

        {/* Footer Summary */}
        <div className={`p-4 lg:p-14 rounded-3xl lg:rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-10 shadow-2xl ${theme === 'dark' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
           <div className="text-center md:text-right">
              <p className="text-[8px] lg:text-xs font-black uppercase opacity-60 tracking-[0.2em] mb-1">إجمالي الفاتورة</p>
              <h2 className="text-3xl lg:text-6xl font-black tabular-nums tracking-tighter">
                {(formData.quantity * formData.unit_price).toLocaleString()} 
                <small className="text-[10px] lg:text-lg font-bold opacity-50 mr-2">{formData.currency}</small>
              </h2>
           </div>
           <button type="submit" className="w-full md:w-auto bg-white text-slate-900 px-8 lg:px-16 py-4 lg:py-8 rounded-2xl lg:rounded-[2rem] font-black text-sm lg:text-2xl active:scale-95 transition-all shadow-xl border-b-4 border-slate-300">
             حفظ ومشاركة الفاتورة ✅
           </button>
        </div>
      </form>
    </PageLayout>
  );
};

export default AddSale;
