import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5174';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export function BuyCreditsPage() {
  const userId = useMemo(() => `u_${Math.random().toString(36).slice(2)}`, []);
  const [loading, setLoading] = useState(false);

  const buy = async (packageKey: 'small' | 'medium' | 'large') => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/pay/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ packageKey })
    });
    const data = await res.json();
    const stripe = await stripePromise;
    if (stripe && data.id) {
      await stripe.redirectToCheckout({ sessionId: data.id });
    }
    setLoading(false);
  };

  const url = new URL(window.location.href);
  const success = url.searchParams.get('success');
  const sessionId = url.searchParams.get('session_id');
  const uid = url.searchParams.get('uid');

  const confirmSuccess = async () => {
    if (success && sessionId && uid) {
      await fetch(`${API_BASE}/api/pay/success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
        body: JSON.stringify({ sessionId })
      });
      window.history.replaceState({}, '', '/buy-credits');
      alert('Kredi eklendi!');
    }
  };

  if (success) confirmSuccess();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kredi Satın Al</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <button disabled={loading} onClick={() => buy('small')} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">10 Kredi - $5</button>
        <button disabled={loading} onClick={() => buy('medium')} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">25 Kredi - $10</button>
        <button disabled={loading} onClick={() => buy('large')} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">50 Kredi - $18</button>
      </div>
    </div>
  );
}