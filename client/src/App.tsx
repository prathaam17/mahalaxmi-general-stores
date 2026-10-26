import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { ProductsPage } from './pages/ProductsPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { fetchDashboardSummary } from './services/api';
import type { DashboardSummary, AppModule } from './types';

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

    if (activeModule === 'settings') {
      return <SettingsPage />;
    }

    return (
      <DashboardPage
        summary={summary}
        loading={loading}
        error={error}
        onNavigate={(mod) => setActiveModule(mod)}
        onRefresh={loadData}
      />
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
