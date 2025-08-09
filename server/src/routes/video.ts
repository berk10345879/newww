import { Express, Request, Response } from 'express';
import { DataStore } from '../store/datastore.js';

function requireUserId(req: Request): string {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) throw new Error('missing_user_id');
  return userId;
}

export function registerVideoRoutes(app: Express) {
  app.post('/api/video/start', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const store: DataStore = app.get('dataStore');
      const session = await store.createVideoSession(userId, 1);
      res.json({ session });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/video/:id/end', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const store: DataStore = app.get('dataStore');
      const s = await store.endVideoSession(req.params.id);
      if (!s) return res.status(404).json({ error: 'not_found' });
      await store.consumeCredits(userId, s.costCredits, 'video_session');
      res.json({ session: s });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/video/history', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const store: DataStore = app.get('dataStore');
      const list = await store.listVideoSessions(userId);
      res.json({ sessions: list });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}