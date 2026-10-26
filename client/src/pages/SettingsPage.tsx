import React, { useState, useEffect } from 'react';
import {
  Store,
  Database,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  FileText,
  Search,
  Filter,
  Clock,
  Save,
  Check,
  Info,
  Printer,
} from 'lucide-react';
import {
  fetchShopSettings,
  updateShopSettings,
  fetchDatabaseStatus,
  fetchAuditLogs,
  restoreDatabaseBackup,
} from '../services/api';
import type {
  ShopSettingsData,
  DatabaseStatusInfo,
  AuditLogEntry,
} from '../types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'database' | 'audit'>('store');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);
  const [settingsErrorMsg, setSettingsErrorMsg] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState<ShopSettingsData>({
    shopName: 'Mahalaxmi General Stores',
    tagline: 'Daily Provisions, Spices & Loose Goods',
    address: 'Main Road, Near Bus Stand, Honnavar - 581334, Uttara Kannada',
    phone: '+91 98450 12345',
    gstin: '29AAAAA0000A1Z5',
    currencySymbol: '₹',
    receiptFooter: 'ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ. (Thank you! Visit again.)',
    gstEnabled: true,
    defaultGstRate: 5,
    isDemoMode: true,
  });

  // Database Status State
  const [dbStatus, setDbStatus] = useState<DatabaseStatusInfo | null>(null);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState<string>('');
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [settingsRes, dbStatusRes, auditRes] = await Promise.all([
        fetchShopSettings(),
        fetchDatabaseStatus(),
        fetchAuditLogs({ limit: 50 }),
      ]);
      setSettings(settingsRes);
      setDbStatus(dbStatusRes);
      setAuditLogs(auditRes);
    } catch (err: unknown) {
      console.error('Failed to load initial settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccessMsg(null);
    setSettingsErrorMsg(null);

    try {
      const updated = await updateShopSettings(settings);
      setSettings(updated);
      setSettingsSuccessMsg('ಅಂಗಡಿ ಸೆಟ್ಟಿಂಗ್ಸ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ (Store settings saved successfully).');
      setTimeout(() => setSettingsSuccessMsg(null), 4000);
      // Refresh audit logs
      const updatedAudit = await fetchAuditLogs({ limit: 50 });
      setAuditLogs(updatedAudit);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      setSettingsErrorMsg(message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRefreshAudit = async () => {
    setAuditLoading(true);
    try {
      const logs = await fetchAuditLogs({
        search: auditSearch || undefined,
        action: auditActionFilter === 'ALL' ? undefined : auditActionFilter,
        limit: 100,
      });
      setAuditLogs(logs);
    } catch (err: unknown) {
      console.error('Failed to refresh audit trail:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;
    if (restoreConfirmText !== 'RESTORE') {
      alert('Please type RESTORE in capital letters to confirm replacement.');
      return;
    }

    setRestoring(true);
    setRestoreResult(null);

    try {
      const result = await restoreDatabaseBackup(restoreFile);
      setRestoreResult({
        success: true,
        message: result.message || 'Database restored successfully! The page will refresh.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restore database';
      setRestoreResult({
        success: false,
        message: msg,
      });
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'BILL_CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CUSTOMER_CREDIT_PAYMENT':
      case 'CUSTOMER_PAYMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUPPLIER_PAYMENT':
      case 'PURCHASE_RECEIVE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXPENSE_RECORD':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CASH_REGISTER_CLOSE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SETTINGS_UPDATE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DATABASE_RESTORE':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <span>ಅಂಗಡಿ ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ಬ್ಯಾಕಪ್</span>
            <span className="text-stone-400 font-normal text-lg">|</span>
            <span className="text-amber-800 text-lg font-semibold">Settings & Backup</span>
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Configure shop profile, GST rates, offline SQLite backups, and inspect audit logs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-sm font-medium">
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'store'
                ? 'bg-white text-stone-900 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Store Profile & GST</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'database'
                ? 'bg-white text-stone-900 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-4 h-4 text-amber-600" />
            <span>Backup & Restore</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'audit'
                ? 'bg-white text-stone-900 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
          <p className="font-medium">Loading settings and database status...</p>
        </div>
      ) : null}

      {/* TAB 1: STORE PROFILE & GST */}
      {!loading && activeTab === 'store' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 max-w-4xl">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            {settingsSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium">{settingsSuccessMsg}</span>
              </div>
            )}

            {settingsErrorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span className="text-sm font-medium">{settingsErrorMsg}</span>
              </div>
            )}

            <div className="border-b border-stone-200 pb-4">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <span>ಅಂಗಡಿ ಗುರುತು & ಮಾಹಿತಿ (Store Profile)</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                These details appear on thermal printable customer receipts and account statements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Shop Name (ಅಂಗಡಿಯ ಹೆಸರು) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.shopName}
                  onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Tagline / Sub-heading
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Shop Address (ವಿಳಾಸ) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Phone / Mobile Number (ದೂರವಾಣಿ ಸಂಖ್ಯೆ)
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  GSTIN (ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Receipt Footer Message (ರಸೀದಿ ಕೊನೆಯ ಸಂದೇಶ)
                </label>
                <input
                  type="text"
                  value={settings.receiptFooter}
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  placeholder="e.g. ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ. (Thank you! Visit again.)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            {/* GST & Tax Settings */}
            <div className="border-t border-stone-200 pt-6">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>ತೆರಿಗೆ ಮತ್ತು ಜಿಎಸ್‌ಟಿ ಕಾನ್ಫಿಗರೇಶನ್ (Tax & GST Settings)</span>
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                Enable or disable GST inclusion on receipts and set default tax percentage for new items.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="gstEnabled"
                    checked={settings.gstEnabled}
                    onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <label htmlFor="gstEnabled" className="text-sm font-semibold text-stone-800 cursor-pointer">
                    Enable GST on Invoices & Bills (ಜಿಎಸ್‌ಟಿ ಬಿಲ್ಲಿಂಗ್ ಸಕ್ರಿಯಗೊಳಿಸಿ)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Default GST Rate (%)
                  </label>
                  <select
                    value={settings.defaultGstRate}
                    onChange={(e) => setSettings({ ...settings, defaultGstRate: Number(e.target.value) })}
                    disabled={!settings.gstEnabled}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-sm disabled:bg-stone-100 disabled:text-stone-400"
                  >
                    <option value={0}>0% (Tax Exempt / Loose Goods)</option>
                    <option value={5}>5% (Basic Groceries & Edible Oils)</option>
                    <option value={12}>12% (Packaged Foods & Dairy)</option>
                    <option value={18}>18% (Soaps, Detergents & Household)</option>
                    <option value={28}>28% (Luxury items)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Billing Style & Handwritten Slip Preferences */}
            <div className="border-t border-stone-200 pt-6">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 mb-1">
                <Printer className="w-5 h-5 text-amber-600" />
                <span>ಬಿಲ್ಲಿಂಗ್ ಶೈಲಿ & ರಸೀದಿ (Billing Style & Receipt Mode)</span>
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                Configure how the billing counter operates for handwritten receipts versus thermal printers.
              </p>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">
                      ಹಸ್ತಪ್ರತಿ ಬಿಲ್ ಶೈಲಿ (Handwritten Paper Bills)
                    </span>
                    <p className="text-stone-600 text-xs mt-0.5">
                      Since your shop uses handwritten paper bills or memo slips, the counter saves sales directly, decrements inventory stock, and updates customer Udhaar and the cash drawer without opening intrusive print popups.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoPrintReceipt"
                    checked={Boolean(settings.autoPrintReceipt)}
                    onChange={(e) => setSettings({ ...settings, autoPrintReceipt: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <label htmlFor="autoPrintReceipt" className="text-xs font-semibold text-stone-700 cursor-pointer">
                    Auto-open printable receipt popup after checkout (ರಸೀದಿ ಮುದ್ರಣ ಪಾಪ್-ಅಪ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತೆರೆಯಿರಿ)
                  </label>
                </div>
              </div>
            </div>

            {/* Mode & Environment */}
            <div className="border-t border-stone-200 pt-6">
              <div className="flex items-start gap-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">ಡೆಮೊ ಮೋಡ್ ಸೂಚನೆ (Demo Mode Notice): </span>
                  The application is currently running with realistic demo sample data for Honnavar goods. All financial
                  reversals, credit transactions, and stock movements are stored in the local SQLite database.
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow transition-colors disabled:opacity-60"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ಉಳಿಸಲಾಗುತ್ತಿದೆ (Saving...)...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ (Save Changes)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: DATABASE BACKUP & RESTORE */}
      {!loading && activeTab === 'database' && (
        <div className="space-y-6 max-w-4xl">
          {/* Database Health Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2 mb-1">
              <HardDrive className="w-5 h-5 text-amber-600" />
              <span>ಸ್ಥಳೀಯ SQLite ಡೇಟಾಬೇಸ್ ಸ್ಥಿತಿ (Local SQLite Database Health)</span>
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              High-performance, offline-first local storage located outside public web directories.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Database Engine
                </span>
                <span className="text-base font-bold text-stone-900">
                  SQLite {dbStatus?.sqliteVersion || 'v3.x'}
                </span>
                <span className="text-xs text-emerald-600 block mt-1 font-medium">Native Node.js</span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Journal Mode
                </span>
                <span className="text-base font-bold text-stone-900">
                  {dbStatus?.isWalMode ? 'WAL Mode' : 'Standard'}
                </span>
                <span className="text-xs text-emerald-600 block mt-1 font-medium">Non-blocking Concurrent</span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Database File Size
                </span>
                <span className="text-base font-bold text-stone-900">
                  {dbStatus ? formatFileSize(dbStatus.sizeBytes) : '—'}
                </span>
                <span className="text-xs text-stone-500 block mt-1">
                  WAL Buffer: {dbStatus ? formatFileSize(dbStatus.walSizeBytes) : '0 B'}
                </span>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Last Checkpoint
                </span>
                <span className="text-sm font-semibold text-stone-900 truncate block">
                  {dbStatus?.lastModified ? new Date(dbStatus.lastModified).toLocaleTimeString('en-IN') : 'Active'}
                </span>
                <span className="text-xs text-stone-500 block mt-1">
                  {dbStatus?.lastModified ? new Date(dbStatus.lastModified).toLocaleDateString('en-IN') : ''}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
              <span className="font-mono text-stone-700 truncate mr-2">
                Path: {dbStatus?.dbPath || 'data/mahalaxmi.db'}
              </span>
              <button
                onClick={loadInitialData}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-lg border border-stone-200 shadow-sm transition-colors text-xs flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Download Backup */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">
                  ಡೇಟಾಬೇಸ್ ಬ್ಯಾಕಪ್ ಡೌನ್‌ಲೋಡ್ (Download Backup)
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Instantly flushes WAL write buffers to disk and generates a complete, clean, self-contained{' '}
                  <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">.db</code> copy of all
                  bills, inventory, suppliers, cash records, and customer credit ledger.
                </p>
                <div className="text-xs bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 mb-4">
                  💡 <strong>ಅಂಗಡಿಯವರಿಗೆ ಕಿವಿಮಾತು (Shopkeeper Tip):</strong> Download a backup file at the end of every
                  business day and copy it to a USB pen drive.
                </div>
              </div>

              <a
                href="/api/settings/backup"
                download
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm shadow transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>ಬ್ಯಾಕಪ್ ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (Download Backup File)</span>
              </a>
            </div>

            {/* Restore Database */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">
                  ಡೇಟಾಬೇಸ್ ಮರುಸ್ಥಾಪನೆ (Restore Database Backup)
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Restore your entire shop database from a previously downloaded <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">.db</code> file.
                  The system automatically archives a safety rollback copy before applying the restored file.
                </p>
                <div className="text-xs bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-900 mb-4">
                  ⚠️ <strong>ಎಚ್ಚರಿಕೆ (Warning):</strong> Restoring replaces current store data with the backup file. Use this
                  only when setting up a new computer or recovering from hardware failure.
                </div>
              </div>

              <button
                onClick={() => {
                  setRestoreResult(null);
                  setRestoreConfirmText('');
                  setRestoreFile(null);
                  setShowRestoreModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>ಬ್ಯಾಕಪ್ ಮರುಸ್ಥಾಪಿಸಿ (Restore from File...)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {!loading && activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>ವಹಿವಾಟು ಆಡಿಟ್ ಲಾಗ್ (Transaction Audit Trail)</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Immutable, append-only security record tracking every checkout, payment, supplier purchase, and system configuration.
              </p>
            </div>

            <button
              onClick={handleRefreshAudit}
              disabled={auditLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${auditLoading ? 'animate-spin' : ''}`} />
              <span>ತಾಜಾಗೊಳಿಸಿ (Refresh Logs)</span>
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail by entity, notes, or action..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRefreshAudit()}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                }}
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Event Types</option>
                <option value="BILL_CREATE">BILL_CREATE (ಮಾರಾಟ ಬಿಲ್‌ಗಳು)</option>
                <option value="CUSTOMER_CREDIT_PAYMENT">CUSTOMER_CREDIT_PAYMENT (ಗ್ರಾಹಕರ ಜಮಾ)</option>
                <option value="PURCHASE_RECEIVE">PURCHASE_RECEIVE (ಖರೀದಿ ವಿವರ)</option>
                <option value="SUPPLIER_PAYMENT">SUPPLIER_PAYMENT (ಸರಬರಾಜುದಾರರಿಗೆ ಪಾವತಿ)</option>
                <option value="EXPENSE_RECORD">EXPENSE_RECORD (ಖರ್ಚು ದಾಖಲು)</option>
                <option value="CASH_REGISTER_CLOSE">CASH_REGISTER_CLOSE (ಕ್ಯಾಶ್ ಕ್ಲೋಸಿಂಗ್)</option>
                <option value="SETTINGS_UPDATE">SETTINGS_UPDATE (ಸೆಟ್ಟಿಂಗ್ಸ್)</option>
                <option value="DATABASE_RESTORE">DATABASE_RESTORE (ಡೇಟಾಬೇಸ್ ಮರುಸ್ಥಾಪನೆ)</option>
              </select>

              <button
                onClick={handleRefreshAudit}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Event Details & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-500">
                      No audit events match your selected filters.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-stone-700">
                        {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-stone-400 flex items-center justify-between">
            <span>Showing up to {auditLogs.length} audit entries</span>
            <span>Recorded in local SQLite WAL store</span>
          </div>
        </div>
      )}

      {/* RESTORE DATABASE MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  ಡೇಟಾಬೇಸ್ ಮರುಸ್ಥಾಪನೆ ದೃಢೀಕರಣ (Confirm Database Restore)
                </h3>
                <p className="text-xs text-stone-500">
                  Replace current store database with an uploaded backup file.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs p-3.5 rounded-xl space-y-1.5">
              <p className="font-bold">⚠️ ಗಮನಿಸಿ (Critical Safety Notice):</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>All active transactions in memory will be closed.</li>
                <li>An automatic safety rollback file will be created in <code className="font-mono bg-rose-100 px-1 py-0.2 rounded">data/</code>.</li>
                <li>The page will automatically reload upon successful verification.</li>
              </ul>
            </div>

            {restoreResult && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  restoreResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {restoreResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{restoreResult.message}</span>
              </div>
            )}

            <form onSubmit={handleRestoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Select Backup File (.db / .sqlite) *
                </label>
                <input
                  type="file"
                  required
                  accept=".db,.sqlite,.sqlite3"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setRestoreFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100 border border-stone-300 rounded-xl p-1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Type <span className="font-mono font-bold text-rose-600">RESTORE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="RESTORE"
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => setShowRestoreModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoring || !restoreFile || restoreConfirmText !== 'RESTORE'}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow transition-colors disabled:opacity-50"
                >
                  {restoring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ಮರುಸ್ಥಾಪಿಸಲಾಗುತ್ತಿದೆ (Restoring...)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>ಖಚಿತಪಡಿಸಿ ಮರುಸ್ಥಾಪಿಸಿ (Confirm Restore)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
