import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5174';

export function AdminPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/stats`).then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      {stats ? (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">Toplam Seans: {stats.totalSessions}</div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">Toplam Gelir (Kredi): {stats.totalRevenueCredits}</div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">Kullanıcılar: {stats.users}</div>
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">Not İndirmeleri: {stats.downloads}</div>
        </div>
      ) : (
        <div>Yükleniyor...</div>
      )}
    </div>
  );
}