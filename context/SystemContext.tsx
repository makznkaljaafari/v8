
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ActivityLog } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';
import { useUI } from './UIContext';

const SystemContext = createContext<any>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const createCloudBackup = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = await dataService.getUserId();
      if (!userId) throw new Error("لم يتم العثور على جلسة مستخدم");
      
      const { error } = await supabase.rpc('create_auto_backup', { user_uuid: userId });
      if (error) throw error;
      
      addNotification("تم النسخ الاحتياطي ✅", "تم حفظ نسخة سحابية آمنة لبياناتك.", "success");
    } catch (e: any) {
      addNotification("فشل النسخ ⚠️", e.message || "خطأ في الاتصال بالسيرفر", "warning");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const value = useMemo(() => ({
    isLoading, setIsLoading,
    activityLogs, setActivityLogs,
    connectionError, setConnectionError,
    createCloudBackup
  }), [isLoading, activityLogs, connectionError, createCloudBackup]);

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemProvider');
  return context;
};
