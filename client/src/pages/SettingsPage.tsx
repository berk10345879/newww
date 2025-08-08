import { useState } from 'react';

export function SettingsPage() {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Ayarlar</h1>
      <div className="space-y-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="İsim" className="w-full px-2 py-2 bg-neutral-950 border border-neutral-800 rounded" />
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-400">Tema</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="px-2 py-2 bg-neutral-950 border border-neutral-800 rounded">
            <option value="dark">Koyu</option>
            <option value="light">Açık</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-indigo-600 rounded">Kaydet</button>
      </div>
      <button className="px-4 py-2 bg-red-600 rounded">Hesabı Sil</button>
    </div>
  );
}