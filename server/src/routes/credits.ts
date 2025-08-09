import { Express, Request, Response } from 'express';
import { DataStore } from '../store/datastore.js';

function requireUserId(req: Request): string {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) throw new Error('missing_user_id');
  return userId;
}

export function registerCreditRoutes(app: Express) {
  app.get('/api/credits', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const store: DataStore = app.get('dataStore');
      const user = await store.getOrCreateUser({ id: userId, email: `${userId}@example.com` });
      res.json({ credits: user.credits, user });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/credits/consume', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const amount = Number(req.body?.amount || 0);
      if (!amount || amount <= 0) return res.status(400).json({ error: 'invalid_amount' });
      const store: DataStore = app.get('dataStore');
      const user = await store.consumeCredits(userId, amount, 'manual');
      res.json({ credits: user.credits });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/credits/add', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const amount = Number(req.body?.amount || 0);
      if (!amount || amount <= 0) return res.status(400).json({ error: 'invalid_amount' });
      const store: DataStore = app.get('dataStore');
      const user = await store.addCredits(userId, amount, { source: 'admin' });
      res.json({ credits: user.credits });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}