import { Router } from 'express';
import { ProductsController } from './products.controller.js';

export function createProductsRouter(controller = new ProductsController()): Router {
  const router = Router();

  router.get('/', controller.getProducts);
  router.get('/metrics', controller.getMetrics);
  router.get('/categories', controller.getCategories);
  router.post('/categories', controller.createCategory);
  router.post('/', controller.createProduct);
  router.put('/:id', controller.updateProduct);
  router.post('/:id/adjust-stock', controller.adjustStock);
  router.delete('/:id', controller.deactivateProduct);

  return router;
}
