
import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { FeedbackOverlay } from './components/ui/FeedbackOverlay';

// تحميل المكونات بشكل كسلان (Lazy Loading)
const Dashboard = lazy(() => import('./components/Dashboard'));
const SalesList = lazy(() => import('./components/SalesList'));
const AddSale = lazy(() => import('./components/AddSale'));
const PurchasesList = lazy(() => import('./components/PurchasesList'));
const AddPurchase = lazy(() => import('./components/AddPurchase'));
const CustomersList = lazy(() => import('./components/CustomersList'));
const AddCustomer = lazy(() => import('./components/AddCustomer'));
const SuppliersList = lazy(() => import('./components/SuppliersList'));
const AddSupplier = lazy(() => import('./components/AddSupplier'));
const CategoriesList = lazy(() => import('./components/CategoriesList'));
const AddCategory = lazy(() => import('./components/AddCategory'));
const VouchersList = lazy(() => import('./components/VouchersList'));
const AddVoucher = lazy(() => import('./components/AddVoucher'));
const AIAdvisor = lazy(() => import('./components/AIAdvisor'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const ExpensesList = lazy(() => import('./components/ExpensesList'));
const AddExpense = lazy(() => import('./components/AddExpense'));
const DebtsReport = lazy(() => import('./components/DebtsReport'));
const AddOpeningBalance = lazy(() => import('./components/AddOpeningBalance'));
const Reports = lazy(() => import('./components/Reports'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const BarcodeScanner = lazy(() => import('./components/BarcodeScanner'));
const BottomNav = lazy(() => import('./components/BottomNav'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const VoiceAssistant = lazy(() => import('./components/VoiceAssistant'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const VisualInvoice = lazy(() => import('./components/VisualInvoice'));
const WasteList = lazy(() => import('./components/WasteList'));
const AddWaste = lazy(() => import('./components/AddWaste'));
const ActivityLogPage = lazy(() => import('./components/ActivityLogPage'));
const ReturnsList = lazy(() => import('./components/ReturnsList'));
const AccountStatement = lazy(() => import('./components/AccountStatement'));

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-dark-bg/50 backdrop-blur-sm">
    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-[100]">
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
      <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl animate-bounce-soft relative z-10 border-4 border-white/10">
        🌿
      </div>
    </div>
    <div className="mt-8 flex flex-col items-center gap-2">
      <h2 className="text-white font-black text-xl tracking-tighter">وكالة الشويع للقات</h2>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      </div>
      <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.3em] mt-4">جاري تحميل النظام السحابي</p>
    </div>
  </div>
);

const AppContent = () => {
  const { currentPage, theme, isLoggedIn, isCheckingSession, activeToasts, removeToast } = useApp();

  if (isCheckingSession) return <SplashScreen />;

  const renderPage = () => {
    if (!isLoggedIn) return <LoginPage />;

    return (
      <Suspense fallback={<LoadingFallback />}>
        {(() => {
          switch (currentPage) {
            case 'dashboard': return <Dashboard />;
            case 'sales': return <SalesList />;
            case 'add-sale': return <AddSale />;
            case 'purchases': return <PurchasesList />;
            case 'add-purchase': return <AddPurchase />;
            case 'customers': return <CustomersList />;
            case 'add-customer': return <AddCustomer />;
            case 'suppliers': return <SuppliersList />;
            case 'add-supplier': return <AddSupplier />;
            case 'categories': return <CategoriesList />;
            case 'add-category': return <AddCategory />;
            case 'vouchers': return <VouchersList />;
            case 'add-voucher': return <AddVoucher />;
            case 'expenses': return <ExpensesList />;
            case 'add-expense': return <AddExpense />;
            case 'waste': return <WasteList />;
            case 'add-waste': return <AddWaste />;
            case 'returns': return <ReturnsList />;
            case 'debts': return <DebtsReport />;
            case 'add-opening-balance': return <AddOpeningBalance />;
            case 'reports': return <Reports />;
            case 'settings': return <SettingsPage />;
            case 'ai-advisor': return <AIAdvisor />;
            case 'notifications': return <NotificationsPage />;
            case 'scanner': return <BarcodeScanner />;
            case 'invoice-view': return <VisualInvoice />;
            case 'activity-log': return <ActivityLogPage />;
            case 'account-statement': return <AccountStatement />;
            case 'login': return <LoginPage />;
            default: return <Dashboard />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className={`min-h-screen flex flex-row relative overflow-hidden w-full transition-colors duration-500 ${theme === 'dark' ? 'dark bg-dark-bg' : 'bg-light-bg'}`}>
      <ToastContainer toasts={activeToasts} removeToast={removeToast} />
      <FeedbackOverlay />
      
      {isLoggedIn && <Sidebar />}

      <div className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar relative">
        {renderPage()}
        {isLoggedIn && <BottomNav />}
      </div>
      
      {isLoggedIn && <VoiceAssistant />}
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ErrorBoundary>
);

export default App;
