
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { InventoryProvider, useInventory } from './InventoryContext';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { FinanceProvider, useFinance } from './FinanceContext';
import { SystemProvider, useSystem } from './SystemContext';
import { dataService } from '../services/dataService';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { logger } from '../services/loggerService';

const DataContext = createContext<any>(undefined);

const DataProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNotifications, addNotification } = useUI();
  const { setUser } = useAuth();
  
  const inv = useInventory();
  const bus = useBusiness();
  const fin = useFinance();
  const sys = useSystem();

  const loadAllData = useCallback(async (userId: string) => {
    if (!userId || sys.isLoading) return;
    sys.setIsLoading(true);
    try {
      await dataService.ensureUserExists(userId);
      const results = await Promise.allSettled([
        dataService.getFullProfile(userId), dataService.getCustomers(), dataService.getSuppliers(),
        dataService.getSales(), dataService.getPurchases(), dataService.getVouchers(),
        dataService.getCategories(), dataService.getExpenses(), dataService.getActivityLogs(),
        dataService.getWaste(), dataService.getNotifications(), dataService.getExpenseTemplates()
      ]);

      const [p, c, s, sl, pr, v, cat, ex, logs, wst, ntf, tmp] = results;

      if (p.status === 'fulfilled' && p.value) {
        setUser(p.value);
        if (p.value.exchange_rates) fin.setExchangeRates(p.value.exchange_rates);
      }
      
      if (c.status === 'fulfilled') bus.setCustomers(c.value);
      if (s.status === 'fulfilled') bus.setSuppliers(s.value);
      if (sl.status === 'fulfilled') bus.setSales(sl.value);
      if (pr.status === 'fulfilled') bus.setPurchases(pr.value);
      if (v.status === 'fulfilled') fin.setVouchers(v.value);
      if (cat.status === 'fulfilled') inv.setCategories(cat.value);
      if (ex.status === 'fulfilled') fin.setExpenses(ex.value);
      if (logs.status === 'fulfilled') sys.setActivityLogs(logs.value);
      if (wst.status === 'fulfilled') fin.setWasteRecords(wst.value);
      if (ntf.status === 'fulfilled') setNotifications(ntf.value);
      if (tmp.status === 'fulfilled') fin.setExpenseTemplates(tmp.value);
      
      sys.setConnectionError(null);
    } catch (e: any) {
      logger.error("Error loading data:", e);
      sys.setConnectionError("وضع الأوفلاين نشط 📡");
    } finally {
      sys.setIsLoading(false);
    }
  }, [setUser, setNotifications, fin, bus, inv, sys]);

  const value = useMemo(() => ({
    ...inv, 
    ...bus, 
    ...fin,
    ...sys,
    loadAllData
  }), [inv, bus, fin, sys, loadAllData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SystemProvider>
    <InventoryProvider>
      <BusinessProvider>
        <FinanceProvider>
          <DataProviderInner>{children}</DataProviderInner>
        </FinanceProvider>
      </BusinessProvider>
    </InventoryProvider>
  </SystemProvider>
);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
