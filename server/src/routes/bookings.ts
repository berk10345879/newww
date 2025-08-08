import { Express, Request, Response } from 'express';
import { DataStore } from '../store/datastore.js';

function requireUserId(req: Request): string {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) throw new Error('missing_user_id');
  return userId;
}

export function registerBookingRoutes(app: Express) {
  app.post('/api/bookings', async (req: Request, res: Response) => {
    try {
      const userId = requireUserId(req);
      const { teacherId, startIso, endIso, hourlyCredits } = req.body || {};
      if (!teacherId || !startIso || !endIso) return res.status(400).json({ error: 'invalid_booking' });
      const store: DataStore = app.get('dataStore');
      const credits = Number(hourlyCredits || 1);
      await store.consumeCredits(userId, credits, 'teacher_booking');
      const booking = await store.createBooking({ teacherId, userId, startIso, endIso });
      res.json({ booking });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/bookings/:id/status', async (req: Request, res: Response) => {
    try {
      const status = String(req.body?.status || 'pending') as any;
      const store: DataStore = app.get('dataStore');
      const updated = await store.setBookingStatus(req.params.id, status);
      res.json({ booking: updated });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}