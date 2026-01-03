
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Voucher, Expense, Waste, ExchangeRates, ExpenseTemplate } from '../types';
import { dataService } from '../services/dataService';
import { useUI } from './UIContext';
import { useInventory } from './InventoryContext';

const FinanceContext = createContext<any>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification, triggerFeedback } = useUI();
  const { setCategories } = useInventory();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTemplates, setExpenseTemplates] = useState<ExpenseTemplate[]>([]);
  const [wasteRecords, setWasteRecords] = useState<Waste[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ SAR_TO_YER: 430, OMR_TO_YER: 425 });
  const [expenseCategories, setExpenseCategories] = useState<string[]>(['نثرية', 'كهرباء', 'إيجار', 'غداء', 'حوافز']);

  const addVoucher = useCallback(async (v: any) => {
    try {
      const saved = await dataService.saveVoucher(v);
      setVouchers(prev => [saved, ...prev]);
      addNotification("سند جديد ✅", "تم التوثيق بنجاح.", "success");
      if (v.type === 'قبض') triggerFeedback('celebration');
    } catch (e: any) {
      addNotification("خطأ ⚠️", e.message, "warning");
    }
  }, [addNotification, triggerFeedback]);

  const addExpense = useCallback(async (e: any) => {
    try {
      const saved = await dataService.saveExpense(e);
      setExpenses(prev => [saved, ...prev]);
      addNotification("مصروف جديد ✅", "تم تسجيل المصروف.", "success");
    } catch (err: any) {
      addNotification("خطأ ⚠️", err.message, "warning");
    }
  }, [addNotification]);

  const addWaste = useCallback(async (w: any) => {
    try {
      const saved = await dataService.saveWaste(w);
      setWasteRecords(prev => [saved, ...prev]);
      setCategories((prev: any[]) => prev.map(cat => 
        cat.name === w.qat_type ? { ...cat, stock: Math.max(0, Number(cat.stock) - Number(w.quantity)) } : cat
      ));
      addNotification("تسجيل تالف 🥀", "تم خصم الكمية بنجاح.", "warning");
    } catch (e: any) {
      addNotification("خطأ ⚠️", e.message, "warning");
    }
  }, [addNotification, setCategories]);

  const updateExchangeRates = useCallback(async (rates: any) => {
    setExchangeRates(rates);
    try {
      const userId = await dataService.getUserId();
      if (userId) await dataService.updateSettings(userId, { exchange_rates: rates });
      addNotification("تم التحديث 💱", "تم تحديث أسعار الصرف.", "success");
    } catch (e) {}
  }, [addNotification]);

  const addOpeningBalance = useCallback(async (b: any) => {
    try {
      const res = await dataService.saveOpeningBalance(b);
      addNotification("تم القيد ✅", "تم حفظ الرصيد السابق.", "success");
      return res;
    } catch (e: any) {
      addNotification("خطأ ⚠️", e.message, "warning");
    }
  }, [addNotification]);

  const addExpenseTemplate = useCallback(async (t: any) => {
    try {
      const res = await dataService.saveExpenseTemplate(t);
      setExpenseTemplates(prev => [res, ...prev]);
      addNotification("تم الحفظ ✅", "تم حفظ قالب المصروف.", "success");
    } catch (e: any) {
      addNotification("خطأ ⚠️", e.message, "warning");
    }
  }, [addNotification]);

  const value = useMemo(() => ({
    vouchers, setVouchers, expenses, setExpenses, expenseTemplates, setExpenseTemplates,
    wasteRecords, setWasteRecords, exchangeRates, setExchangeRates, expenseCategories, setExpenseCategories,
    addVoucher, addExpense, addWaste, updateExchangeRates, addOpeningBalance, addExpenseTemplate,
    deleteVoucher: (id: string) => dataService.deleteRecord('vouchers', id).then(() => setVouchers(p => p.filter(x => x.id !== id))),
    deleteExpense: (id: string) => dataService.deleteRecord('expenses', id).then(() => setExpenses(p => p.filter(x => x.id !== id))),
    deleteWaste: (id: string) => dataService.deleteRecord('waste', id).then(() => setWasteRecords(p => p.filter(x => x.id !== id))),
    addExpenseCategory: (n: string) => setExpenseCategories(prev => [...prev, n])
  }), [vouchers, expenses, expenseTemplates, wasteRecords, exchangeRates, expenseCategories, addVoucher, addExpense, addWaste, updateExchangeRates, addOpeningBalance, addExpenseTemplate]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => useContext(FinanceContext);
