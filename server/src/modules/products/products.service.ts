import type { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from '../../db/index.js';

export interface ProductFilter {
  search?: string;
  categoryId?: number;
  stockStatus?: 'all' | 'low' | 'out_of_stock' | 'normal';
  isLoose?: boolean;
}

export interface CreateProductInput {
  barcode?: string | null;
  name: string;
  kannadaName?: string | null;
  categoryId?: number | null;
  isLoose: boolean;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  currentStock: number;
  minStockAlert: number;
}

export interface UpdateProductInput {
  barcode?: string | null;
  name: string;
  kannadaName?: string | null;
  categoryId?: number | null;
  isLoose: boolean;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  minStockAlert: number;
}

export interface ProductWithCategory {
  id: number;
  barcode: string | null;
  name: string;
  kannadaName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  isLoose: boolean;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  currentStock: number;
  minStockAlert: number;
  profitMarginPercent: number;
  stockStatus: 'normal' | 'low' | 'out_of_stock';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProductsService {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  getCategories(): Array<{
    id: number;
    name: string;
    description: string | null;
    productCount: number;
  }> {
    const rows = this.db.prepare(`
      SELECT
        c.id,
        c.name,
        c.description,
        COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      GROUP BY c.id, c.name, c.description
      ORDER BY c.name ASC
    `).all() as Array<{
      id: number;
      name: string;
      description: string | null;
      productCount: number;
    }>;

    return rows;
  }

  createCategory(name: string, description?: string): { id: number; name: string; description: string | null } {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Category name cannot be empty.');
    }

    const stmt = this.db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    stmt.run(trimmed, description?.trim() || null);

    const row = this.db.prepare('SELECT id, name, description FROM categories WHERE name = ?').get(trimmed) as {
      id: number;
      name: string;
      description: string | null;
    };

    return row;
  }

  getProducts(filters: ProductFilter = {}): ProductWithCategory[] {
    const conditions: string[] = ['p.is_active = 1'];
    const params: Array<string | number | null | bigint | Uint8Array> = [];

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push('(p.barcode = ? OR p.name LIKE ? OR p.kannada_name LIKE ?)');
      params.push(filters.search.trim(), q, q);
    }

    if (filters.categoryId) {
      conditions.push('p.category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.isLoose !== undefined) {
      conditions.push('p.is_loose = ?');
      params.push(filters.isLoose ? 1 : 0);
    }

    if (filters.stockStatus === 'low') {
      conditions.push('p.current_stock > 0 AND p.current_stock <= p.min_stock_alert');
    } else if (filters.stockStatus === 'out_of_stock') {
      conditions.push('p.current_stock <= 0');
    } else if (filters.stockStatus === 'normal') {
      conditions.push('p.current_stock > p.min_stock_alert');
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        p.id,
        p.barcode,
        p.name,
        p.kannada_name as kannadaName,
        p.category_id as categoryId,
        c.name as categoryName,
        p.is_loose as isLoose,
        p.unit,
        p.cost_price as costPrice,
        p.selling_price as sellingPrice,
        p.mrp,
        p.current_stock as currentStock,
        p.min_stock_alert as minStockAlert,
        p.is_active as isActive,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.name ASC
    `;

    const rows = this.db.prepare(sql).all(...params) as Array<{
      id: number;
      barcode: string | null;
      name: string;
      kannadaName: string | null;
      categoryId: number | null;
      categoryName: string | null;
      isLoose: number;
      unit: string;
      costPrice: number;
      sellingPrice: number;
      mrp: number;
      currentStock: number;
      minStockAlert: number;
      isActive: number;
      createdAt: string;
      updatedAt: string;
    }>;

    return rows.map((r) => {
      let stockStatus: 'normal' | 'low' | 'out_of_stock' = 'normal';
      if (r.currentStock <= 0) {
        stockStatus = 'out_of_stock';
      } else if (r.currentStock <= r.minStockAlert) {
        stockStatus = 'low';
      }

      const margin =
        r.sellingPrice > 0
          ? Math.round(((r.sellingPrice - r.costPrice) / r.sellingPrice) * 100 * 10) / 10
          : 0;

      return {
        ...r,
        isLoose: Boolean(r.isLoose),
        isActive: Boolean(r.isActive),
        stockStatus,
        profitMarginPercent: margin,
      };
    });
  }

  getInventoryMetrics(): {
    totalProducts: number;
    totalValuationCost: number;
    totalValuationRetail: number;
    lowStockCount: number;
    outOfStockCount: number;
    looseGoodsCount: number;
  } {
    const row = this.db.prepare(`
      SELECT
        COUNT(id) as totalProducts,
        COALESCE(SUM(current_stock * cost_price), 0) as totalValuationCost,
        COALESCE(SUM(current_stock * selling_price), 0) as totalValuationRetail,
        COUNT(CASE WHEN current_stock > 0 AND current_stock <= min_stock_alert THEN 1 END) as lowStockCount,
        COUNT(CASE WHEN current_stock <= 0 THEN 1 END) as outOfStockCount,
        COUNT(CASE WHEN is_loose = 1 THEN 1 END) as looseGoodsCount
      FROM products
      WHERE is_active = 1
    `).get() as {
      totalProducts: number;
      totalValuationCost: number;
      totalValuationRetail: number;
      lowStockCount: number;
      outOfStockCount: number;
      looseGoodsCount: number;
    };

    return {
      totalProducts: Number(row?.totalProducts || 0),
      totalValuationCost: Math.round(Number(row?.totalValuationCost || 0) * 100) / 100,
      totalValuationRetail: Math.round(Number(row?.totalValuationRetail || 0) * 100) / 100,
      lowStockCount: Number(row?.lowStockCount || 0),
      outOfStockCount: Number(row?.outOfStockCount || 0),
      looseGoodsCount: Number(row?.looseGoodsCount || 0),
    };
  }

  createProduct(input: CreateProductInput): ProductWithCategory {
    const name = input.name.trim();
    if (!name) {
      throw new Error('Product name is required.');
    }

    let barcode = input.barcode?.trim() || null;

    // Auto-generate barcode identifier for loose goods if not provided
    if (!barcode && input.isLoose) {
      const countRow = this.db.prepare("SELECT COUNT(*) as count FROM products WHERE is_loose = 1").get() as { count: number };
      const nextSeq = (countRow?.count || 0) + 1;
      barcode = `LOOSE-${String(nextSeq).padStart(3, '0')}`;
    }

    // Check barcode collision if barcode exists
    if (barcode) {
      const existing = this.db.prepare('SELECT id, name FROM products WHERE barcode = ? AND is_active = 1').get(barcode) as { id: number; name: string } | undefined;
      if (existing) {
        throw new Error(`Product with barcode "${barcode}" already exists (${existing.name}).`);
      }
    }

    return runInTransaction(this.db, () => {
      const stmt = this.db.prepare(`
        INSERT INTO products (
          barcode, name, kannada_name, category_id, is_loose, unit,
          cost_price, selling_price, mrp, current_stock, min_stock_alert
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        barcode,
        name,
        input.kannadaName?.trim() || null,
        input.categoryId || null,
        input.isLoose ? 1 : 0,
        input.unit.trim().toLowerCase(),
        Number(input.costPrice || 0),
        Number(input.sellingPrice || 0),
        Number(input.mrp || input.sellingPrice || 0),
        Number(input.currentStock || 0),
        Number(input.minStockAlert || 5)
      );

      const inserted = this.db.prepare('SELECT id FROM products WHERE name = ? ORDER BY id DESC LIMIT 1').get(name) as { id: number };

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('CREATE_PRODUCT', 'PRODUCT', ?, ?)
      `).run(String(inserted.id), `Added product "${name}" (Stock: ${input.currentStock} ${input.unit}, Price: ₹${input.sellingPrice})`);

      const products = this.getProducts({ search: name });
      const created = products.find((p) => p.id === inserted.id);
      if (!created) {
        throw new Error('Failed to retrieve newly created product.');
      }
      return created;
    });
  }

  updateProduct(id: number, input: UpdateProductInput): ProductWithCategory {
    const existing = this.db.prepare('SELECT id, name FROM products WHERE id = ?').get(id) as { id: number; name: string } | undefined;
    if (!existing) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    const name = input.name.trim();
    if (!name) {
      throw new Error('Product name is required.');
    }

    const barcode = input.barcode?.trim() || null;
    if (barcode) {
      const duplicate = this.db.prepare('SELECT id FROM products WHERE barcode = ? AND id != ? AND is_active = 1').get(barcode, id) as { id: number } | undefined;
      if (duplicate) {
        throw new Error(`Another product already uses barcode "${barcode}".`);
      }
    }

    return runInTransaction(this.db, () => {
      const stmt = this.db.prepare(`
        UPDATE products
        SET barcode = ?,
            name = ?,
            kannada_name = ?,
            category_id = ?,
            is_loose = ?,
            unit = ?,
            cost_price = ?,
            selling_price = ?,
            mrp = ?,
            min_stock_alert = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        barcode,
        name,
        input.kannadaName?.trim() || null,
        input.categoryId || null,
        input.isLoose ? 1 : 0,
        input.unit.trim().toLowerCase(),
        Number(input.costPrice || 0),
        Number(input.sellingPrice || 0),
        Number(input.mrp || input.sellingPrice || 0),
        Number(input.minStockAlert || 5),
        id
      );

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('UPDATE_PRODUCT', 'PRODUCT', ?, ?)
      `).run(String(id), `Updated details for product "${name}"`);

      const products = this.getProducts({ search: name });
      const updated = products.find((p) => p.id === id);
      if (!updated) {
        throw new Error('Failed to retrieve updated product.');
      }
      return updated;
    });
  }

  adjustStock(id: number, deltaQuantity: number, reason: string): ProductWithCategory {
    if (!reason || !reason.trim()) {
      throw new Error('An adjustment reason is required (e.g. Physical stock count, Damaged goods, Supplier delivery).');
    }

    return runInTransaction(this.db, () => {
      const prod = this.db.prepare('SELECT id, name, unit, current_stock FROM products WHERE id = ?').get(id) as {
        id: number;
        name: string;
        unit: string;
        current_stock: number;
      } | undefined;

      if (!prod) {
        throw new Error(`Product with ID ${id} not found.`);
      }

      const oldStock = prod.current_stock;
      const newStock = Math.max(0, Math.round((oldStock + deltaQuantity) * 1000) / 1000);

      this.db.prepare(`
        UPDATE products
        SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStock, id);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('STOCK_ADJUSTMENT', 'PRODUCT', ?, ?)
      `).run(
        String(id),
        `Adjusted stock for "${prod.name}": ${oldStock} ${prod.unit} -> ${newStock} ${prod.unit} (${deltaQuantity >= 0 ? '+' : ''}${deltaQuantity}). Reason: ${reason}`
      );

      const products = this.getProducts({ search: prod.name });
      const updated = products.find((p) => p.id === id);
      if (!updated) {
        throw new Error('Failed to retrieve product after stock adjustment.');
      }
      return updated;
    });
  }

  deactivateProduct(id: number): boolean {
    return runInTransaction(this.db, () => {
      const prod = this.db.prepare('SELECT id, name FROM products WHERE id = ?').get(id) as { id: number; name: string } | undefined;
      if (!prod) {
        throw new Error(`Product with ID ${id} not found.`);
      }

      this.db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

      this.db.prepare(`
        INSERT INTO audit_logs (action, entity_type, entity_id, details)
        VALUES ('DEACTIVATE_PRODUCT', 'PRODUCT', ?, ?)
      `).run(String(id), `Deactivated product "${prod.name}". Historical sales preserved.`);

      return true;
    });
  }
}
