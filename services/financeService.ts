
import { Sale, Purchase, Voucher, Customer, Supplier, Expense } from "../types";

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

      return { currency: cur, amount: totalPurchases - totalPayments };
    });
  },

  /**
   * حساب ملخص الميزانية العامة (أصول، خصوم، وصندوق)
   * تم تحسين الحساب ليشمل كافة العمليات النقدية والسندات
   */
  getGlobalBudgetSummary(customers: Customer[], suppliers: Supplier[], sales: Sale[], purchases: Purchase[], vouchers: Voucher[], expenses: Expense[] = []) {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      let totalAssets = 0;      // ديون العملاء (لنا)
      let totalLiabilities = 0; // ديون الموردين (علينا)
      let cashInSafe = 0;       // رصيد الصندوق (السيولة المتوفرة)

      // 1. حساب إجمالي الديون المستحقة لنا عند العملاء
      for (const c of customers) {
        const bal = this.getCustomerBalances(c.id, sales, vouchers).find(b => b.currency === cur);
        if (bal && bal.amount > 0) totalAssets += bal.amount;
      }

      // 2. حساب إجمالي الديون المستحقة علينا للموردين
      for (const s of suppliers) {
        const bal = this.getSupplierBalances(s.id, purchases, vouchers).find(b => b.currency === cur);
        if (bal && bal.amount > 0) totalLiabilities += bal.amount;
      }

      // 3. حساب السيولة النقدية في الصندوق (الرصيد الفعلي الملموس)
      // (+) مبيعات نقدي
      const cashSales = sales.filter(s => s.status === 'نقدي' && s.currency === cur && !s.is_returned).reduce((sum, s) => sum + s.total, 0);
      // (+) سندات قبض (من عملاء أو غيرهم)
      const voucherReceipts = vouchers.filter(v => v.type === 'قبض' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      
      // (-) مشتريات نقدي
      const cashPurchases = purchases.filter(p => p.status === 'نقدي' && p.currency === cur && !p.is_returned).reduce((sum, p) => sum + p.total, 0);
      // (-) سندات دفع (لموردين أو غيرهم)
      const voucherPayments = vouchers.filter(v => v.type === 'دفع' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      // (-) مصاريف عامة
      const totalExp = (expenses || []).filter(e => e.currency === cur).reduce((sum, e) => sum + e.amount, 0);

      // المعادلة: (كل الداخل نقداً) - (كل الخارج نقداً)
      cashInSafe = (cashSales + voucherReceipts) - (cashPurchases + voucherPayments + totalExp);

      return {
        currency: cur,
        assets: totalAssets,
        liabilities: totalLiabilities,
        cash: cashInSafe,
        net: cashInSafe + totalAssets - totalLiabilities // صافي المركز المالي
      };
    });
  }
};
