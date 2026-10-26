import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SuppliersService } from './suppliers.service.js';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier / Distributor name is required'),
  phone: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  initialBalance: z.number().nonnegative().optional().default(0),
});

const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier / Distributor name is required'),
  phone: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

const purchaseItemSchema = z.object({
  productId: z.number().nullable().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit: z.string().min(1, 'Unit is required'),
  unitCostPrice: z.number().nonnegative('Cost price cannot be negative'),
  updateProductCost: z.boolean().optional(),
});

const recordPurchaseSchema = z.object({
  supplierId: z.number().positive('Valid supplier ID is required'),
  invoiceNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one purchase item is required'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT']),
  paidAmount: z.number().nonnegative('Paid amount cannot be negative'),
  notes: z.string().optional(),
});

const supplierPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
  notes: z.string().optional(),
});

export class SuppliersController {
  private service: SuppliersService;

  constructor(service?: SuppliersService) {
    this.service = service || new SuppliersService();
  }

  getSuppliers = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const hasBalance = req.query.hasBalance === 'true';

      const suppliers = this.service.getSuppliers({ search, hasBalance });
      res.json({ success: true, data: suppliers });
    } catch (err) {
      next(err);
    }
  };

  getMetrics = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const metrics = this.service.getSupplierMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  };

  getSupplierById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid supplier ID' } });
        return;
      }

      const supplier = this.service.getSupplierById(id);
      if (!supplier) {
        res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
        return;
      }

      res.json({ success: true, data: supplier });
    } catch (err) {
      next(err);
    }
  };

  createSupplier = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = supplierSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid input data' },
        });
        return;
      }

      const created = this.service.createSupplier(parsed.data);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  };

  updateSupplier = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid supplier ID' } });
        return;
      }

      const parsed = updateSupplierSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid input data' },
        });
        return;
      }

      const updated = this.service.updateSupplier(id, parsed.data);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  deleteSupplier = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid supplier ID' } });
        return;
      }

      this.service.deleteSupplier(id);
      res.json({ success: true, data: { message: 'Supplier successfully deactivated' } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deactivating supplier';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  recordPurchase = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = recordPurchaseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid purchase data' },
        });
        return;
      }

      const purchase = this.service.recordPurchase(parsed.data);
      res.status(201).json({ success: true, data: purchase });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error recording purchase';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  recordPayment = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid supplier ID' } });
        return;
      }

      const parsed = supplierPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid payment data' },
        });
        return;
      }

      const result = this.service.recordPayment(id, parsed.data);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error recording payment';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  getStatement = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid supplier ID' } });
        return;
      }

      const statement = this.service.getSupplierStatement(id);
      res.json({ success: true, data: statement });
    } catch (err) {
      next(err);
    }
  };

  getPurchases = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const purchases = this.service.getPurchases({ supplierId, limit });
      res.json({ success: true, data: purchases });
    } catch (err) {
      next(err);
    }
  };

  getPurchaseById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid purchase ID' } });
        return;
      }

      const purchase = this.service.getPurchaseById(id);
      if (!purchase) {
        res.status(404).json({ success: false, error: { message: 'Purchase invoice not found' } });
        return;
      }

      res.json({ success: true, data: purchase });
    } catch (err) {
      next(err);
    }
  };
}
