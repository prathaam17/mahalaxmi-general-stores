import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDemoData } from '../src/db/seed.js';
import { ProductsService } from '../src/modules/products/products.service.js';

describe('Products and Inventory Service', () => {
  let db: ReturnType<typeof getDatabase>;
  let service: ProductsService;

  beforeEach(() => {
    db = getDatabase(':memory:');
    runMigrations(db);
    seedDemoData(db);
    service = new ProductsService(db);
  });

  it('retrieves categories and creates new categories', () => {
    const initialCats = service.getCategories();
    expect(initialCats.length).toBeGreaterThan(0);

    const newCat = service.createCategory('Puja & Incense', 'Agarbatti, camphor, diya oil');
    expect(newCat.id).toBeDefined();
    expect(newCat.name).toBe('Puja & Incense');

    const updatedCats = service.getCategories();
    expect(updatedCats.some((c) => c.name === 'Puja & Incense')).toBe(true);
  });

  it('creates new products with auto-generated barcodes for loose goods', () => {
    // 1. Packaged product
    const soap = service.createProduct({
      barcode: '8901030999999',
      name: 'Medimix Ayurvedic Soap 75g',
      kannadaName: 'ಮೆಡಿಮಿಕ್ಸ್ ಸೋಪ್',
      categoryId: 5,
      isLoose: false,
      unit: 'piece',
      costPrice: 28,
      sellingPrice: 35,
      mrp: 35,
      currentStock: 25,
      minStockAlert: 10,
    });

    expect(soap.id).toBeDefined();
    expect(soap.barcode).toBe('8901030999999');
    expect(soap.profitMarginPercent).toBe(20); // (35 - 28) / 35 = 20%

    // 2. Loose good without barcode -> should auto-generate LOOSE-XXX
    const chana = service.createProduct({
      name: 'Chana Dal Premium (Loose)',
      kannadaName: 'ಕಡಲೆ ಬೇಳೆ',
      categoryId: 1,
      isLoose: true,
      unit: 'kg',
      costPrice: 85,
      sellingPrice: 98,
      mrp: 105,
      currentStock: 50,
      minStockAlert: 15,
    });

    expect(chana.barcode).toMatch(/^LOOSE-\d{3}$/);
    expect(chana.isLoose).toBe(true);
  });

  it('filters products by search, category, and stock status', () => {
    // Search filter by exact name
    const riceResults = service.getProducts({ search: 'Sona Masoori' });
    expect(riceResults.length).toBe(1);
    expect(riceResults[0].name).toContain('Rice');

    // Phonetic search filter: typing "sakkare" finds Sugar
    const sugarResults = service.getProducts({ search: 'sakkare' });
    expect(sugarResults.length).toBeGreaterThan(0);
    expect(sugarResults[0].name).toContain('Sugar');

    // Phonetic search filter: typing "akki" finds Rice
    const akkiResults = service.getProducts({ search: 'akki' });
    expect(akkiResults.length).toBeGreaterThan(0);
    expect(akkiResults[0].name).toContain('Rice');

    // Loose goods filter
    const looseResults = service.getProducts({ isLoose: true });
    expect(looseResults.length).toBeGreaterThan(0);
    expect(looseResults.every((p) => p.isLoose)).toBe(true);

    // Low stock filter (e.g. Jaggery, Nandini Ghee, Mysore Sandal Soap are low in seed)
    const lowResults = service.getProducts({ stockStatus: 'low' });
    expect(lowResults.length).toBeGreaterThan(0);
    expect(lowResults.every((p) => p.currentStock <= p.minStockAlert)).toBe(true);
  });

  it('adjusts stock with reason and writes to audit logs', () => {
    // Nandini Ghee has 8 packets in seed
    const prod = service.getProducts({ search: 'Nandini Pure Ghee' })[0];
    const initialStock = prod.currentStock;

    // Receive 12 packets delivery
    const updated = service.adjustStock(prod.id, 12, 'Supplier delivery received');
    expect(updated.currentStock).toBe(initialStock + 12);

    // Verify audit log entry
    const log = db.prepare("SELECT * FROM audit_logs WHERE action = 'STOCK_ADJUSTMENT' ORDER BY id DESC LIMIT 1").get() as {
      details: string;
    };
    expect(log.details).toContain('Supplier delivery received');
  });

  it('soft deactivates a product, preserving historical integrity', () => {
    const prod = service.getProducts({ search: 'Tata Salt' })[0];
    const success = service.deactivateProduct(prod.id);
    expect(success).toBe(true);

    // Tata Salt should no longer appear in active products
    const activeProducts = service.getProducts({ search: 'Tata Salt' });
    expect(activeProducts.length).toBe(0);

    // But raw database row exists with is_active = 0
    const raw = db.prepare('SELECT is_active FROM products WHERE id = ?').get(prod.id) as { is_active: number };
    expect(raw.is_active).toBe(0);
  });

  it('calculates total inventory valuation metrics accurately', () => {
    const metrics = service.getInventoryMetrics();
    expect(metrics.totalProducts).toBeGreaterThan(0);
    expect(metrics.totalValuationCost).toBeGreaterThan(0);
    expect(metrics.totalValuationRetail).toBeGreaterThan(metrics.totalValuationCost);
    expect(metrics.lowStockCount).toBeGreaterThan(0);
    expect(metrics.looseGoodsCount).toBeGreaterThan(0);
  });
});
