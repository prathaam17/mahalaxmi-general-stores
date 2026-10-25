import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductModal } from '../src/components/products/ProductModal';
import { StockAdjustModal } from '../src/components/products/StockAdjustModal';
import { CategoryModal } from '../src/components/products/CategoryModal';
import type { CategoryItem, ProductWithCategory } from '../src/types';

describe('Products and Inventory Components', () => {
  const mockCategories: CategoryItem[] = [
    { id: 1, name: 'Grains & Pulses', description: 'Rice, Dal', productCount: 5 },
    { id: 2, name: 'Dairy & Fresh', description: 'Milk, Curd', productCount: 2 },
  ];

  it('ProductModal renders, toggles loose goods, and calculates profit margin', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <ProductModal
        isOpen={true}
        onClose={handleClose}
        productToEdit={null}
        categories={mockCategories}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByText('Add New Store Product')).toBeInTheDocument();

    // Fill in product name
    const nameInput = screen.getByPlaceholderText('e.g. Sona Masoori Rice');
    fireEvent.change(nameInput, { target: { value: 'Tata Tea Gold 250g' } });

    // Fill in Cost Price ₹100 and Selling Price ₹125
    const spinInputs = screen.getAllByRole('spinbutton');
    const costInput = spinInputs[0]; // Cost price
    const sellInput = spinInputs[1]; // Selling price

    fireEvent.change(costInput, { target: { value: '100' } });
    fireEvent.change(sellInput, { target: { value: '125' } });

    // Margin: (125 - 100) / 125 = 20%
    expect(screen.getByText('Margin: 20%')).toBeInTheDocument();

    // Toggle to Loose Good (kg)
    const looseBtn = screen.getByText('Loose Good (kg)');
    fireEvent.click(looseBtn);

    expect(screen.getByText('Auto-generates LOOSE-XXX if left empty')).toBeInTheDocument();

    // Submit form
    const submitBtn = screen.getByText('Create Product');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('StockAdjustModal updates new stock preview and submits adjustment', async () => {
    const mockProduct: ProductWithCategory = {
      id: 7,
      barcode: '8901030383999',
      name: 'Nandini Pure Ghee 200ml',
      kannadaName: 'ನಂದಿನಿ ಶುದ್ಧ ತುಪ್ಪ',
      categoryId: 2,
      categoryName: 'Dairy & Fresh',
      isLoose: false,
      unit: 'packet',
      costPrice: 128,
      sellingPrice: 140,
      mrp: 140,
      currentStock: 8,
      minStockAlert: 10,
      profitMarginPercent: 8.6,
      stockStatus: 'low',
      isActive: true,
      createdAt: '2026-10-25',
      updatedAt: '2026-10-25',
    };

    const handleAdjust = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <StockAdjustModal
        isOpen={true}
        onClose={handleClose}
        product={mockProduct}
        onAdjust={handleAdjust}
      />
    );

    expect(screen.getByText('Adjust Stock Level')).toBeInTheDocument();
    expect(screen.getByText('8 packet')).toBeInTheDocument(); // Current stock

    // Default adjustment is +5 => Updated stock is 13 packet
    expect(screen.getByText('13 packet')).toBeInTheDocument();

    // Switch to Subtract
    const subtractBtn = screen.getByText('- Reduce Stock (ಕಡಿಮೆ ಮಾಡಿ)');
    fireEvent.click(subtractBtn);

    // 8 - 5 = 3 packet
    expect(screen.getByText('3 packet')).toBeInTheDocument();

    // Submit adjustment
    const confirmBtn = screen.getByText('Confirm Stock Adjustment');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleAdjust).toHaveBeenCalledWith(7, -5, expect.any(String));
    });
  });

  it('CategoryModal creates new category', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <CategoryModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByText('Add New Category • ಹೊಸ ವಿಭಾಗ')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('e.g. Spices & Masala, Dairy');
    fireEvent.change(nameInput, { target: { value: 'Puja Items' } });

    const saveBtn = screen.getByText('Save Category');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith('Puja Items', undefined);
    });
  });
});
