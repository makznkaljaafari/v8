
import { Sale, Purchase, Voucher, Customer, Supplier, Expense } from "../types";

export interface BudgetBreakdown {
  currency: string;
  customerDebts: number;    // ديون العملاء لنا (أصل)
  supplierCredits: number;  // دفعاتنا الزائدة للموردين (أصل)
  supplierDebts: number;    // ديون الموردين علينا (خصم)
  customerCredits: number;  // دفعات العملاء الزائدة لنا (خصم)
  assets: number;           // إجمالي الأصول
  liabilities: number;      // إجمالي الخصوم
  cash: number;             // السيولة في الصندوق
  net: number;              // صافي القيمة
}

export const financeService = {
  /**
   * حساب مديونية عميل محدد بكافة العملات
   */
  getCustomerBalances(customerId: string, sales: Sale[], vouchers: Voucher[]) {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      // الديون الناتجة عن مبيعات آجل
      const totalSalesDebt = sales.reduce((sum, s) => {
        if (s.customer_id === customerId && s.status === 'آجل' && s.currency === cur && !s.is_returned) {
          return sum + s.total;
        }
        return sum;
      }, 0);
        
      // الدفعات المستلمة (سندات القبض)
      const totalReceipts = vouchers.reduce((sum, v) => {
        if (v.person_id === customerId && v.type === 'قبض' && v.currency === cur) {
          return sum + v.amount;
        }
        return sum;
      }, 0);

      // إذا كان الناتج موجباً: العميل مدين لنا
      // إذا كان الناتج سالباً: نحن مدينون للعميل (دفع زيادة)
      return { currency: cur, amount: totalSalesDebt - totalReceipts };
    });
  },

  /**
   * حساب مستحقات مورد محدد بكافة العملات
   */
  getSupplierBalances(supplierId: string, purchases: Purchase[], vouchers: Voucher[]) {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      // الديون المستحقة للمورد من مشتريات آجل
      const totalPurchases = purchases.reduce((sum, p) => {
        if (p.supplier_id === supplierId && p.status === 'آجل' && p.currency === cur && !p.is_returned) {
          return sum + p.total;
        }
        return sum;
      }, 0);
        
      // الدفعات المسددة للمورد (سندات الدفع)
      const totalPayments = vouchers.reduce((sum, v) => {
        if (v.person_id === supplierId && v.type === 'دفع' && v.currency === cur) {
          return sum + v.amount;
        }
        return sum;
      }, 0);

      // إذا كان الناتج موجباً: نحن مدينون للمورد
      // إذا كان الناتج سالباً: المورد مدين لنا (دفعنا زيادة)
      return { currency: cur, amount: totalPurchases - totalPayments };
    });
  },

  /**
   * حساب ملخص الميزانية العامة مع تفاصيل دقيقة للديون
   */
  getGlobalBudgetSummary(customers: Customer[], suppliers: Supplier[], sales: Sale[], purchases: Purchase[], vouchers: Voucher[], expenses: Expense[] = []): BudgetBreakdown[] {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      let customerDebts = 0;
      let supplierCredits = 0;
      let supplierDebts = 0;
      let customerCredits = 0;
      let cashInSafe = 0;

      // 1. حساب أرصدة العملاء
      for (const c of customers) {
        const bal = this.getCustomerBalances(c.id, sales, vouchers).find(b => b.currency === cur);
        if (bal) {
          if (bal.amount > 0) customerDebts += bal.amount;
          else if (bal.amount < 0) customerCredits += Math.abs(bal.amount);
        }
      }

      // 2. حساب أرصدة الموردين
      for (const s of suppliers) {
        const bal = this.getSupplierBalances(s.id, purchases, vouchers).find(b => b.currency === cur);
        if (bal) {
          if (bal.amount > 0) supplierDebts += bal.amount;
          else if (bal.amount < 0) supplierCredits += Math.abs(bal.amount);
        }
      }

      // 3. حساب السيولة النقدية (الصندوق)
      const cashSales = sales.filter(s => s.status === 'نقدي' && s.currency === cur && !s.is_returned).reduce((sum, s) => sum + s.total, 0);
      const voucherReceipts = vouchers.filter(v => v.type === 'قبض' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      const cashPurchases = purchases.filter(p => p.status === 'نقدي' && p.currency === cur && !p.is_returned).reduce((sum, p) => sum + p.total, 0);
      const voucherPayments = vouchers.filter(v => v.type === 'دفع' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      const totalExp = (expenses || []).filter(e => e.currency === cur).reduce((sum, e) => sum + e.amount, 0);

      cashInSafe = (cashSales + voucherReceipts) - (cashPurchases + voucherPayments + totalExp);

      const totalAssets = customerDebts + supplierCredits;
      const totalLiabilities = supplierDebts + customerCredits;

      return {
        currency: cur,
        customerDebts,
        supplierCredits,
        supplierDebts,
        customerCredits,
        assets: totalAssets,
        liabilities: totalLiabilities,
        cash: cashInSafe,
        net: cashInSafe + totalAssets - totalLiabilities
      };
    });
  }
};
