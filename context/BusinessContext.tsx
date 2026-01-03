
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Customer, Supplier, Sale, Purchase } from '../types';
import { dataService } from '../services/dataService';
import { useUI } from './UIContext';
import { useInventory } from './InventoryContext';
import { logger } from '../services/loggerService';

const BusinessContext = createContext<any>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification, triggerFeedback } = useUI();
  const { setCategories } = useInventory(); // لتحديث المخزون عند البيع والشراء
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const addSale = useCallback(async (s: any) => {
    try {
      const saved = await dataService.saveSale(s);
      setSales(prev => [saved, ...prev]);
      // تحديث المخزون
      setCategories((prev: any[]) => prev.map(cat => 
        cat.name === s.qat_type ? { ...cat, stock: Math.max(0, Number(cat.stock) - Number(s.quantity)) } : cat
      ));
      addNotification("تم البيع ✅", "تم تسجيل العملية وخصم المخزون.", "success");
      s.status === 'نقدي' ? triggerFeedback('celebration') : triggerFeedback('debt');
    } catch (e: any) {
      addNotification("خطأ في البيانات ⚠️", e.message, "warning");
    }
  }, [addNotification, triggerFeedback, setCategories]);

  const addPurchase = useCallback(async (p: any) => {
    try {
      const saved = await dataService.savePurchase(p);
      setPurchases(prev => [saved, ...prev]);
      // تحديث المخزون
      setCategories((prev: any[]) => prev.map(cat => 
        cat.name === p.qat_type ? { ...cat, stock: Number(cat.stock) + Number(p.quantity) } : cat
      ));
      addNotification("تم التوريد ✅", "تمت إضافة الكمية للمخزون.", "success");
    } catch (e: any) {
      addNotification("خطأ ⚠️", e.message, "warning");
    }
  }, [addNotification, setCategories]);

  const addCustomer = useCallback(async (c: any) => {
    const saved = await dataService.saveCustomer(c);
    setCustomers(prev => [saved, ...prev]);
    return saved;
  }, []);

  const addSupplier = useCallback(async (s: any) => {
    const saved = await dataService.saveSupplier(s);
    setSuppliers(prev => [saved, ...prev]);
    return saved;
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    try {
      await dataService.deleteRecord('sales', id);
      setSales(prev => prev.filter(s => s.id !== id));
      addNotification("تم الحذف ✅", "تم حذف سجل البيع.", "success");
    } catch (e) {
      addNotification("خطأ ⚠️", "تعذر الحذف.", "warning");
    }
  }, [addNotification]);

  const deletePurchase = useCallback(async (id: string) => {
    try {
      await dataService.deleteRecord('purchases', id);
      setPurchases(prev => prev.filter(p => p.id !== id));
      addNotification("تم الحذف ✅", "تم حذف سجل الشراء.", "success");
    } catch (e) {
      addNotification("خطأ ⚠️", "تعذر الحذف.", "warning");
    }
  }, [addNotification]);

  const returnSale = useCallback(async (id: string) => {
    try {
      const userId = await dataService.getUserId();
      await dataService.returnSale(id);
      addNotification("تم المرتجع ✅", "تمت إعادة الكمية للمخزون.", "success");
      // يفضل إعادة تحميل البيانات كاملة لضمان دقة الأرصدة بعد المرتجع
    } catch (e) {
      logger.error("Return sale error:", e);
    }
  }, [addNotification]);

  const returnPurchase = useCallback(async (id: string) => {
    try {
      await dataService.returnPurchase(id);
      addNotification("تم المرتجع ✅", "تم خصم الكمية من المخزون.", "success");
    } catch (e) {
      logger.error("Return purchase error:", e);
    }
  }, [addNotification]);

  const value = useMemo(() => ({
    customers, setCustomers, suppliers, setSuppliers, sales, setSales, purchases, setPurchases,
    addSale, addPurchase, addCustomer, addSupplier, deleteSale, deletePurchase, returnSale, returnPurchase,
    deleteCustomer: (id: string) => dataService.deleteRecord('customers', id).then(() => setCustomers(p => p.filter(x => x.id !== id))),
    deleteSupplier: (id: string) => dataService.deleteRecord('suppliers', id).then(() => setSuppliers(p => p.filter(x => x.id !== id)))
  }), [customers, suppliers, sales, purchases, addSale, addPurchase, addCustomer, addSupplier, deleteSale, deletePurchase, returnSale, returnPurchase]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export const useBusiness = () => useContext(BusinessContext);
