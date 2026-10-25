import React, { useState, useEffect } from 'react';
import { Store, Wifi, Clock, PlusCircle } from 'lucide-react';

interface HeaderProps {
  onNewBillClick?: () => void;
  shopName?: string;
  tagline?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onNewBillClick,
  shopName = 'Mahalaxmi General Stores',
  tagline = 'Honnavar, Karnataka',
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 lg:px-6 py-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Store identity for mobile/tablet & breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-900 text-base lg:text-lg leading-tight">
                {shopName}
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
                {tagline}
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Daily Provisions & Loose Goods POS • Local Offline Database
            </p>
          </div>
        </div>

        {/* Right: Actions, Clock & Offline status badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Offline local system indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Shop Local Server</span>
            <span>Online</span>
          </div>

          {/* Time & Date */}
          <div className="hidden lg:flex flex-col items-end text-xs text-stone-600 border-l border-stone-200 pl-4">
            <div className="flex items-center gap-1.5 font-medium text-stone-800">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{time}</span>
            </div>
            <span className="text-[11px] text-stone-400">{todayFormatted}</span>
          </div>

          {/* Fast Billing CTA button */}
          <button
            onClick={onNewBillClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-sm transition-colors shadow-sm focus:ring-2 focus:ring-amber-400"
            title="Start New Sale Bill (Shortcut: F2)"
          >
            <PlusCircle className="w-4 h-4 text-stone-950" />
            <span className="hidden sm:inline">New Bill</span>
            <span className="text-xs bg-amber-600/40 text-stone-950 px-1.5 py-0.5 rounded font-mono font-bold">
              F2
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
