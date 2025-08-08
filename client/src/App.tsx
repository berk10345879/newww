import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VideoChatPage } from './pages/VideoChatPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { TeacherBookingPage } from './pages/TeacherBookingPage';
import { BuyCreditsPage } from './pages/BuyCreditsPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

function NavBar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-neutral-900/70 border-b border-neutral-800">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="font-bold text-lg">StudyMeet</Link>
        <div className="flex gap-4 text-sm">
          <Link to="/auth">Giriş</Link>
          <Link to="/dashboard">Panel</Link>
          <Link to="/video-chat">Video</Link>
          <Link to="/marketplace">Not Pazarı</Link>
          <Link to="/teacher-booking">Öğretmen</Link>
          <Link to="/buy-credits">Kredi</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/settings">Ayarlar</Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1 container py-6">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/video-chat" element={<VideoChatPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/teacher-booking" element={<TeacherBookingPage />} />
            <Route path="/buy-credits" element={<BuyCreditsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ToastContainer position="top-right" />
      </div>
    </BrowserRouter>
  );
}
