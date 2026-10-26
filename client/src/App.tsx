import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { fetchDashboardSummary } from './services/api';
import type { DashboardSummary, AppModule } from './types';
import {
  Receipt,
  Package,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to local shop database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global keyboard shortcut: F2 triggers billing module
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveModule('billing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewBill = () => {
    setActiveModule('billing');
  };

  const renderModuleContent = () => {
    if (activeModule === 'dashboard') {
      return (
        <DashboardPage
          summary={summary}
          loading={loading}
          error={error}
          onNavigate={(mod) => setActiveModule(mod)}
          onRefresh={loadData}
        />
      );
    }

    if (activeModule === 'billing') {
      return <BillingPage />;
    }

    if (activeModule === 'products') {
      return <ProductsPage />;
    }

    if (activeModule === 'customers') {
      return <CustomersPage />;
    }

    if (activeModule === 'suppliers') {
      return <SuppliersPage />;
    }

    if (activeModule === 'expenses') {
      return <ExpensesPage />;
    }

    if (activeModule === 'reports') {
      return <ReportsPage />;
    }

    const placeholderConfig = {
      billing: {
        title: 'Fast Billing & Receipt Printing (Next Stage)',
        kannada: 'ವೇಗದ ಬಿಲ್ಲಿಂಗ್ & ರಸೀದಿ ಮುದ್ರಣ',
        icon: Receipt,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        desc: 'Stage 2 will deliver the full fast billing screen with barcode scanning, loose goods (kg/g) pricing, cash/UPI/credit payment modes, and thermal receipt printing.',
      },
      products: {
        title: 'Product, Category & Loose Goods Inventory',
        kannada: 'ಸರಕುಗಳು, ವಿಭಾಗಗಳು ಮತ್ತು ದಾಸ್ತಾನು',
        icon: Package,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        desc: 'Manage packaged goods, loose goods (rice, sugar, dal, jaggery), barcode lookups, wholesale cost prices, selling rates, and stock alerts.',
      },
      customers: {
        title: 'Customer Credit & Udhaar Ledger',
        kannada: 'ಗ್ರಾಹಕರ ಉದ್ಧಾರ ಖಾತೆ',
        icon: Users,
        color: 'text-sky-600',
        bg: 'bg-sky-50',
        desc: 'Track regular customer credit balances, credit limits, repayments, and print or share customer account statements.',
      },
      suppliers: {
        title: 'Suppliers & Stock Purchases',
        kannada: 'ಸರಬರಾಜುದಾರರು ಮತ್ತು ಖರೀದಿ ವಿವರಗಳು',
        icon: Truck,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        desc: 'Track local distributors (Kamat Wholesale, Canara Dairy Agency), purchase invoices, and payable balances.',
      },
      expenses: {
        title: 'Daily Expenses & Cash Drawer Tracking',
        kannada: 'ದೈನಂದಿನ ಖರ್ಚುಗಳು',
        icon: Wallet,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        desc: 'Record tea/snacks, electricity, rent, plastic bags, and reconcile daily cash in hand at the close of the shop.',
      },
      reports: {
        title: 'Sales & Gross Profit Reports',
        kannada: 'ದೈನಂದಿನ, ಮಾಸಿಕ & ವಾರ್ಷಿಕ ವರದಿಗಳು',
        icon: BarChart3,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        desc: 'Daily, monthly, and yearly sales graphs, top-selling items, cash vs digital split, and estimated gross & net profit margins.',
      },
      settings: {
        title: 'Store Settings & Local Backup System',
        kannada: 'ಅಂಗಡಿಯ ವಿವರಗಳು ಮತ್ತು ಬ್ಯಾಕಪ್',
        icon: Settings,
        color: 'text-stone-600',
        bg: 'bg-stone-100',
        desc: 'Edit shop name, Honnavar address, phone number, GSTIN, receipt footer note, and perform one-click SQLite database backups.',
      },
    }[activeModule];

    const Icon = placeholderConfig.icon;

    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-3xl mx-auto shadow-sm text-center space-y-5 my-8">
        <div className={`w-16 h-16 rounded-2xl ${placeholderConfig.bg} ${placeholderConfig.color} mx-auto flex items-center justify-center shadow-xs`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wider">
            Foundation Stage Complete
          </span>
          <h2 className="text-xl font-bold text-stone-900 pt-2">{placeholderConfig.title}</h2>
          <p className="text-sm text-amber-800 font-medium">{placeholderConfig.kannada}</p>
        </div>
        <p className="text-stone-600 text-sm max-w-xl mx-auto leading-relaxed">
          {placeholderConfig.desc}
        </p>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 max-w-lg mx-auto text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-stone-900">Database Schema is already prepared:</span>
            <p className="mt-0.5 text-stone-500">
              The SQLite tables for this module (and realistic Honnavar sample data) are already created and verified in migration 001. The dedicated user interface will be built in the next step.
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => setActiveModule('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-sm shadow-xs transition-colors"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      onNewBill={handleNewBill}
      shopName={summary?.shopInfo.shopName}
      tagline={summary?.shopInfo.tagline}
    >
      {renderModuleContent()}
    </AppLayout>
  );
}

export default App;
