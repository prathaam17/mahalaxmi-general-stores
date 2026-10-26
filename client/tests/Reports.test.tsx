import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReportsPage } from '../src/pages/ReportsPage';
import * as api from '../src/services/api';
import type { SalesReportSummary } from '../src/types';

describe('Sales, Profit Reports & Analytics Page', () => {
  const mockReport: SalesReportSummary = {
    period: 'month',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    metrics: {
      totalGrossSales: 45000.0,
      totalDiscount: 500.0,
      totalNetSales: 44500.0,
      totalBillsCount: 120,
      totalItemsSold: 350,
      cogs: 36000.0,
      estimatedGrossProfit: 8500.0,
      grossMarginPercent: 19.1,
      totalOperatingExpenses: 2500.0,
      estimatedNetProfit: 6000.0,
      netMarginPercent: 13.5,
      averageBillValue: 370.83,
    },
    payments: {
      cashAmount: 26700.0,
      upiAmount: 13350.0,
      creditAmount: 4450.0,
      cashPercent: 60,
      upiPercent: 30,
      creditPercent: 10,
    },
    dailyTrends: [
      {
        date: '2026-10-24',
        totalSales: 1500.0,
        totalBills: 5,
        cogs: 1200.0,
        grossProfit: 300.0,
        expenses: 100.0,
        netProfit: 200.0,
      },
    ],
    topProducts: [
      {
        productId: 1,
        productName: 'Sona Masoori Rice (Loose)',
        unit: 'kg',
        quantitySold: 120,
        totalRevenue: 6720.0,
        totalCost: 5760.0,
        grossProfit: 960.0,
        profitMarginPercent: 14.3,
      },
    ],
    categoryBreakdown: [
      {
        categoryName: 'Grains & Pulses',
        quantitySold: 200,
        totalRevenue: 15000.0,
        grossProfit: 2500.0,
      },
    ],
  };

  beforeEach(() => {
    vi.spyOn(api, 'fetchSalesReport').mockResolvedValue(mockReport);
  });

  it('renders sales metrics and profit estimations accurately', async () => {
    render(<ReportsPage />);

    expect(screen.getByText('Sales, Profit & Reports')).toBeInTheDocument();

    await waitFor(() => {
      // Net Sales
      expect(screen.getByText('₹44,500')).toBeInTheDocument();
      // COGS
      expect(screen.getByText('₹36,000')).toBeInTheDocument();
      // Gross Profit
      expect(screen.getByText('₹8,500')).toBeInTheDocument();
      expect(screen.getByText(/Gross Margin: 19.1%/)).toBeInTheDocument();
      // Net Profit
      expect(screen.getByText('₹6,000')).toBeInTheDocument();
      expect(screen.getByText(/After ₹2500 expenses/)).toBeInTheDocument();
    });
  });

  it('renders payment mode distribution and top selling products', async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      // Cash payment
      expect(screen.getByText('₹26700.00')).toBeInTheDocument();
      // UPI payment
      expect(screen.getByText('₹13350.00')).toBeInTheDocument();
      // Udhaar / Credit
      expect(screen.getByText('₹4450.00')).toBeInTheDocument();
      // Top product
      expect(screen.getByText('Sona Masoori Rice (Loose)')).toBeInTheDocument();
      expect(screen.getByText('120 kg')).toBeInTheDocument();
      expect(screen.getByText('₹6720.00')).toBeInTheDocument();
    });
  });
});
