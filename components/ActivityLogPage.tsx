
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { dataService } from '../services/dataService';
import { ActivityLog } from '../types';

const ActivityLogPage: React.FC = () => {
  const { navigate } = useApp();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await dataService.getActivityLogs();
      setLogs(data);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'sale': return '💰';
      case 'purchase': return '📦';
      case 'voucher': return '📥';
      case 'waste': return '🥀';
      default: return '🛡️';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'sale': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'purchase': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'voucher': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
      case 'waste': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <PageLayout title="سجل الرقابة السحابي" onBack={() => navigate('dashboard')}>
      <div className="space-y-8 lg:space-y-12 pb-32 max-w-7xl mx-auto w-full px-1">
        
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 lg:p-12 rounded-[3rem] border-2 border-dashed border-emerald-200 dark:border-emerald-800/30">
           <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-right">
              <span className="text-5xl lg:text-7xl">🛡️</span>
              <div>
                 <h3 className="text-xl lg:text-3xl font-black text-emerald-900 dark:text-emerald-300 mb-2">نظام الأرشفة الزمنية (Audit Log)</h3>
                 <p className="text-sm lg:text-lg font-bold text-emerald-700/60 dark:text-emerald-400/60 leading-relaxed">تتم مراقبة كافة التحركات المالية وحذف السجلات وتوثيق المرتجعات آلياً لضمان أعلى مستويات الرقابة المالية ومصداقية الحسابات.</p>
              </div>
           </div>
        </div>

        {/* Wide Activity Table */}
        <div className="overflow-hidden rounded-[3rem] shadow-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-8 font-black text-xs uppercase tracking-widest text-center w-24">الترتيب</th>
                  <th className="p-8 font-black text-xs uppercase tracking-widest text-center w-32">نوع العملية</th>
                  <th className="p-8 font-black text-xs uppercase tracking-widest">التوقيت الدقيق</th>
                  <th className="p-8 font-black text-xs uppercase tracking-widest">الإجراء المنفذ</th>
                  <th className="p-8 font-black text-xs uppercase tracking-widest">بيانات العملية واللوغ السحابي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-40 text-center"><div className="w-16 h-16 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto shadow-2xl"></div></td></tr>
                ) : logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                    <td className="p-8 text-center font-black text-slate-300 group-hover:text-emerald-500 text-xl">{idx + 1}</td>
                    <td className="p-8 text-center">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner border transition-transform group-hover:scale-110 ${getTypeColor(log.type)}`}>
                        {getTypeIcon(log.type)}
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="font-black text-lg text-slate-900 dark:text-white tabular-nums">{new Date(log.timestamp).toLocaleTimeString('ar-YE')}</p>
                      <p className="text-[10px] lg:text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">{new Date(log.timestamp).toLocaleDateString('ar-YE')}</p>
                    </td>
                    <td className="p-8 font-black text-slate-900 dark:text-white text-lg lg:text-2xl leading-none">{log.action}</td>
                    <td className="p-8">
                       <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 max-w-2xl">
                          <p className="font-bold text-xs lg:text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">"{log.details}"</p>
                       </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && logs.length === 0 && <tr><td colSpan={5} className="p-40 text-center opacity-30 font-black text-3xl italic">لا توجد تحركات مسجلة حالياً</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ActivityLogPage;
