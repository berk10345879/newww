import { Link } from 'react-router-dom';

export function DashboardPage() {
  const userName = 'Öğrenci';
  const credits = 3;

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
      <aside className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
        <Link to="/video-chat" className="block px-3 py-2 rounded hover:bg-neutral-800">Video Seans</Link>
        <Link to="/marketplace" className="block px-3 py-2 rounded hover:bg-neutral-800">Not Pazarı</Link>
        <Link to="/teacher-booking" className="block px-3 py-2 rounded hover:bg-neutral-800">Öğretmen Kirala</Link>
        <Link to="/buy-credits" className="block px-3 py-2 rounded hover:bg-neutral-800">Kredi Satın Al</Link>
        <Link to="/settings" className="block px-3 py-2 rounded hover:bg-neutral-800">Ayarlar</Link>
      </aside>

      <section className="space-y-6">
        <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-neutral-400 text-sm">Hoş geldin</div>
              <div className="text-xl font-semibold">{userName}</div>
            </div>
            <div className="text-right">
              <div className="text-neutral-400 text-sm">Kalan Kredi</div>
              <div className="text-2xl font-bold">{credits}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/video-chat" className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700">Video Seans Başlat</Link>
          <Link to="/marketplace" className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700">Popüler Notlar</Link>
          <Link to="/teacher-booking" className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700">Öğretmen Bul</Link>
        </div>
      </section>
    </div>
  );
}