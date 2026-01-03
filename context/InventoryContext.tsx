
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { QatCategory } from '../types';
import { dataService } from '../services/dataService';
import { useUI } from './UIContext';

const InventoryContext = createContext<any>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useUI();
  const [categories, setCategories] = useState<QatCategory[]>([]);

  const addCategory = useCallback(async (cat: any) => {
    try {
      const saved = await dataService.saveCategory(cat);
      setCategories(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        return idx > -1 ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
      });
      return saved;
    } catch (e: any) {
      addNotification("خطأ ⚠️", e.message || "فشل حفظ الصنف", "warning");
      throw e;
    }
  }, [addNotification]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await dataService.deleteRecord('categories', id);
      setCategories(prev => prev.filter(c => c.id !== id));
      addNotification("تم الحذف 🗑️", "تم حذف الصنف بنجاح.", "success");
    } catch (e) {
      addNotification("عذراً ⚠️", "لا يمكن الحذف لوجود عمليات مرتبطة.", "warning");
    }
  }, [addNotification]);

  const value = useMemo(() => ({
    categories, setCategories, addCategory, deleteCategory
  }), [categories, addCategory, deleteCategory]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
