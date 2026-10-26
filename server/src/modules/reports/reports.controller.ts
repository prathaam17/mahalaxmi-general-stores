import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReportsService } from './reports.service.js';

const reportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['today', 'week', 'month', 'year', 'custom']).optional(),
});

export class ReportsController {
  private service: ReportsService;

  constructor(service?: ReportsService) {
    this.service = service || new ReportsService();
  }

  getSalesReport = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = reportQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid query parameters' },
        });
        return;
      }

      const report = this.service.getSalesReport(parsed.data);
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  };
}
