import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5174';

export function MarketplacePage() {
  const userId = useMemo(() => `u_${Math.random().toString(36).slice(2)}`, []);
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Genel');
  const [price, setPrice] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  const loadNotes = async () => {
    const res = await fetch(`${API_BASE}/api/notes`);
    const data = await res.json();
    setNotes(data.notes);
  };

  useEffect(() => { loadNotes(); }, []);

  const uploadNote = async () => {
    if (!file || !title) return;
    const bucket = 'notes';
    const path = `${userId}/${Date.now()}_${file.name}`;
    await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    const res = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ title, description: '', category, priceCredits: price, storagePath: `${bucket}/${path}` })
    });
    await res.json();
    setTitle(''); setFile(null); setPrice(1);
    await loadNotes();
  };

  const purchase = async (id: string) => {
    await fetch(`${API_BASE}/api/notes/${id}/purchase`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': userId } });
    await loadNotes();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Not Pazarı</h1>

      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 grid md:grid-cols-4 gap-2 items-center">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Başlık" className="px-2 py-2 bg-neutral-950 border border-neutral-800 rounded" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kategori" className="px-2 py-2 bg-neutral-950 border border-neutral-800 rounded" />
        <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="px-2 py-2 bg-neutral-950 border border-neutral-800 rounded" />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="px-2 py-2 bg-neutral-950 border border-neutral-800 rounded" />
        <button onClick={uploadNote} className="md:col-span-4 px-4 py-2 bg-indigo-600 rounded">Yükle</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {notes.map(n => (
          <div key={n.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm text-neutral-400">{n.category}</div>
            <div className="mt-2 text-sm">İndirme: {n.downloads} | Fiyat: {n.priceCredits} kredi</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => purchase(n.id)} className="px-3 py-1.5 bg-neutral-800 rounded">1 Kredi ile İndir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}