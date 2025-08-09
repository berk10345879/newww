import { Express, Request, Response } from 'express';
import { DataStore } from '../store/datastore.js';

export function registerAdminRoutes(app: Express) {
  app.get('/api/admin/stats', async (_req: Request, res: Response) => {
    try {
      const store: DataStore = app.get('dataStore');
      const snapshot = await store.stats();
      res.json(snapshot);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}