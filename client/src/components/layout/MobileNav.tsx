import React from 'react';
import { LayoutDashboard, Receipt, Package, Users, Wallet } from 'lucide-react';
import type { AppModule } from '../../types';

interface MobileNavProps {
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeModule,
  onSelectModule,
}) => {
  const items: Array<{
    id: AppModule;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'products', label: 'Stock', icon: Package },
    { id: 'customers', label: 'Udhaar', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40 py-1.5 px-2 flex justify-around items-center shadow-lg">
      {items.map((item) => {
        const isActive = activeModule === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onSelectModule(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs transition-colors ${
              isActive
                ? 'text-amber-600 font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-full ${
                isActive ? 'bg-amber-100 text-amber-700' : 'text-stone-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
