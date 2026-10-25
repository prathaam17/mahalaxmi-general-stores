import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { AppModule } from '../../types';

interface SidebarProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  shopName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  shopName = 'Mahalaxmi General Stores',
}) => {
  const navItems: Array<{
    id: AppModule;
    label: string;
    kannadaLabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', kannadaLabel: 'ಮುಖಪುಟ', icon: LayoutDashboard },
    { id: 'billing', label: 'Fast Billing', kannadaLabel: 'ಬಿಲ್ಲಿಂಗ್ (F2)', icon: Receipt, badge: 'F2' },
    { id: 'products', label: 'Products & Stock', kannadaLabel: 'ಸರಕುಗಳು & ದಾಸ್ತಾನು', icon: Package },
    { id: 'customers', label: 'Customers & Udhaar', kannadaLabel: 'ಗ್ರಾಹಕರ ಉದ್ಧಾರ ಖಾತೆ', icon: Users },
    { id: 'suppliers', label: 'Suppliers & Purchases', kannadaLabel: 'ಸರಬರಾಜುದಾರರು', icon: Truck },
    { id: 'expenses', label: 'Expenses & Cash', kannadaLabel: 'ದೈನಂದಿನ ಖರ್ಚುಗಳು', icon: Wallet },
    { id: 'reports', label: 'Reports & Profit', kannadaLabel: 'ವರದಿಗಳು', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Backup', kannadaLabel: 'ಸೆಟ್ಟಿಂಗ್ಸ್', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-200 border-r border-stone-800 shrink-0 select-none">
      {/* Brand header */}
      <div className="p-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
            M
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-white text-sm tracking-tight truncate">
              {shopName}
            </h2>
            <p className="text-[11px] text-amber-400 font-medium truncate">
              Honnavar, Karnataka
            </p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
          Store Operations
        </div>
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                <div className="text-left leading-tight">
                  <div>{item.label}</div>
                  {item.kannadaLabel && (
                    <div className={`text-[10px] ${isActive ? 'text-stone-900/80 font-normal' : 'text-stone-500'}`}>
                      {item.kannadaLabel}
                    </div>
                  )}
                </div>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isActive ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer system status */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/40 text-xs">
        <div className="flex items-center gap-2 text-stone-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <span className="font-semibold text-stone-300">Local Shop SQLite</span>
            <div className="text-[10px] text-stone-500">Atomic WAL Transactions</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
