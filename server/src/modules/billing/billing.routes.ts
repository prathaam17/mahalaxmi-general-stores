import { Router } from 'express';
import { BillingController } from './billing.controller.js';

export function createBillingRouter(controller = new BillingController()): Router {
  const router = Router();

  router.get('/products', controller.searchProducts);
  router.get('/customers', controller.getCustomers);
  router.post('/create', controller.createBill);
  router.get('/bills/:id', controller.getBillById);
  router.post('/bills/:id/reverse', controller.reverseBill);

  return router;
}
