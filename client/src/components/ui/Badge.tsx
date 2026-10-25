import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'upi' | 'cash' | 'credit';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses = {
    default: 'bg-stone-100 text-stone-700 border border-stone-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    cash: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold',
    upi: 'bg-indigo-50 text-indigo-800 border border-indigo-300 font-semibold',
    credit: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
  }[variant];

  return (
    <span className={`inline-flex items-center rounded-full tracking-wide ${sizeClasses} ${variantClasses}`}>
      {children}
    </span>
  );
};
