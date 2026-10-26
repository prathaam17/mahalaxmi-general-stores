import { Router } from 'express';
import { SuppliersController } from './suppliers.controller.js';

export function createSuppliersRouter(): Router {
  const router = Router();
  const controller = new SuppliersController();

  // Metrics
  router.get('/metrics', controller.getMetrics);

  // Purchases
  router.get('/purchases', controller.getPurchases);
  router.post('/purchases', controller.recordPurchase);
  router.get('/purchases/:id', controller.getPurchaseById);

  // Suppliers CRUD
  router.get('/', controller.getSuppliers);
  router.post('/', controller.createSupplier);
  router.get('/:id', controller.getSupplierById);
  router.put('/:id', controller.updateSupplier);
  router.delete('/:id', controller.deleteSupplier);

  // Statement & Payments
  router.get('/:id/statement', controller.getStatement);
  router.post('/:id/payments', controller.recordPayment);

  return router;
}
