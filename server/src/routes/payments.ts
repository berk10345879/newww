import { Express, Request, Response } from 'express';
import Stripe from 'stripe';
import { DataStore } from '../store/datastore.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2024-09-30.acacia' as any }) : null;

const CREDIT_PACKAGES: Record<string, { credits: number; amountUsd: number; name: string }> = {
  small: { credits: 10, amountUsd: 5, name: '10 Kredi' },
  medium: { credits: 25, amountUsd: 10, name: '25 Kredi' },
  large: { credits: 50, amountUsd: 18, name: '50 Kredi' }
};

function requireUserId(req: Request): string {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) throw new Error('missing_user_id');
  return userId;
}

export function registerPaymentRoutes(app: Express) {
  app.post('/api/pay/create-session', async (req: Request, res: Response) => {
    try {
      if (!stripe) return res.status(400).json({ error: 'stripe_not_configured' });
      const userId = requireUserId(req);
      const pkgKey = String(req.body.packageKey);
      const pkg = CREDIT_PACKAGES[pkgKey];
      if (!pkg) return res.status(400).json({ error: 'invalid_package' });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: pkg.name },
              unit_amount: Math.round(pkg.amountUsd * 100)
            },
            quantity: 1
          }
        ],
        success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/buy-credits?success=true&session_id={CHECKOUT_SESSION_ID}&uid=${encodeURIComponent(userId)}`,
        cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/buy-credits?canceled=true`,
        metadata: { userId, credits: String(pkg.credits) }
      });

      res.json({ id: session.id, url: session.url });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/pay/success', async (req: Request, res: Response) => {
    try {
      if (!stripe) return res.status(400).json({ error: 'stripe_not_configured' });
      const sessionId = String(req.body.sessionId || '');
      const userId = requireUserId(req);
      if (!sessionId) return res.status(400).json({ error: 'missing_session' });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') return res.status(400).json({ error: 'not_paid' });
      const credits = Number(session.metadata?.credits || 0) || 0;
      if (!credits) return res.status(400).json({ error: 'missing_credits' });
      const store: DataStore = app.get('dataStore');
      const user = await store.addCredits(userId, credits, { source: 'stripe', stripeSessionId: sessionId });
      res.json({ ok: true, credits: user.credits });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
}