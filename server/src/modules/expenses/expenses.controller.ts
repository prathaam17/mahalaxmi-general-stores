import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ExpensesService } from './expenses.service.js';

const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Expense amount must be greater than zero'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
  expenseDate: z.string().optional(),
});

const updateExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Expense amount must be greater than zero'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
  expenseDate: z.string().min(1, 'Date is required'),
});

const openingCashSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  openingCash: z.number().nonnegative('Opening cash cannot be negative'),
  notes: z.string().optional(),
});

const denominationsSchema = z.object({
  note500: z.number().nonnegative().default(0),
  note200: z.number().nonnegative().default(0),
  note100: z.number().nonnegative().default(0),
  note50: z.number().nonnegative().default(0),
  note20: z.number().nonnegative().default(0),
  note10: z.number().nonnegative().default(0),
  coins: z.number().nonnegative().default(0),
});

const closeRegisterSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  denominations: denominationsSchema,
  closingNotes: z.string().optional(),
});

export class ExpensesController {
  private service: ExpensesService;

  constructor(service?: ExpensesService) {
    this.service = service || new ExpensesService();
  }

  getExpenses = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const paymentMode = typeof req.query.paymentMode === 'string' ? req.query.paymentMode : undefined;

      const expenses = this.service.getExpenses({ startDate, endDate, category, paymentMode });
      res.json({ success: true, data: expenses });
    } catch (err) {
      next(err);
    }
  };

  getMetrics = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const metrics = this.service.getExpenseMetrics(date);
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  };

  createExpense = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = createExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid expense data' },
        });
        return;
      }

      const created = this.service.createExpense(parsed.data);
      res.status(201).json({ success: true, data: created });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating expense';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  updateExpense = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid expense ID' } });
        return;
      }

      const parsed = updateExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid expense data' },
        });
        return;
      }

      const updated = this.service.updateExpense(id, parsed.data);
      res.json({ success: true, data: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating expense';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  deleteExpense = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: { message: 'Invalid expense ID' } });
        return;
      }

      this.service.deleteExpense(id);
      res.json({ success: true, data: { message: 'Expense deleted successfully' } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting expense';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  // Cash Register Endpoints
  getCashRegister = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const register = this.service.getCashRegisterForDate(date);
      res.json({ success: true, data: register });
    } catch (err) {
      next(err);
    }
  };

  setOpeningCash = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = openingCashSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid opening cash input' },
        });
        return;
      }

      const summary = this.service.setOpeningCash(parsed.data.date, parsed.data.openingCash, parsed.data.notes);
      res.json({ success: true, data: summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error setting opening cash';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  closeCashRegister = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = closeRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid cash closing data' },
        });
        return;
      }

      const summary = this.service.closeCashRegister(parsed.data);
      res.json({ success: true, data: summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error closing cash register';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  reopenCashRegister = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const date = typeof req.body.date === 'string' ? req.body.date : new Date().toISOString().split('T')[0];
      const summary = this.service.reopenCashRegister(date);
      res.json({ success: true, data: summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error reopening cash register';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  getCashHistory = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const history = this.service.getCashRegisterHistory(limit);
      res.json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  };
}
