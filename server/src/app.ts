import express, { type Express } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createDashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { getDatabase } from './db/index.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      shop: config.SHOP_NAME,
      location: config.SHOP_LOCATION,
      mode: 'offline-first',
    });
  });

  // Shop settings endpoint
  app.get('/api/shop/settings', (_req, res, next) => {
    try {
      const db = getDatabase();
      const settings = db.prepare('SELECT * FROM shop_settings WHERE id = 1').get();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  });

  // Feature routers
  app.use('/api/dashboard', createDashboardRouter());

  // 404 handler for API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ success: false, error: { message: 'API route not found' } });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}
