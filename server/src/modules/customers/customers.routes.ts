import { Router } from 'express';
import { CustomersController } from './customers.controller.js';

export function createCustomersRouter(controller = new CustomersController()): Router {
  const router = Router();

  router.get('/', controller.getCustomers);
  router.get('/metrics', controller.getMetrics);
  router.get('/:id', controller.getCustomerById);
  router.post('/', controller.createCustomer);
  router.put('/:id', controller.updateCustomer);
  router.post('/:id/payments', controller.recordPayment);
  router.get('/:id/statement', controller.getStatement);
  router.delete('/:id', controller.deactivateCustomer);

  return router;
}
