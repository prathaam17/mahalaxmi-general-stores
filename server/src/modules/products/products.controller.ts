import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductsService } from './products.service.js';

const productSchema = z.object({
  barcode: z.string().nullable().optional(),
  name: z.string().min(1, 'Product name is required'),
  kannadaName: z.string().nullable().optional(),
  searchKeywords: z.string().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  isLoose: z.boolean().default(false),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.number().nonnegative('Cost price cannot be negative'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  mrp: z.number().nonnegative().optional(),
  currentStock: z.number().nonnegative().optional().default(0),
  minStockAlert: z.number().nonnegative().optional().default(5),
});

const stockAdjustSchema = z.object({
  deltaQuantity: z.number({ required_error: 'Adjustment quantity is required' }),
  reason: z.string().min(1, 'Adjustment reason is required'),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export class ProductsController {
  private service: ProductsService;

  constructor(service?: ProductsService) {
    this.service = service || new ProductsService();
  }

  getProducts = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;
      const stockStatus = req.query.stockStatus as 'all' | 'low' | 'out_of_stock' | 'normal' | undefined;
      const isLoose = req.query.isLoose === 'true' ? true : req.query.isLoose === 'false' ? false : undefined;

      const products = this.service.getProducts({
        search,
        categoryId,
        stockStatus,
        isLoose,
      });

      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  };

  getMetrics = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const metrics = this.service.getInventoryMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  };

  getCategories = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const categories = this.service.getCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  };

  createCategory = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid category data', details: parsed.error.format() } });
        return;
      }

      const category = this.service.createCategory(parsed.data.name, parsed.data.description);
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  };

  createProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid product data', details: parsed.error.format() } });
        return;
      }

      const product = this.service.createProduct(parsed.data);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  };

  updateProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid product ID' } });
        return;
      }

      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid product data', details: parsed.error.format() } });
        return;
      }

      const product = this.service.updateProduct(id, parsed.data);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  };

  adjustStock = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid product ID' } });
        return;
      }

      const parsed = stockAdjustSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid adjustment data', details: parsed.error.format() } });
        return;
      }

      const product = this.service.adjustStock(id, parsed.data.deltaQuantity, parsed.data.reason);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  };

  deactivateProduct = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid product ID' } });
        return;
      }

      this.service.deactivateProduct(id);
      res.json({ success: true, message: 'Product deactivated successfully' });
    } catch (err) {
      next(err);
    }
  };
}
