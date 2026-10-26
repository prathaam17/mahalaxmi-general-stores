import express, { Router } from 'express';
import { SettingsController } from './settings.controller.js';

export function createSettingsRouter(): Router {
  const router = Router();
  const controller = new SettingsController();

  // Settings CRUD
  router.get('/', controller.getSettings);
  router.put('/', controller.updateSettings);

  // Status & Backup
  router.get('/status', controller.getStatus);
  router.get('/backup', controller.downloadBackup);

  // Restore endpoint accepts raw binary octet-stream
  router.post(
    '/restore',
    express.raw({ type: ['application/octet-stream', 'application/x-sqlite3', 'application/vnd.sqlite3'], limit: '50mb' }),
    controller.restoreDatabase
  );

  // Audit Logs
  router.get('/audit', controller.getAuditLogs);

  return router;
}
