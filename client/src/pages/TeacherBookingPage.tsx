import { useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5174';

export function TeacherBookingPage() {
  const userId = useMemo(() => `u_${Math.random().toString(36).slice(2)}`, []);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [startIso, setStartIso] = useState('');
  const [endIso, setEndIso] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/teachers`).then(r => r.json()).then(d => setTeachers(d.teachers));
  }, []);

  const book = async (teacher: any) => {
    if (!startIso || !endIso) return;
    await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ teacherId: teacher.id, startIso, endIso, hourlyCredits: teacher.hourlyCredits })
    });
    alert('Rezervasyon oluşturuldu, öğretmen onayı bekleniyor');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Öğretmen Kirala</h1>
      <div className="flex gap-2">
        <input type="datetime-local" value={startIso} onChange={(e) => setStartIso(e.target.value)} className="px-2 py-2 bg-neutral-900 border border-neutral-800 rounded" />
        <input type="datetime-local" value={endIso} onChange={(e) => setEndIso(e.target.value)} className="px-2 py-2 bg-neutral-900 border border-neutral-800 rounded" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {teachers.map(t => (
          <div key={t.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="font-semibold">{t.name}</div>
            <div className="text-sm text-neutral-400">{t.subjects.join(', ')}</div>
            <div className="text-sm mt-1">Saatlik: {t.hourlyCredits} kredi | Deneyim: {t.experienceYears} yıl</div>
            <button onClick={() => book(t)} className="mt-3 px-3 py-2 bg-indigo-600 rounded">Rezervasyon Yap</button>
          </div>
        ))}
      </div>
    </div>
  );
}