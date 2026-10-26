import { Router } from 'express';
import { ReportsController } from './reports.controller.js';

export function createReportsRouter(): Router {
  const router = Router();
  const controller = new ReportsController();

  router.get('/sales', controller.getSalesReport);

  return router;
}
