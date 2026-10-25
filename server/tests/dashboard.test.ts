import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { DashboardService } from '../src/modules/dashboard/dashboard.service.js';
import { DashboardController } from '../src/modules/dashboard/dashboard.controller.js';
import type { Request, Response } from 'express';

describe('Dashboard Module Service and Controller', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: DashboardService;

  beforeEach(() => {
    // Setup fresh in-memory database with realistic demo data for tests
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new DashboardService(db);
  });

  it('correctly calculates metrics from seeded demo transactions', () => {
    const summary = service.getSummary();

    expect(summary.isDemoData).toBe(true);
    expect(summary.shopInfo.shopName).toBe('Mahalaxmi General Stores');
    expect(summary.shopInfo.address).toContain('Honnavar');

    // Sales metrics
    // Bill 1: 310 Cash, Bill 2: 231 UPI, Bill 3: 680 Credit => Total 1221
    expect(summary.metrics.todaySalesAmount).toBe(1221);
    expect(summary.metrics.todayBillsCount).toBe(3);
    expect(summary.metrics.todayCashAmount).toBe(310);
    expect(summary.metrics.todayUpiAmount).toBe(231);
    expect(summary.metrics.todayCreditAmount).toBe(680);

    // Expenses: 60 (tea) + 150 (carry bags) = 210
    expect(summary.metrics.todayExpensesAmount).toBe(210);

    // Outstanding customer credit (Udhaar)
    expect(summary.metrics.totalOutstandingCredit).toBeGreaterThan(0);
    expect(summary.metrics.creditCustomerCount).toBeGreaterThan(0);

    // Low stock items identified
    expect(summary.lowStockItems.length).toBeGreaterThan(0);
    const itemNames = summary.lowStockItems.map((i) => i.name);
    expect(itemNames.some((n) => n.includes('Ghee') || n.includes('Jaggery') || n.includes('Sandal'))).toBe(true);

    // Recent bills
    expect(summary.recentBills.length).toBe(3);
    expect(summary.recentBills[0].billNumber).toBe('MGS-DEMO-003');
  });

  it('DashboardController formats and returns API JSON response', () => {
    const controller = new DashboardController(service);

    let jsonResult: unknown = null;
    const mockReq = {} as Request;
    const mockRes = {
      json: (data: unknown) => {
        jsonResult = data;
        return mockRes;
      },
    } as unknown as Response;
    const mockNext = () => {};

    controller.getSummary(mockReq, mockRes, mockNext);

    expect(jsonResult).not.toBeNull();
    const resultObj = jsonResult as { success: boolean; data: ReturnType<typeof service.getSummary> };
    expect(resultObj.success).toBe(true);
    expect(resultObj.data.shopInfo.shopName).toBe('Mahalaxmi General Stores');
    expect(resultObj.data.metrics.todayBillsCount).toBe(3);
  });
});
