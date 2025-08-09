import { Express, Request, Response } from 'express';
import { DataStore } from '../store/datastore.js';

export function registerTeacherRoutes(app: Express) {
  app.get('/api/teachers', async (_req: Request, res: Response) => {
    try {
      const store: DataStore = app.get('dataStore');
      const teachers = await store.listTeachers();
      res.json({ teachers });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}