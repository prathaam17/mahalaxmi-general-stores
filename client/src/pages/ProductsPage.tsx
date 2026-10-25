import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Boxes,
  Edit2,
  Trash2,
  FolderPlus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  fetchProducts,
  fetchCategories,
  fetchInventoryMetrics,
  createProduct,
  updateProduct,
  adjustProductStock,
  deactivateProduct,
  createCategory,
} from '../services/api';
import { ProductModal } from '../components/products/ProductModal';
import { StockAdjustModal } from '../components/products/StockAdjustModal';
import { CategoryModal } from '../components/products/CategoryModal';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import type {
  ProductWithCategory,
  CategoryItem,
  InventoryMetrics,
  ProductFormData,
} from '../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out_of_stock' | 'normal'>('all');
  const [looseFilter, setLooseFilter] = useState<boolean | undefined>(undefined);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductWithCategory | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<ProductWithCategory | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [prodsData, catsData, metricsData] = await Promise.all([
        fetchProducts({
          search: search.trim() || undefined,
          categoryId: selectedCategory ? Number(selectedCategory) : undefined,
          stockStatus: stockFilter,
          isLoose: looseFilter,
        }),
        fetchCategories(),
        fetchInventoryMetrics(),
      ]);

      setProducts(prodsData);
      setCategories(catsData);
      setMetrics(metricsData);
    } catch (err: unknown) {
      console.error('Failed to load products inventory data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to local product inventory.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockFilter, looseFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: ProductWithCategory) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenAdjustStock = (prod: ProductWithCategory) => {
    setProductToAdjust(prod);
    setIsAdjustModalOpen(true);
  };

  const handleProductSubmit = async (data: ProductFormData, id?: number) => {
    if (id) {
      await updateProduct(id, data);
    } else {
      await createProduct(data);
    }
    await loadData();
  };

  const handleStockAdjustSubmit = async (id: number, delta: number, reason: string) => {
    await adjustProductStock(id, delta, reason);
    await loadData();
  };

  const handleCategorySubmit = async (name: string, description?: string) => {
    await createCategory(name, description);
    const updatedCats = await fetchCategories();
    setCategories(updatedCats);
  };

  const handleDeactivate = async (prod: ProductWithCategory) => {
    if (window.confirm(`Are you sure you want to deactivate "${prod.name}"? It will be archived while preserving historical bills.`)) {
      try {
        await deactivateProduct(prod.id);
        await loadData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to deactivate product');
      }
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900 leading-tight">
              Products & Stock Inventory
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            ಸರಕುಗಳ ನಿರ್ವಹಣೆ, ಬೆಲೆಗಳು & ದಾಸ್ತಾನು • Packaged items & loose goods by kg
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-stone-600" />
            <span>Add Category</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* 2. Top Inventory Valuation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Store Products"
          value={metrics?.totalProducts || 0}
          subtitle={`${metrics?.looseGoodsCount || 0} loose goods sold by weight`}
          icon={Package}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-800"
        />

        <StatCard
          title="Stock Valuation (Cost)"
          value={formatCurrency(metrics?.totalValuationCost || 0)}
          subtitle="Wholesale investment value"
          icon={TrendingUp}
          iconBgColor="bg-sky-100"
          iconColor="text-sky-700"
        />

        <StatCard
          title="Stock Valuation (Retail)"
          value={formatCurrency(metrics?.totalValuationRetail || 0)}
          subtitle="Estimated sales value"
          icon={TrendingUp}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-700"
        />

        <StatCard
          title="Low Stock Alerts"
          value={metrics?.lowStockCount || 0}
          subtitle={`${metrics?.outOfStockCount || 0} items completely out of stock`}
          icon={AlertTriangle}
          iconBgColor="bg-rose-100"
          iconColor="text-rose-700"
        />
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, Kannada name, or barcode..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4 relative">
            <Filter className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
            >
              <option value="">All Categories (ಎಲ್ಲಾ ವಿಭಾಗಗಳು)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.productCount})
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="md:col-span-2">
            <button
              onClick={loadData}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => {
              setStockFilter('all');
              setLooseFilter(undefined);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              stockFilter === 'all' && looseFilter === undefined
                ? 'bg-amber-500 text-stone-950 shadow-2xs font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Products ({metrics?.totalProducts || 0})
          </button>

          <button
            onClick={() => {
              setStockFilter('low');
              setLooseFilter(undefined);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              stockFilter === 'low'
                ? 'bg-rose-500 text-white shadow-2xs font-bold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Low Stock Alerts ({metrics?.lowStockCount || 0})
          </button>

          <button
            onClick={() => {
              setStockFilter('all');
              setLooseFilter(true);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              looseFilter === true
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Loose Goods Only (kg/g)
          </button>

          <button
            onClick={() => {
              setStockFilter('out_of_stock');
              setLooseFilter(undefined);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              stockFilter === 'out_of_stock'
                ? 'bg-stone-900 text-white shadow-2xs font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Out of Stock ({metrics?.outOfStockCount || 0})
          </button>
        </div>
      </div>

      {/* 4. Products Catalog Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadData} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-3 py-3">Barcode / SKU</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3 text-center">Type</th>
                <th className="px-3 py-3 text-right">Stock Level</th>
                <th className="px-3 py-3 text-right">Cost (₹)</th>
                <th className="px-3 py-3 text-right">Selling (₹)</th>
                <th className="px-3 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading products inventory...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-stone-400">
                    <Package className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600">No products match your filter.</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Try clearing your search query or add a new product above.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-stone-900">{prod.name}</div>
                      {prod.kannadaName && (
                        <div className="text-[11px] text-stone-500">{prod.kannadaName}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-stone-600">
                      {prod.barcode || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium">
                        {prod.categoryName || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {prod.isLoose ? (
                        <Badge variant="warning" size="sm">
                          Loose (kg)
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          Packaged
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-mono font-bold text-stone-900">
                        {prod.currentStock} {prod.unit}
                      </div>
                      <div className="mt-0.5">
                        {prod.stockStatus === 'out_of_stock' ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                            Out of Stock
                          </span>
                        ) : prod.stockStatus === 'low' ? (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                            Low Stock (≤{prod.minStockAlert})
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-700">
                            In Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-stone-600">
                      ₹{prod.costPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-stone-900">
                      ₹{prod.sellingPrice.toFixed(2)}
                      {prod.mrp > prod.sellingPrice && (
                        <div className="text-[10px] text-stone-400 font-normal line-through">
                          MRP: ₹{prod.mrp.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      <span
                        className={`font-bold ${
                          prod.profitMarginPercent >= 15
                            ? 'text-emerald-700'
                            : prod.profitMarginPercent > 5
                            ? 'text-amber-800'
                            : 'text-rose-700'
                        }`}
                      >
                        {prod.profitMarginPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenAdjustStock(prod)}
                          className="px-2 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-stone-950 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                          title="Adjust Stock Level (+/-)"
                        >
                          +/- Stock
                        </button>
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 rounded text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(prod)}
                          className="p-1.5 rounded text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Deactivate Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        categories={categories}
        onSubmit={handleProductSubmit}
      />

      <StockAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        product={productToAdjust}
        onAdjust={handleStockAdjustSubmit}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
      />
    </div>
  );
};
