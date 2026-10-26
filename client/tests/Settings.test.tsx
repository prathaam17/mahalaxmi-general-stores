import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SettingsPage } from '../src/pages/SettingsPage';
import * as api from '../src/services/api';
import type { ShopSettingsData, DatabaseStatusInfo, AuditLogEntry } from '../src/types';

describe('Settings, Backup and Audit Trail Page', () => {
  const mockSettings: ShopSettingsData = {
    shopName: 'Mahalaxmi General Stores',
    tagline: 'Daily Provisions, Spices & Loose Goods',
    address: 'Main Road, Honnavar',
    phone: '+91 98450 12345',
    gstin: '29AAAAA0000A1Z5',
    currencySymbol: '₹',
    receiptFooter: 'ಧನ್ಯವಾದಗಳು! ಮತ್ತೆ ಬನ್ನಿ.',
    gstEnabled: true,
    defaultGstRate: 5,
    isDemoMode: true,
  };

  const mockDbStatus: DatabaseStatusInfo = {
    dbPath: 'data/mahalaxmi.db',
    sizeBytes: 153600,
    walSizeBytes: 40960,
    isWalMode: true,
    sqliteVersion: '3.45.1',
    lastModified: '2026-10-26T12:00:00.000Z',
  };

  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: 1,
      action: 'BILL_CREATE',
      entityType: 'BILL',
      entityId: '101',
      details: 'Completed checkout for bill MGS-20261026-0001 (Total: ₹450.00)',
      createdAt: '2026-10-26T10:15:00.000Z',
    },
    {
      id: 2,
      action: 'CUSTOMER_CREDIT_PAYMENT',
      entityType: 'CUSTOMER',
      entityId: '1',
      details: 'Repayment of ₹500.00 via CASH from Suresh Pai',
      createdAt: '2026-10-26T10:45:00.000Z',
    },
    {
      id: 3,
      action: 'SETTINGS_UPDATE',
      entityType: 'SETTINGS',
      entityId: null,
      details: 'Updated store profile details',
      createdAt: '2026-10-26T11:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'fetchShopSettings').mockResolvedValue(mockSettings);
    vi.spyOn(api, 'fetchDatabaseStatus').mockResolvedValue(mockDbStatus);
    vi.spyOn(api, 'fetchAuditLogs').mockResolvedValue(mockAuditLogs);
    vi.spyOn(api, 'updateShopSettings').mockImplementation(async (data) => ({
      ...mockSettings,
      ...data,
    }));
  });

  it('renders store settings and handles profile update', async () => {
    render(<SettingsPage />);

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Mahalaxmi General Stores')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main Road, Honnavar')).toBeInTheDocument();
    });

    // Check tax settings
    expect(screen.getByText(/Enable GST on Invoices/i)).toBeInTheDocument();

    // Modify shop tagline and submit
    const taglineInput = screen.getByDisplayValue('Daily Provisions, Spices & Loose Goods');
    fireEvent.change(taglineInput, { target: { value: 'Best Grocery & Loose Goods in Honnavar' } });

    const saveBtn = screen.getByText(/Save Changes/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.updateShopSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          tagline: 'Best Grocery & Loose Goods in Honnavar',
        })
      );
    });
  });

  it('renders Database Backup & Restore tab with health metrics and download link', async () => {
    render(<SettingsPage />);

    // Switch to database tab
    const dbTabBtn = screen.getByRole('button', { name: /Backup & Restore/i });
    fireEvent.click(dbTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/SQLite 3.45.1/i)).toBeInTheDocument();
      expect(screen.getByText(/WAL Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/150 KB/i)).toBeInTheDocument();
    });

    // Backup download link should point to /api/settings/backup
    const downloadLink = screen.getByRole('link', { name: /Download Backup File/i });
    expect(downloadLink).toHaveAttribute('href', '/api/settings/backup');
    expect(downloadLink).toHaveAttribute('download');
  });

  it('renders Audit Trail tab and displays chronological logs', async () => {
    render(<SettingsPage />);

    // Switch to audit tab
    const auditTabBtn = screen.getByRole('button', { name: /Audit Trail/i });
    fireEvent.click(auditTabBtn);

    await waitFor(() => {
      expect(screen.getByText('BILL_CREATE')).toBeInTheDocument();
      expect(screen.getByText('CUSTOMER_CREDIT_PAYMENT')).toBeInTheDocument();
      expect(screen.getByText('SETTINGS_UPDATE')).toBeInTheDocument();
      expect(screen.getByText(/Completed checkout for bill MGS-20261026-0001/i)).toBeInTheDocument();
      expect(screen.getByText(/Repayment of ₹500.00 via CASH from Suresh Pai/i)).toBeInTheDocument();
    });
  });
});
