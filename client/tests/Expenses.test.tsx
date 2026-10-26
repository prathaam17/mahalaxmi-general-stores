import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseModal } from '../src/components/expenses/ExpenseModal';
import { OpeningCashModal } from '../src/components/expenses/OpeningCashModal';
import { CashDrawerModal } from '../src/components/expenses/CashDrawerModal';
import type { CashRegisterSummary } from '../src/types';

describe('Expenses and Cash Drawer Components', () => {
  const mockCashRegister: CashRegisterSummary = {
    id: 1,
    registerDate: '2026-10-26',
    openingCash: 1500.0,
    cashSales: 600.0,
    cashUdhaarCollections: 200.0,
    cashExpenses: 60.0,
    cashSupplierPayments: 0.0,
    totalCashIn: 800.0,
    totalCashOut: 60.0,
    expectedCash: 2240.0, // 1500 + 800 - 60
    closingCash: null,
    difference: null,
    denominations: {
      note500: 0,
      note200: 0,
      note100: 0,
      note50: 0,
      note20: 0,
      note10: 0,
      coins: 0,
    },
    status: 'OPEN',
    closingNotes: null,
    closedAt: null,
    createdAt: '2026-10-26 08:00:00',
  };

  it('ExpenseModal renders categories, accepts inputs, and submits new expense', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ExpenseModal
        isOpen={true}
        onClose={handleClose}
        expenseToEdit={null}
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Record Shop Expense • ದೈನಂದಿನ ಖರ್ಚು')).toBeInTheDocument();

    // Select category: Helper Wages & Hamali
    const hamaliBtn = screen.getByText(/Helper Wages & Hamali/);
    fireEvent.click(hamaliBtn);

    // Enter description
    const descInput = screen.getByPlaceholderText(/Morning tea for shopkeeper/);
    fireEvent.change(descInput, { target: { value: 'Hamali for unloading Dal bags' } });

    // Use preset ₹200
    const preset200 = screen.getByText('₹200');
    fireEvent.click(preset200);

    const submitBtn = screen.getByText('Save Expense (₹200.00)');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Helper Wages & Hamali',
          description: 'Hamali for unloading Dal bags',
          amount: 200,
          paymentMode: 'CASH',
        })
      );
    });
  });

  it('OpeningCashModal allows setting morning opening float', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <OpeningCashModal
        isOpen={true}
        onClose={handleClose}
        currentOpeningCash={1500}
        date="2026-10-26"
        onSave={handleSave}
      />
    );

    expect(screen.getByText('Set Morning Opening Cash • ಆರಂಭಿಕ ನಗದು')).toBeInTheDocument();

    // Select preset ₹2000
    const preset2000 = screen.getByText('₹2000');
    fireEvent.click(preset2000);

    const submitBtn = screen.getByText('Set Opening Cash (₹2000.00)');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith(
        '2026-10-26',
        2000,
        expect.any(String)
      );
    });
  });

  it('CashDrawerModal calculates currency denominations and submits day close', async () => {
    const handleCloseRegister = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <CashDrawerModal
        isOpen={true}
        onClose={handleClose}
        summary={mockCashRegister}
        onCloseRegister={handleCloseRegister}
      />
    );

    expect(screen.getByText(/Day Close & Cash Reconciliation/)).toBeInTheDocument();
    expect(screen.getByText('₹2240.00')).toBeInTheDocument(); // Expected cash

    // Enter Denominations:
    // 4 x ₹500 (2000), 2 x ₹100 (200), 4 x ₹10 (40) = 2240 (Exact match!)
    const countInputs = screen.getAllByPlaceholderText('Count');
    fireEvent.change(countInputs[0], { target: { value: '4' } }); // ₹500 note
    fireEvent.change(countInputs[2], { target: { value: '2' } }); // ₹100 note
    fireEvent.change(countInputs[5], { target: { value: '4' } }); // ₹10 note

    await waitFor(() => {
      // Physical count becomes ₹2240.00
      expect(screen.getAllByText('₹2240.00').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/Exact Match: Physical drawer cash exactly matches system records!/)).toBeInTheDocument();
    });

    const submitBtn = screen.getByText('Reconcile & Close Cash Drawer for Today');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCloseRegister).toHaveBeenCalledTimes(1);
      expect(handleCloseRegister).toHaveBeenCalledWith(
        '2026-10-26',
        expect.objectContaining({
          note500: 4,
          note100: 2,
          note10: 4,
        }),
        undefined
      );
    });
  });
});
