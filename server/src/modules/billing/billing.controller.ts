import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BillingService } from './billing.service.js';

const cartItemSchema = z.object({
  productId: z.number().nullable().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.number().nonnegative().optional(),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  lineTotal: z.number().nonnegative('Line total cannot be negative'),
});

const createBillSchema = z.object({
  customerId: z.number().nullable().optional(),
  items: z.array(cartItemSchema).min(1, 'At least one item is required in the bill'),
  discount: z.number().nonnegative().optional().default(0),
  taxAmount: z.number().nonnegative().optional().default(0),
  paymentMode: z.enum(['CASH', 'UPI', 'CREDIT', 'SPLIT']),
  cashReceived: z.number().nonnegative().optional().default(0),
  upiReceived: z.number().nonnegative().optional().default(0),
  creditAdded: z.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
});

export class BillingController {
  private service: BillingService;

  constructor(service?: BillingService) {
    this.service = service || new BillingService();
  }

  searchProducts = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const products = this.service.searchProducts(q);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  };

  getCustomers = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const customers = this.service.getCustomers(q);
      res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  };

  createBill = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = createBillSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid bill request data',
            details: parsed.error.format(),
          },
        });
        return;
      }

      const bill = this.service.createBill(parsed.data);
      res.status(201).json({
        success: true,
        data: bill,
      });
    } catch (err) {
      next(err);
    }
  };

  getBillById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const billId = parseInt(req.params.id, 10);
      if (isNaN(billId)) {
        res.status(400).json({ success: false, error: { message: 'Invalid bill ID' } });
        return;
      }
      const bill = this.service.getBillById(billId);
      res.json({ success: true, data: bill });
    } catch (err) {
      next(err);
    }
  };

  reverseBill = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const billId = parseInt(req.params.id, 10);
      const reason = typeof req.body.reason === 'string' ? req.body.reason : '';

      if (isNaN(billId)) {
        res.status(400).json({ success: false, error: { message: 'Invalid bill ID' } });
        return;
      }

      if (!reason.trim()) {
        res.status(400).json({ success: false, error: { message: 'Reversal reason is required' } });
        return;
      }

      const bill = this.service.reverseBill(billId, reason);
      res.json({ success: true, data: bill });
    } catch (err) {
      next(err);
    }
  };
}
