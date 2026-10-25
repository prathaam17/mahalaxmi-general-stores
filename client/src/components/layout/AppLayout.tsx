import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import type { AppModule } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
  activeModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  onNewBill: () => void;
  shopName?: string;
  tagline?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeModule,
  onSelectModule,
  onNewBill,
  shopName,
  tagline,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-50">
      {/* Desktop Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={onSelectModule}
        shopName={shopName}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onNewBillClick={onNewBill}
          shopName={shopName}
          tagline={tagline}
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Mobile Navigation Bar */}
        <MobileNav
          activeModule={activeModule}
          onSelectModule={onSelectModule}
        />
      </div>
    </div>
  );
};
