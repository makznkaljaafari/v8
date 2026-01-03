
// Added setErrorInfo to the return object
import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { financeService } from '../services/financeService';
import { shareToWhatsApp, formatCustomerStatement, formatSupplierStatement } from '../services/shareService';

export const useAIProcessor = () => {
  const { 
    sales, customers, purchases, vouchers, suppliers, categories, exchangeRates,
    addSale, addPurchase, addVoucher, returnSale, returnPurchase, 
    addCustomer, addSupplier, deleteCustomer, deleteSupplier,
    updateExchangeRates, createCloudBackup, addNotification,
    addCategory, deleteCategory
  } = useApp();

  const [pendingAction, setPendingAction] = useState<any>(null);
  const [ambiguityMatches, setAmbiguityMatches] = useState<any[]>([]);
  const [debtWarning, setDebtWarning] = useState<number | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const validateToolCall = useCallback((name: string, args: any) => {
    setErrorInfo(null);
    setDebtWarning(null);
    setAmbiguityMatches([]);

    if (name === 'recordSale') {
      const searchName = args.customer_name.trim();
      const matches = customers.filter(c => c.name.includes(searchName));
      
      if (matches.length === 0) {
        setErrorInfo(`العميل "${searchName}" غير موجود. يرجى إضافته أولاً.`);
        return false;
      }
      if (matches.length > 1) {
        setAmbiguityMatches(matches);
        return true; // سيتم المعالجة عبر اختيار المستخدم
      }
      
      const debts = financeService.getCustomerBalances(matches[0].id, sales, vouchers);
      const yerDebt = debts.find(b => b.currency === (args.currency || 'YER'))?.amount || 0;
      if (yerDebt > 0) setDebtWarning(yerDebt);
    }

    if (name === 'recordVoucher') {
      const list = args.type === 'قبض' ? customers : suppliers;
      const matches = list.filter(p => p.name.includes(args.person_name.trim()));
      if (matches.length === 0) {
        setErrorInfo(`الاسم "${args.person_name}" غير مسجل في القائمة.`);
        return false;
      }
      if (matches.length > 1) {
        setAmbiguityMatches(matches);
        return true;
      }
    }

    return true;
  }, [customers, suppliers, sales, vouchers]);

  const executeAction = useCallback(async (forcedId?: string) => {
    if (!pendingAction) return;
    const { name, args } = pendingAction;

    try {
      switch (name) {
        case 'recordSale': {
          const target = forcedId ? customers.find(c => c.id === forcedId) : customers.find(c => c.name.includes(args.customer_name));
          if (!target) throw new Error("العميل غير موجود");
          await addSale({ ...args, customer_id: target.id, customer_name: target.name, total: args.quantity * args.unit_price, date: new Date().toISOString() });
          break;
        }

        case 'recordReturn': {
          if (args.operation_type === 'بيع') {
            const sale = sales.find(s => s.customer_name.includes(args.person_name) && !s.is_returned);
            if (!sale) throw new Error("لم يتم العثور على الفاتورة");
            await returnSale(sale.id);
          } else {
            const pur = purchases.find(p => p.supplier_name.includes(args.person_name) && !p.is_returned);
            if (!pur) throw new Error("لم يتم العثور على فاتورة المشتريات");
            await returnPurchase(pur.id);
          }
          break;
        }

        case 'managePerson': {
          if (args.action === 'إضافة') {
            if (args.type === 'عميل') await addCustomer({ name: args.name, phone: args.phone || '', address: args.address_region || '' });
            else await addSupplier({ name: args.name, phone: args.phone || '', region: args.address_region || '' });
          } else if (args.action === 'حذف') {
            const person = (args.type === 'عميل' ? customers : suppliers).find(p => p.name.includes(args.name));
            if (person) args.type === 'عميل' ? await deleteCustomer(person.id) : await deleteSupplier(person.id);
          }
          break;
        }

        case 'recordVoucher': {
          const list = args.type === 'قبض' ? customers : suppliers;
          const target = forcedId ? list.find(p => p.id === forcedId) : list.find(p => p.name.includes(args.person_name));
          if (!target) throw new Error("الشخص غير موجود");
          await addVoucher({ ...args, person_id: target.id, person_name: target.name, person_type: args.type === 'قبض' ? 'عميل' : 'مورد', date: new Date().toISOString() });
          break;
        }

        case 'systemControl': {
          if (args.command === 'نسخ_احتياطي') await createCloudBackup();
          else if (args.command === 'تحديث_الصرف') await updateExchangeRates({ SAR_TO_YER: args.sar_rate || exchangeRates.SAR_TO_YER, OMR_TO_YER: args.omr_rate || exchangeRates.OMR_TO_YER });
          break;
        }
      }

      addNotification("تم التنفيذ ✅", "تم تحديث السجلات بنجاح.", "success");
      return true;
    } catch (err: any) {
      addNotification("خطأ ⚠️", err.message || "فشل التنفيذ.", "warning");
      return false;
    } finally {
      setPendingAction(null);
      setAmbiguityMatches([]);
      setErrorInfo(null);
    }
  }, [pendingAction, customers, suppliers, sales, purchases, addSale, addVoucher, createCloudBackup, updateExchangeRates, addNotification, exchangeRates, addCustomer, addSupplier, deleteCustomer, deleteSupplier, returnSale, returnPurchase]);

  return {
    pendingAction, setPendingAction,
    ambiguityMatches, setAmbiguityMatches,
    debtWarning, errorInfo, setErrorInfo,
    validateToolCall, executeAction
  };
};
