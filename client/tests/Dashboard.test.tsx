import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatCard } from '../src/components/ui/StatCard';
import { Badge } from '../src/components/ui/Badge';
import { DashboardPage } from '../src/pages/DashboardPage';
import { IndianRupee } from 'lucide-react';
import type { DashboardSummary } from '../src/types';

describe('UI Components and Dashboard View', () => {
  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="Today Sales"
        value="₹1,221.00"
        subtitle="3 bills today"
        icon={IndianRupee}
      />
    );

    expect(screen.getByText('Today Sales')).toBeInTheDocument();
    expect(screen.getByText('₹1,221.00')).toBeInTheDocument();
    expect(screen.getByText('3 bills today')).toBeInTheDocument();
  });

  it('renders Badge with custom variants', () => {
    const { rerender } = render(<Badge variant="cash">CASH</Badge>);
    expect(screen.getByText('CASH')).toBeInTheDocument();

    rerender(<Badge variant="upi">UPI</Badge>);
    expect(screen.getByText('UPI')).toBeInTheDocument();
  });

  it('renders DashboardPage with demo banner, recent bills, and low stock items', () => {
    const mockSummary: DashboardSummary = {
      shopInfo: {
        shopName: 'Mahalaxmi General Stores',
        tagline: 'Honnavar, Karnataka',
        address: 'Main Road, Honnavar',
        phone: '+91 94800 12345',
        gstin: '',
        currencySymbol: '₹',
        isDemoMode: true,
      },
      metrics: {
        todaySalesAmount: 1221,
        todayBillsCount: 3,
        todayCashAmount: 310,
        todayUpiAmount: 231,
        todayCreditAmount: 680,
        todayExpensesAmount: 210,
        estimatedGrossProfit: 156.5,
        totalOutstandingCredit: 2440,
        creditCustomerCount: 3,
        lowStockCount: 2,
      },
      lowStockItems: [
        {
          id: 1,
          name: 'Nandini Pure Ghee 200ml',
          kannadaName: 'ನಂದಿನಿ ಶುದ್ಧ ತುಪ್ಪ',
          unit: 'packet',
          currentStock: 8,
          minStockAlert: 10,
        },
      ],
      recentBills: [
        {
          id: 1,
          billNumber: 'MGS-DEMO-001',
          customerName: 'Ganesh Naik',
          grandTotal: 310,
          paymentMode: 'CASH',
          paymentStatus: 'PAID',
          totalItems: 3,
          createdAt: '2026-10-25 08:45:00',
        },
      ],
      isDemoData: true,
    };

    const handleNavigate = vi.fn();
    const handleRefresh = vi.fn();

    render(
      <DashboardPage
        summary={mockSummary}
        loading={false}
        error={null}
        onNavigate={handleNavigate}
        onRefresh={handleRefresh}
      />
    );

    // Verify Demo banner
    expect(screen.getByText('DEMO DATA MODE ACTIVE')).toBeInTheDocument();

    // Verify recent bill item
    expect(screen.getByText('MGS-DEMO-001')).toBeInTheDocument();
    expect(screen.getByText('Ganesh Naik')).toBeInTheDocument();

    // Verify low stock item
    expect(screen.getByText('Nandini Pure Ghee 200ml')).toBeInTheDocument();
    expect(screen.getByText('ನಂದಿನಿ ಶುದ್ಧ ತುಪ್ಪ')).toBeInTheDocument();

    // Verify quick action button interaction
    const newBillBtn = screen.getByText('New Bill');
    fireEvent.click(newBillBtn);
    expect(handleNavigate).toHaveBeenCalledWith('billing');
  });
});
