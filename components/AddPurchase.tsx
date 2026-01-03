
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatPurchaseInvoice } from '../services/shareService';

// Fix: Completed the truncated file and added the default export
const AddPurchase: React.FC = () => {
  const { addPurchase, navigate, suppliers, categories, user, addNotification, navigationParams } = useApp();
  const [formData, setFormData] = useState({
    supplier_id: navigationParams?.supplierId || '',
    qat_type: '',
    quantity: 1,
    unit_price: 0,
    status: 'نقدي' as 'نقدي' | 'آجل',
    currency: 'YER' as 'YER' | 'SAR' | 'OMR',
    notes: ''
  });

  const [shareAfterSave, setShareAfterSave] = useState(false);

  useEffect(() => {
    if (!formData.qat_type && categories.length > 0) {
      setFormData(prev => ({ ...prev, qat_type: categories[0].name }));
    }
  }, [categories, formData.qat_type]);

  const quickPrices = [5000, 10000, 15000, 20000, 25000, 30000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === formData.supplier_id);
    if (!supplier) {
      addNotification("تنبيه ⚠️", "يرجى اختيار المورد أولاً", "warning");
      return;
    }
    if (formData.unit_price <= 0) {
      addNotification("تنبيه ⚠️", "يرجى تحديد سعر الشراء", "warning");
      return;
    }

    const total = formData.quantity * formData.unit_price;
    const purchaseData = {
      ...formData,
      supplier_name: supplier.name,
      total,
      date: new Date().toISOString()
    };

    await addPurchase(purchaseData);

    if (shareAfterSave) {
      const text = formatPurchaseInvoice(purchaseData as any, user?.agency_name || 'وكالة الشويع');
      shareToWhatsApp(text, supplier.phone);
    }

    navigate('purchases');
  };

  return (
    <PageLayout title="فاتورة شراء وتوريد" onBack={() => navigate('purchases')}>
      <form onSubmit={handleSubmit} className="space-y-6 page-enter max-w-xl mx-auto pb-48 w-full px-2">
        
        {/* المورد والصنف */}
        <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] shadow-xl border border-light-border dark:border-dark-border space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] px-2">المورد / المزارع</label>
            <div className="relative group">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-5 pr-14 font-black text-xl outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 text-light-text dark:text-dark-text appearance-none transition-all shadow-inner"
                value={formData.supplier_id}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                required
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-30 group-focus-within:opacity-100 transition-all">🚛</span>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] px-2">نوع القات المورد</label>
            <div className="relative group">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-5 pr-14 font-black text-xl outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 text-light-text dark:text-dark-text appearance-none transition-all shadow-inner"
                value={formData.qat_type}
                onChange={e => setFormData({ ...formData, qat_type: e.target.value })}
                required
              >
                <option value="">-- اختر نوع القات --</option>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-30 group-focus-within:opacity-100 transition-all">🌿</span>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
            </div>
          </div>
        </div>

        {/* العملة والنوع */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-dark-card p-2 rounded-[2rem] shadow-lg border border-light-border dark:border-dark-border flex gap-1">
            {['YER', 'SAR', 'OMR'].map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setFormData({...formData, currency: cur as any})}
                className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${
                  formData.currency === cur 
                    ? 'bg-orange-600 text-white shadow-xl scale-105' 
                    : 'text-light-muted dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-dark-card p-2 rounded-[2rem] shadow-lg border border-light-border dark:border-dark-border flex gap-1">
            {['نقدي', 'آجل'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData({...formData, status: s as any})}
                className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${
                  formData.status === s 
                    ? (s === 'نقدي' ? 'bg-orange-600 text-white shadow-xl scale-105' : 'bg-amber-600 text-white shadow-xl scale-105')
                    : 'text-light-muted dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* الكمية */}
        <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] shadow-xl border border-light-border dark:border-dark-border text-center">
          <label className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] block mb-6">الكمية الموردة (أكياس)</label>
          <div className="flex items-center justify-center gap-10">
            <button 
              type="button" 
              onClick={() => setFormData(p => ({...p, quantity: Math.max(1, p.quantity-1)}))} 
              className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] text-3xl font-black text-slate-400 dark:text-slate-500 active:scale-90 transition-all border border-light-border dark:border-dark-border flex items-center justify-center shadow-lg"
            >
              －
            </button>
            <input 
              type="number" 
              className="w-24 bg-transparent text-center font-black text-6xl outline-none text-light-text dark:text-dark-text tabular-nums" 
              value={formData.quantity} 
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} 
            />
            <button 
              type="button" 
              onClick={() => setFormData(p => ({...p, quantity: p.quantity+1}))} 
              className="w-20 h-20 bg-orange-500/10 dark:bg-orange-500/20 rounded-[2rem] text-3xl font-black text-orange-600 active:scale-90 transition-all border border-orange-500/20 flex items-center justify-center shadow-lg"
            >
              ＋
            </button>
          </div>
        </div>

        {/* السعر */}
        <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] shadow-xl border border-light-border dark:border-dark-border">
          <label className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] block mb-6 text-center">سعر الشراء الواحد ({formData.currency})</label>
          <div className="relative mb-8">
            <input 
              type="number" 
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 rounded-[2rem] p-8 font-black text-center text-6xl outline-none text-orange-500 tabular-nums shadow-inner transition-all" 
              value={formData.unit_price || ''} 
              placeholder="0" 
              onChange={e => setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })} 
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickPrices.map(p => (
              <button 
                key={p} 
                type="button" 
                onClick={() => setFormData({...formData, unit_price: p})}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-orange-600 hover:text-white dark:text-slate-300 py-4 rounded-2xl text-[11px] font-black transition-all border border-light-border dark:border-dark-border shadow-sm active:scale-95"
              >
                {p.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* خيار واتساب */}
        <div className="bg-orange-500/5 dark:bg-orange-500/10 p-6 rounded-[2.5rem] border-2 border-dashed border-orange-500/20 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-orange-500 text-white rounded-[1.2rem] flex items-center justify-center text-3xl shadow-lg">💬</div>
             <div className="text-right">
               <p className="font-black text-sm text-light-text dark:text-dark-text tracking-tighter">مشاركة الفاتورة للمورد</p>
               <p className="text-[10px] text-light-muted dark:text-dark-muted font-bold">إرسال تفاصيل التوريد عبر واتساب</p>
             </div>
           </div>
           <label className="relative inline-flex items-center cursor-pointer scale-125">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={shareAfterSave}
                onChange={e => setShareAfterSave(e.target.checked)}
              />
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
           </label>
        </div>

        {/* الحفظ والملخص */}
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-transparent pointer-events-none"></div>
           <div className="text-right z-10 w-full md:w-auto">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em] mb-2 opacity-70">إجمالي قيمة التوريد</p>
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-black tabular-nums tracking-tighter">{(formData.quantity * formData.unit_price).toLocaleString()}</p>
                <span className="text-sm font-black opacity-40 uppercase">{formData.currency}</span>
              </div>
           </div>
           <button 
             type="submit" 
             className="w-full md:w-auto z-10 bg-orange-600 hover:bg-orange-500 px-12 py-6 rounded-[2rem] font-black text-xl shadow-[0_20px_40px_rgba(249,115,22,0.4)] active:scale-95 transition-all border-b-8 border-orange-800 flex items-center justify-center gap-4"
           >
              <span>حفظ التوريد</span>
              <span className="text-3xl">💾</span>
           </button>
        </div>
      </form>
    </PageLayout>
  );
};

export default AddPurchase;
