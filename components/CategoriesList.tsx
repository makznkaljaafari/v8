
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { QatCategory } from '../types';

const CategoriesList: React.FC = () => {
  const { categories, navigate, deleteCategory, addNotification, theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categories, searchTerm]);

  const handleDelete = async (cat: QatCategory) => {
    if (window.confirm(`هل أنت متأكد من حذف صنف "${cat.name}"؟`)) {
      try {
        await deleteCategory(cat.id);
        addNotification("تم الحذف 🗑️", `تم حذف صنف ${cat.name}.`, "success");
      } catch (err: any) { addNotification("عذراً ⚠️", "لا يمكن الحذف لوجود عمليات مرتبطة.", "warning"); }
    }
  };

  return (
    <PageLayout title="جرد المخازن" onBack={() => navigate('dashboard')}>
      <div className="space-y-4 lg:space-y-6 pb-44 max-w-7xl mx-auto w-full px-1">
        
        {/* Search Header - Compact */}
        <div className="flex flex-col md:flex-row items-center gap-4 px-1">
          <div className="relative flex-1 w-full">
            <input 
              type="text" placeholder="ابحث عن صنف في المخازن..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-2xl p-4 lg:p-5 pr-12 lg:pr-16 outline-none transition-all font-black text-base lg:text-xl shadow-lg text-slate-800 dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 opacity-30 text-xl lg:text-2xl">🔍</span>
          </div>
          <button 
            onClick={() => navigate('add-category')}
            className="w-full md:w-auto bg-emerald-600 text-white px-8 lg:px-10 py-4 lg:py-5 rounded-2xl font-black text-sm lg:text-base shadow-xl active:scale-95 transition-all border-b-4 border-emerald-800"
          >
            إضافة صنف جديد ＋
          </button>
        </div>

        {/* Dashboard-style Grid Table - Smaller Cells */}
        <div className={`overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] shadow-xl border transition-all px-1 ${
          theme === 'dark' ? 'bg-slate-950 border-white/5 shadow-emerald-900/5' : 'bg-white border-slate-100 shadow-sky-900/5'
        }`}>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-black text-[10px] lg:text-xs uppercase tracking-wider">
                  <th className="p-4 text-center w-16">#</th>
                  <th className="p-4">الصنف (النوع)</th>
                  <th className="p-4 text-center">الرصيد (كيس)</th>
                  <th className="p-4 text-center">سعر البيع</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/5 transition-colors group">
                    <td className="p-4 text-center font-black text-slate-300 group-hover:text-emerald-500 text-sm">{idx + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-xl lg:text-2xl">🌿</div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm lg:text-base">{cat.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ID: {cat.id.slice(0,6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <p className={`text-xl lg:text-2xl font-black tabular-nums ${cat.stock < 5 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                        {cat.stock}
                      </p>
                    </td>
                    <td className="p-4 text-center font-black tabular-nums text-sm lg:text-lg text-slate-500">
                      {cat.price.toLocaleString()} <small className="text-[10px] font-bold opacity-40">{cat.currency}</small>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                        cat.stock < 5 
                          ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950 dark:border-rose-900' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950 dark:border-emerald-900'
                      }`}>
                        {cat.stock < 5 ? 'رصيد حرج ⚠️' : 'مستقر ✅'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex flex-col items-center">
                          <button onClick={() => navigate('add-sale', { qatType: cat.name })} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-black text-xs shadow-md hover:bg-sky-500 transition-all active:scale-95">💰 بيع</button>
                          <span className="text-[7px] font-black mt-1 text-sky-600">بيع سريع</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <button onClick={() => navigate('add-category', { categoryId: cat.id })} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center text-lg border border-slate-200 dark:border-white/5">📝</button>
                          <span className="text-[7px] font-black mt-1 text-slate-500">تعديل</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <button onClick={() => handleDelete(cat)} className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center text-lg border border-rose-100 dark:border-rose-900/30">🗑️</button>
                          <span className="text-[7px] font-black mt-1 text-rose-500">حذف</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCategories.length === 0 && (
            <div className="p-20 text-center opacity-20 font-black flex flex-col items-center gap-4">
               <span className="text-6xl">🌿</span>
               <p className="text-xl">لا توجد أصناف مسجلة</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic FAB */}
      <button 
        onClick={() => navigate('add-category')} 
        className="fixed bottom-10 left-6 flex flex-col items-center gap-1 lg:hidden z-40"
      >
        <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-center text-4xl border-4 border-white active:scale-90 transition-transform">＋</div>
        <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[8px] font-black border border-white shadow-lg">صنف جديد</span>
      </button>
    </PageLayout>
  );
};

export default CategoriesList;
