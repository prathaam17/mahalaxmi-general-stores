import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { ReportsService } from '../src/modules/reports/reports.service.js';

describe('Sales, Profit Reports & Analytics Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: ReportsService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new ReportsService(db);
  });

  it('generates sales report for today with accurate revenue and bill count', () => {
    const report = service.getSalesReport({ period: 'today' });

    expect(report.metrics.totalBillsCount).toBeGreaterThanOrEqual(3);
    // Seed has Bill 1 (310) + Bill 2 (231) + Bill 3 (680) = 1221
    expect(report.metrics.totalNetSales).toBeGreaterThanOrEqual(1221.0);
    expect(report.metrics.totalItemsSold).toBeGreaterThan(0);
    expect(report.metrics.averageBillValue).toBeGreaterThan(0);
  });

  it('calculates Cost of Goods Sold (COGS) and estimated gross profit accurately', () => {
    const report = service.getSalesReport({ period: 'today' });

    expect(report.metrics.cogs).toBeGreaterThan(0);
    expect(report.metrics.estimatedGrossProfit).toBe(
      Math.round((report.metrics.totalNetSales - report.metrics.cogs) * 100) / 100
    );
    expect(report.metrics.grossMarginPercent).toBeGreaterThan(0);
    expect(report.metrics.grossMarginPercent).toBeLessThan(100);
  });

  it('calculates operating expenses and estimated net profit', () => {
    const report = service.getSalesReport({ period: 'today' });

    // Seed has ₹60 Tea + ₹150 Packaging = ₹210 expenses
    expect(report.metrics.totalOperatingExpenses).toBeGreaterThanOrEqual(210.0);
    expect(report.metrics.estimatedNetProfit).toBe(
      Math.round((report.metrics.estimatedGrossProfit - report.metrics.totalOperatingExpenses) * 100) / 100
    );
  });

  it('breaks down payment modes across Cash, UPI, and Credit', () => {
    const report = service.getSalesReport({ period: 'today' });

    expect(report.payments.cashAmount).toBeGreaterThan(0);
    expect(report.payments.upiAmount).toBeGreaterThan(0);
    expect(report.payments.creditAmount).toBeGreaterThan(0);

    // Total percentages should sum to approximately 100%
    const totalPercent =
      report.payments.cashPercent + report.payments.upiPercent + report.payments.creditPercent;
    expect(totalPercent).toBeGreaterThanOrEqual(98);
    expect(totalPercent).toBeLessThanOrEqual(102);
  });

  it('identifies top selling products with margins', () => {
    const report = service.getSalesReport({ period: 'today' });

    expect(report.topProducts.length).toBeGreaterThan(0);

    const firstProduct = report.topProducts[0];
    expect(firstProduct.productName).toBeDefined();
    expect(firstProduct.quantitySold).toBeGreaterThan(0);
    expect(firstProduct.totalRevenue).toBeGreaterThan(0);
    expect(firstProduct.grossProfit).toBeDefined();
    expect(firstProduct.profitMarginPercent).toBeDefined();
  });

  it('filters report by custom date range', () => {
    const today = new Date().toISOString().split('T')[0];
    const report = service.getSalesReport({ startDate: today, endDate: today });

    expect(report.startDate).toBe(today);
    expect(report.endDate).toBe(today);
    expect(report.metrics.totalBillsCount).toBeGreaterThanOrEqual(3);
  });
});
