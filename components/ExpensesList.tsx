
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { Expense } from '../types';

const ExpensesList: React.FC = () => {
  const { expenses, expenseTemplates, navigate, updateExpense, addExpense, theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});

  const filteredExpenses = expenses.filter(e => e.title.includes(searchTerm) || e.category.includes(searchTerm));

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditForm(expense);
  };

  const saveEdit = () => {
    if (editingId && editForm.title && editForm.amount) {
      updateExpense(editingId, editForm);
      setEditingId(null);
    }
  };

  return (
    <PageLayout title="سجل المصروفات" onBack={() => navigate('dashboard')}>
      <div className="space-y-10 lg:space-y-16 pb-40 max-w-7xl mx-auto w-full px-1">
        
        {/* Templates Section - Adaptive */}
        <section className="space-y-6 px-1">
          <h3 className="font-black text-xl lg:text-3xl text-amber-900 dark:text-amber-400 flex items-center gap-3"><span>🔁</span> المصاريف المتكررة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-8">
            {expenseTemplates.map(template => (
              <div key={template.id} className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[2rem] border-2 border-amber-100 dark:border-slate-800 shadow-xl flex flex-col justify-between hover:scale-105 transition-transform">
                <div>
                   <p className="font-black text-slate-800 dark:text-white truncate text-sm lg:text-lg">{template.title}</p>
                   <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-xl text-[10px] lg:text-xs font-black uppercase mt-2 block w-fit">{template.frequency}</span>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="font-black text-amber-600 text-lg lg:text-2xl tabular-nums">{template.amount.toLocaleString()}</span>
                  <button onClick={() => addExpense({ title: template.title, category: template.category, amount: template.amount, currency: template.currency, notes: `تكرار ${template.frequency}` })} className="w-10 h-10 lg:w-14 lg:h-14 bg-amber-600 text-white rounded-xl lg:rounded-2xl flex flex-col items-center justify-center shadow-lg">
                    <span className="text-xl lg:text-3xl font-black">＋</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Search - Pro Look */}
        <div className="max-w-3xl mx-auto w-full px-1">
          <div className="bg-white dark:bg-slate-900 p-2 lg:p-4 rounded-[2rem] lg:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center">
            <input 
              type="text" placeholder="ابحث في المصروفات..."
              className="w-full bg-transparent p-5 lg:p-8 font-black text-lg lg:text-2xl outline-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="px-8 text-3xl opacity-20">🔍</span>
          </div>
        </div>

        {/* Table for Desktop, List for Mobile */}
        <div className="hidden md:block overflow-hidden rounded-[3rem] shadow-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gradient-to-l from-amber-600 to-amber-800 text-white">
                <th className="p-8 font-black text-sm uppercase tracking-widest text-center w-20">#</th>
                <th className="p-8 font-black text-sm">التاريخ</th>
                <th className="p-8 font-black text-sm">بيان المصروف</th>
                <th className="p-8 font-black text-sm text-center">المبلغ</th>
                <th className="p-8 font-black text-sm text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredExpenses.map((e, idx) => (
                <tr key={e.id} className="hover:bg-amber-50/20 transition-colors group">
                  <td className="p-8 text-center font-black text-slate-300 group-hover:text-amber-500">{idx + 1}</td>
                  <td className="p-8 font-bold text-sm tabular-nums text-slate-400">{new Date(e.date).toLocaleDateString('ar-YE')}</td>
                  <td className="p-8">
                     <p className="font-black text-slate-900 dark:text-white text-xl">{e.title}</p>
                     <span className="text-xs font-black text-amber-600 opacity-60 uppercase">{e.category}</span>
                  </td>
                  <td className="p-8 text-center">
                     <p className="font-black text-3xl tabular-nums text-amber-600">{e.amount.toLocaleString()} <small className="text-xs">{e.currency}</small></p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <button onClick={() => handleEdit(e)} className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-2xl">📝</button>
                        <span className="text-[8px] font-black mt-1 text-blue-500">تعديل</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <button className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center text-2xl">🗑️</button>
                        <span className="text-[8px] font-black mt-1 text-rose-500">حذف</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile-Only Card List */}
        <div className="md:hidden space-y-4 px-1">
           {filteredExpenses.map((e) => (
             <div key={e.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-50 dark:border-white/5 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg">{e.title}</h4>
                      <p className="text-[10px] font-black text-amber-600 uppercase mt-1">{e.category}</p>
                   </div>
                   <p className="text-2xl font-black text-amber-600 tabular-nums">{e.amount.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-white/5">
                   <span className="text-[10px] font-bold text-slate-400">📅 {new Date(e.date).toLocaleDateString('ar-YE')}</span>
                   <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <button onClick={() => handleEdit(e)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">📝</button>
                        <span className="text-[8px] font-black mt-0.5 text-slate-500">تعديل</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <button className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl">🗑️</button>
                        <span className="text-[8px] font-black mt-0.5 text-rose-500">حذف</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {filteredExpenses.length === 0 && <div className="p-40 text-center opacity-30 font-black text-3xl">لا توجد مصروفات مسجلة</div>}
      </div>

      <button onClick={() => navigate('add-expense')} className="fixed bottom-10 lg:bottom-16 left-6 lg:left-16 group flex items-center gap-3">
        <span className="hidden lg:block bg-amber-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl border-2 border-white">إضافة مصروف جديد</span>
        <div className="w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-[2.5rem] bg-amber-600 text-white shadow-3xl flex flex-col items-center justify-center border-4 lg:border-8 border-white dark:border-slate-800 active:scale-90 hover:scale-110 transition-all">
          <span className="text-4xl lg:text-7xl font-light">＋</span>
          <span className="text-[8px] lg:hidden font-black -mt-2">إضافة مصروف</span>
        </div>
      </button>
    </PageLayout>
  );
};

export default ExpensesList;
