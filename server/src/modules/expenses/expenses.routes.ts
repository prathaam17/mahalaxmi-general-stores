import { Router } from 'express';
import { ExpensesController } from './expenses.controller.js';

export function createExpensesRouter(): Router {
  const router = Router();
  const controller = new ExpensesController();

  // Metrics
  router.get('/metrics', controller.getMetrics);

  // Cash Register / Drawer Tracking
  router.get('/cash-register', controller.getCashRegister);
  router.post('/cash-register/opening', controller.setOpeningCash);
  router.post('/cash-register/close', controller.closeCashRegister);
  router.post('/cash-register/reopen', controller.reopenCashRegister);
  router.get('/cash-register/history', controller.getCashHistory);

  // Expenses CRUD
  router.get('/', controller.getExpenses);
  router.post('/', controller.createExpense);
  router.put('/:id', controller.updateExpense);
  router.delete('/:id', controller.deleteExpense);

  return router;
}
