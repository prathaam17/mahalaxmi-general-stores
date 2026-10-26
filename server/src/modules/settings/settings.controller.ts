import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'node:fs';
import { SettingsService } from './settings.service.js';

const updateSettingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required').optional(),
  tagline: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  currencySymbol: z.string().optional(),
  receiptFooter: z.string().optional(),
  gstEnabled: z.boolean().optional(),
  defaultGstRate: z.number().nonnegative().optional(),
  autoPrintReceipt: z.boolean().optional(),
  isDemoMode: z.boolean().optional(),
});

export class SettingsController {
  private service: SettingsService;

  constructor(service?: SettingsService) {
    this.service = service || new SettingsService();
  }

  getSettings = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const settings = this.service.getSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  };

  updateSettings = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Invalid settings data' },
        });
        return;
      }

      const updated = this.service.updateSettings(parsed.data);
      res.json({ success: true, data: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating shop settings';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  getStatus = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const status = this.service.getDatabaseStatus();
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  };

  downloadBackup = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const { filePath, fileName } = this.service.createBackupFile();
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ success: false, error: { message: 'Database file not found on disk' } });
        return;
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  };

  restoreDatabase = (req: Request, res: Response, next: NextFunction): void => {
    try {
      let buffer: Buffer;
      if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
      } else if (req.body && typeof req.body === 'object' && req.body.data) {
        buffer = Buffer.from(req.body.data, 'base64');
      } else {
        res.status(400).json({
          success: false,
          error: { message: 'No valid database binary file uploaded' },
        });
        return;
      }

      const result = this.service.restoreDatabase(buffer);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to restore database';
      res.status(400).json({ success: false, error: { message } });
    }
  };

  getAuditLogs = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const action = typeof req.query.action === 'string' ? req.query.action : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const logs = this.service.getAuditLogs({ search, action, limit });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  };
}
