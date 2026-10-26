import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LooseGoodsModal } from '../src/components/billing/LooseGoodsModal';
import { ReceiptModal } from '../src/components/billing/ReceiptModal';
import type { ProductItem, BillDetail } from '../src/types';

describe('Billing Module Components', () => {
  const mockLooseProducts: ProductItem[] = [
    {
      id: 1,
      barcode: 'LOOSE-001',
      name: 'Sona Masoori Rice (Loose)',
      kannadaName: 'ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ',
      categoryId: 1,
      categoryName: 'Grains & Pulses',
      isLoose: true,
      unit: 'kg',
      costPrice: 48,
      sellingPrice: 56,
      mrp: 60,
      currentStock: 245.5,
      minStockAlert: 50,
    },
    {
      id: 2,
      barcode: 'LOOSE-002',
      name: 'Sugar (Loose)',
      kannadaName: 'ಸಕ್ಕರೆ',
      categoryId: 1,
      categoryName: 'Grains & Pulses',
      isLoose: true,
      unit: 'kg',
      costPrice: 38,
      sellingPrice: 44,
      mrp: 46,
      currentStock: 180,
      minStockAlert: 40,
    },
  ];

  it('LooseGoodsModal calculates weight and line total correctly', () => {
    const handleAdd = vi.fn();
    const handleClose = vi.fn();

    render(
      <LooseGoodsModal
        isOpen={true}
        onClose={handleClose}
        looseProducts={mockLooseProducts}
        onAddLooseItem={handleAdd}
      />
    );

    // Initial item is Sona Masoori Rice @ ₹56/kg, default 1kg = ₹56.00
    expect(screen.getByText('Loose Goods / Weight Entry')).toBeInTheDocument();
    expect(screen.getByText('₹56.00')).toBeInTheDocument();

    // Switch to By Grams mode
    const gramsTab = screen.getByText('By Grams (g)');
    fireEvent.click(gramsTab);

    // Enter 500 grams
    const input = screen.getByPlaceholderText('e.g. 500');
    fireEvent.change(input, { target: { value: '500' } });

    // 0.5 kg * ₹56 = ₹28.00
    expect(screen.getByText('₹28.00')).toBeInTheDocument();

    // Click "Add to Bill"
    const addBtn = screen.getByText('Add to Bill');
    fireEvent.click(addBtn);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 1,
        quantity: 0.5,
        unitPrice: 56,
        lineTotal: 28,
        isLoose: true,
      })
    );
  });

  it('ReceiptModal renders thermal receipt layout with store name, customer, and items', () => {
    const mockBill: BillDetail = {
      id: 10,
      billNumber: 'MGS-20261025-0004',
      slipNumber: 'Slip #42',
      customerId: 1,
      customerName: 'Ganesh Naik',
      customerPhone: '+91 94812 34567',
      totalItems: 2,
      subtotal: 184,
      discount: 4,
      taxAmount: 0,
      grandTotal: 180,
      paymentMode: 'CASH',
      cashReceived: 200,
      upiReceived: 0,
      creditAdded: 0,
      changeReturned: 20,
      paymentStatus: 'PAID',
      notes: null,
      isReversed: false,
      reversedAt: null,
      reversalReason: null,
      createdAt: '2026-10-25 13:20:00',
      items: [
        {
          id: 1,
          productId: 1,
          productName: 'Sona Masoori Rice (Loose)',
          quantity: 2.5,
          unit: 'kg',
          costPrice: 48,
          unitPrice: 56,
          lineTotal: 140,
        },
        {
          id: 2,
          productId: 2,
          productName: 'Sugar (Loose)',
          quantity: 1.0,
          unit: 'kg',
          costPrice: 38,
          unitPrice: 44,
          lineTotal: 44,
        },
      ],
    };

    const handleClose = vi.fn();
    const handleNewBill = vi.fn();

    render(
      <ReceiptModal
        isOpen={true}
        onClose={handleClose}
        bill={mockBill}
        onNewBill={handleNewBill}
      />
    );

    // Verify Shop Name & Address
    expect(screen.getByText('MAHALAXMI GENERAL STORES')).toBeInTheDocument();
    expect(screen.getByText('Main Road, Honnavar, Uttara Kannada')).toBeInTheDocument();

    // Verify Bill Meta
    expect(screen.getByText('MGS-20261025-0004')).toBeInTheDocument();
    expect(screen.getByText('Slip #42')).toBeInTheDocument();
    expect(screen.getByText('Ganesh Naik')).toBeInTheDocument();

    // Verify Line Items
    expect(screen.getByText('Sona Masoori Rice (Loose)')).toBeInTheDocument();
    expect(screen.getByText('2.5 kg')).toBeInTheDocument();
    expect(screen.getByText('Sugar (Loose)')).toBeInTheDocument();

    // Verify Grand Total & Cash details
    expect(screen.getByText('₹180.00')).toBeInTheDocument();
    expect(screen.getByText('₹200.00')).toBeInTheDocument(); // Tendered
    expect(screen.getByText('₹20.00')).toBeInTheDocument(); // Change

    // Verify Print Button
    expect(screen.getByText('Print Thermal Receipt')).toBeInTheDocument();
  });
});
