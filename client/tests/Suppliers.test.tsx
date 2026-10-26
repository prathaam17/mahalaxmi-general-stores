import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupplierModal } from '../src/components/suppliers/SupplierModal';
import { SupplierPaymentModal } from '../src/components/suppliers/SupplierPaymentModal';
import { PurchaseModal } from '../src/components/suppliers/PurchaseModal';
import { SupplierStatementModal } from '../src/components/suppliers/SupplierStatementModal';
import type {
  SupplierWithMeta,
  SupplierStatement,
  ProductWithCategory,
} from '../src/types';

describe('Suppliers and Purchases Components', () => {
  const mockSupplier: SupplierWithMeta = {
    id: 1,
    name: 'Kamat Wholesale Distributors',
    phone: '+91 94481 22334',
    gstin: '29ABCDE1234F1Z5',
    address: 'Bunder Road, Kumta',
    currentBalance: 12500.0,
    totalPurchasesCount: 4,
    lastPurchaseDate: '2026-10-24',
    isActive: true,
    createdAt: '2026-10-20 09:00:00',
  };

  const mockProducts: ProductWithCategory[] = [
    {
      id: 1,
      barcode: 'LOOSE-001',
      name: 'Sona Masoori Rice (Loose)',
      kannadaName: 'ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ',
      categoryId: 1,
      categoryName: 'Grains & Pulses',
      isLoose: true,
      unit: 'kg',
      costPrice: 48.0,
      sellingPrice: 56.0,
      mrp: 60.0,
      currentStock: 245.5,
      minStockAlert: 50.0,
      profitMarginPercent: 14.3,
      stockStatus: 'normal',
      isActive: true,
      createdAt: '2026-10-20 09:00:00',
      updatedAt: '2026-10-20 09:00:00',
    },
  ];

  it('SupplierModal renders, accepts inputs, and submits new supplier', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <SupplierModal
        isOpen={true}
        onClose={handleClose}
        supplierToEdit={null}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Add New Supplier • ಹೊಸ ಸರಬರಾಜುದಾರ')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('e.g. Kamat Wholesale Distributors, Kumta');
    fireEvent.change(nameInput, { target: { value: 'Canara Oil Mills' } });

    const phoneInput = screen.getByPlaceholderText('e.g. +91 94481 22334');
    fireEvent.change(phoneInput, { target: { value: '+91 98450 12345' } });

    const gstinInput = screen.getByPlaceholderText('e.g. 29ABCDE1234F1Z5');
    fireEvent.change(gstinInput, { target: { value: '29xyzab5678c1z9' } });

    const submitBtn = screen.getByText('Register Supplier');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Canara Oil Mills',
          phone: '+91 98450 12345',
          gstin: '29XYZAB5678C1Z9',
        })
      );
    });
  });

  it('SupplierPaymentModal displays payable balance and submits payment', async () => {
    const handleRecordPayment = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <SupplierPaymentModal
        isOpen={true}
        onClose={handleClose}
        supplier={mockSupplier}
        onRecordPayment={handleRecordPayment}
      />
    );

    expect(screen.getByText('Pay Supplier • ಸರಬರಾಜುದಾರರಿಗೆ ಪಾವತಿ')).toBeInTheDocument();
    expect(screen.getByText('₹12500.00')).toBeInTheDocument(); // Current payable

    // Click Pay Full Balance
    const payFullBtn = screen.getByText('Pay Full Balance');
    fireEvent.click(payFullBtn);

    // Balance after payment becomes 0.00
    expect(screen.getByText('₹0.00')).toBeInTheDocument();

    // Select Bank / NEFT payment mode and submit
    const submitBtn = screen.getByText('Record Payment of ₹12500.00');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleRecordPayment).toHaveBeenCalledTimes(1);
      expect(handleRecordPayment).toHaveBeenCalledWith(
        mockSupplier.id,
        12500,
        'BANK_TRANSFER',
        undefined
      );
    });
  });

  it('PurchaseModal calculates line totals, allows credit selection, and submits invoice', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <PurchaseModal
        isOpen={true}
        onClose={handleClose}
        suppliers={[mockSupplier]}
        products={mockProducts}
        defaultSupplierId={mockSupplier.id}
        onSave={handleSave}
      />
    );

    expect(screen.getByText(/Record Stock Inward \/ Purchase/)).toBeInTheDocument();

    // Enter item details
    const itemNameInput = screen.getByPlaceholderText('Or custom item name...');
    fireEvent.change(itemNameInput, { target: { value: 'Basmati Rice 25kg Bag' } });

    const qtyInput = screen.getByDisplayValue('1');
    fireEvent.change(qtyInput, { target: { value: '10' } });

    const costInputs = screen.getAllByRole('spinbutton');
    // First spinbutton is quantity, second is unit cost
    fireEvent.change(costInputs[1], { target: { value: '1200' } });

    // 10 bags * 1200 = 12000.00
    await waitFor(() => {
      expect(screen.getByText('₹12000.00')).toBeInTheDocument();
    });

    // Select Credit (Udhaar) payment mode
    const creditBtn = screen.getByText('Credit (Udhaar)');
    fireEvent.click(creditBtn);

    const confirmBtn = screen.getByText(/Confirm Purchase \(₹12000.00\)/);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: mockSupplier.id,
          paymentMode: 'CREDIT',
          paidAmount: 0,
        })
      );
    });
  });

  it('SupplierStatementModal displays ledger entries and financial summary', () => {
    const mockStatement: SupplierStatement = {
      supplier: mockSupplier,
      summary: {
        totalDeliveries: 20000.0,
        totalPayments: 7500.0,
        currentBalance: 12500.0,
        totalTransactions: 2,
      },
      entries: [
        {
          id: 1,
          supplierId: mockSupplier.id,
          purchaseId: 1,
          invoiceNumber: 'PUR-DEMO-001',
          entryType: 'CREDIT',
          amount: 20000.0,
          balanceAfter: 20000.0,
          paymentMode: 'CREDIT',
          notes: 'Rice & Sugar wholesale delivery',
          createdAt: '2026-10-24 10:00:00',
        },
        {
          id: 2,
          supplierId: mockSupplier.id,
          purchaseId: null,
          invoiceNumber: null,
          entryType: 'DEBIT',
          amount: 7500.0,
          balanceAfter: 12500.0,
          paymentMode: 'BANK_TRANSFER',
          notes: 'NEFT transfer payment',
          createdAt: '2026-10-25 15:30:00',
        },
      ],
    };

    render(
      <SupplierStatementModal
        isOpen={true}
        onClose={vi.fn()}
        statement={mockStatement}
        loading={false}
      />
    );

    expect(screen.getByText('MAHALAXMI GENERAL STORES')).toBeInTheDocument();
    expect(screen.getByText('SUPPLIER LEDGER STATEMENT')).toBeInTheDocument();
    expect(screen.getAllByText('Kamat Wholesale Distributors').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹20000.00').length).toBeGreaterThan(0); // Total purchases and row
    expect(screen.getAllByText('₹7500.00').length).toBeGreaterThan(0); // Total paid and row
    expect(screen.getAllByText('₹12500.00').length).toBeGreaterThan(0); // Payable balance and row
    expect(screen.getByText('Rice & Sugar wholesale delivery')).toBeInTheDocument();
    expect(screen.getByText('NEFT transfer payment')).toBeInTheDocument();
  });
});
