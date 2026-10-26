import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CustomersService } from './customers.service.js';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  creditLimit: z.number().nonnegative().optional().default(2000),
  initialBalance: z.number().nonnegative().optional().default(0),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  creditLimit: z.number().nonnegative('Credit limit cannot be negative'),
});

const paymentSchema = z.object({
  amount: z.number().positive('Repayment amount must be greater than zero'),
  paymentMode: z.enum(['CASH', 'UPI']),
  notes: z.string().optional(),
});

export class CustomersController {
  private service: CustomersService;

  constructor(service?: CustomersService) {
    this.service = service || new CustomersService();
  }

  getCustomers = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const hasBalance = req.query.hasBalance === 'true';

      const customers = this.service.getCustomers({ search, hasBalance });
      res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  };

  getMetrics = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const metrics = this.service.getCustomerMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  };

  getCustomerById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer ID' } });
        return;
      }

      const customer = this.service.getCustomerById(id);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  createCustomer = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer data', details: parsed.error.format() } });
        return;
      }

      const customer = this.service.createCustomer(parsed.data);
      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  updateCustomer = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer ID' } });
        return;
      }

      const parsed = updateCustomerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer update data', details: parsed.error.format() } });
        return;
      }

      const customer = this.service.updateCustomer(id, parsed.data);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  recordPayment = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer ID' } });
        return;
      }

      const parsed = paymentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { message: 'Invalid payment data', details: parsed.error.format() } });
        return;
      }

      const result = this.service.recordPayment(
        id,
        parsed.data.amount,
        parsed.data.paymentMode,
        parsed.data.notes
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  getStatement = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer ID' } });
        return;
      }

      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

      const statement = this.service.getStatement(id, startDate, endDate);
      res.json({ success: true, data: statement });
    } catch (err) {
      next(err);
    }
  };

  deactivateCustomer = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid customer ID' } });
        return;
      }

      this.service.deactivateCustomer(id);
      res.json({ success: true, message: 'Customer account deactivated successfully' });
    } catch (err) {
      next(err);
    }
  };
}
