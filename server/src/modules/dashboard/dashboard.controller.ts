import type { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  private service: DashboardService;

  constructor(service?: DashboardService) {
    this.service = service || new DashboardService();
  }

  getSummary = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const summary = this.service.getSummary();
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  };
}
