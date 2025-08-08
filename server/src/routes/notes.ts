import { Express, Request, Response } from 'express';
import { DataStore } from '../store/datastore.js';

function requireUserId(req: Request): string {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) throw new Error('missing_user_id');
  return userId;
}

export function registerNoteRoutes(app: Express) {
  app.post('/api/notes', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const { title, description, category, priceCredits, storagePath } = req.body || {};
      if (!title || !category || !storagePath) return res.status(400).json({ error: 'invalid_note' });
      const store: DataStore = app.get('dataStore');
      const note = await store.createNote({ ownerUserId: userId, title, description, category, priceCredits: Number(priceCredits || 1), storagePath });
      res.json({ note });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/notes', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const order = (req.query.order as 'popular' | 'latest' | undefined) || 'latest';
      const store: DataStore = app.get('dataStore');
      const notes = await store.listNotes({ category, order });
      res.json({ notes });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/notes/:id/purchase', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const noteId = req.params.id;
      const store: DataStore = app.get('dataStore');
      await store.consumeCredits(userId, 1, 'note_purchase');
      const updated = await store.incrementNoteDownload(noteId);
      res.json({ ok: true, note: updated });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}