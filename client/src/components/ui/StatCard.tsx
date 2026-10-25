import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  accentBorder?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-amber-50',
  iconColor = 'text-amber-600',
  accentBorder = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border ${
        accentBorder ? 'border-amber-300 ring-1 ring-amber-100' : 'border-stone-200'
      } flex items-start justify-between transition-all hover:shadow-md`}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-stone-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
