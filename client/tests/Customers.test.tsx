import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerModal } from '../src/components/customers/CustomerModal';
import { PaymentModal } from '../src/components/customers/PaymentModal';
import { CustomerStatementModal } from '../src/components/customers/CustomerStatementModal';
import type { CustomerWithMeta, CustomerStatement } from '../src/types';

describe('Customer Khata and Udhaar Components', () => {
  const mockCustomer: CustomerWithMeta = {
    id: 1,
    name: 'Ganesh Naik',
    phone: '+91 94812 34567',
    address: 'Prabhat Nagar, Honnavar',
    creditLimit: 3000,
    currentBalance: 680,
    availableCredit: 2320,
    isOverLimit: false,
    lastTransactionDate: '2026-10-25 11:30:00',
    isActive: true,
    createdAt: '2026-10-25 08:00:00',
  };

  it('CustomerModal renders, accepts inputs, and submits new customer', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <CustomerModal
        isOpen={true}
        onClose={handleClose}
        customerToEdit={null}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByText('Register New Customer • ಹೊಸ ಗ್ರಾಹಕ')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('e.g. Ganesh Naik, Suresh Bhat');
    fireEvent.change(nameInput, { target: { value: 'Manjunath Hegde' } });

    const phoneInput = screen.getByPlaceholderText('e.g. +91 94812 34567');
    fireEvent.change(phoneInput, { target: { value: '+91 97410 54321' } });

    const submitBtn = screen.getByText('Open Khata Account');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Manjunath Hegde',
          phone: '+91 97410 54321',
        }),
        undefined
      );
    });
  });

  it('PaymentModal calculates remaining balance and submits repayment', async () => {
    const handleRecordPayment = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <PaymentModal
        isOpen={true}
        onClose={handleClose}
        customer={mockCustomer}
        onRecordPayment={handleRecordPayment}
      />
    );

    expect(screen.getByText('Record Udhaar Repayment • ಜಮಾ ಪಾವತಿ')).toBeInTheDocument();
    expect(screen.getByText('₹680.00')).toBeInTheDocument(); // Due balance

    // Test Pay Full Balance button
    const payFullBtn = screen.getByText('Pay Full Balance');
    fireEvent.click(payFullBtn);

    // Remaining balance becomes ₹0.00
    expect(screen.getByText('₹0.00')).toBeInTheDocument();

    // Toggle to UPI
    const upiBtn = screen.getByText('UPI / QR Code');
    fireEvent.click(upiBtn);

    // Submit payment
    const confirmBtn = screen.getByText('Confirm & Credit Ledger');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleRecordPayment).toHaveBeenCalledWith(1, 680, 'UPI', undefined);
    });
  });

  it('CustomerStatementModal renders Khata summary and ledger entries', () => {
    const mockStatement: CustomerStatement = {
      customer: mockCustomer,
      summary: {
        totalDebits: 680,
        totalCredits: 200,
        currentBalance: 480,
        totalTransactions: 2,
      },
      entries: [
        {
          id: 1,
          customerId: 1,
          billId: 3,
          billNumber: 'MGS-DEMO-003',
          entryType: 'DEBIT',
          amount: 680,
          balanceAfter: 680,
          paymentMode: 'CREDIT',
          notes: 'Credit purchase',
          createdAt: '2026-10-25 11:30:00',
        },
        {
          id: 2,
          customerId: 1,
          billId: null,
          billNumber: null,
          entryType: 'CREDIT',
          amount: 200,
          balanceAfter: 480,
          paymentMode: 'CASH',
          notes: 'Cash payment',
          createdAt: '2026-10-25 15:00:00',
        },
      ],
    };

    const handleClose = vi.fn();

    render(
      <CustomerStatementModal
        isOpen={true}
        onClose={handleClose}
        statement={mockStatement}
        loading={false}
      />
    );

    expect(screen.getByText('Udhaar Khata Statement')).toBeInTheDocument();
    expect(screen.getByText('MAHALAXMI GENERAL STORES')).toBeInTheDocument();
    expect(screen.getByText('Ganesh Naik')).toBeInTheDocument();

    // Summary checks
    expect(screen.getAllByText('₹680.00').length).toBeGreaterThan(0); // Debits / entries
    expect(screen.getAllByText('₹200.00').length).toBeGreaterThan(0); // Credits / entries
    expect(screen.getAllByText('₹480.00').length).toBeGreaterThan(0); // Net balance / entries

    // Bill Number
    expect(screen.getByText('Bill #MGS-DEMO-003')).toBeInTheDocument();

    // Print button
    expect(screen.getByText('Print Khata Statement')).toBeInTheDocument();
  });
});
