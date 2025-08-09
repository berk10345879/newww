export function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-500/20">
        <h1 className="text-4xl md:text-6xl font-extrabold">StudyMeet</h1>
        <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
          Görüntülü ders çalışma, not pazarı ve öğretmen kiralama ile hepsi bir arada öğrenme platformu.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/auth" className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500">Giriş</a>
          <a href="/auth" className="px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700">Kayıt Ol</a>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Özellikler</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Görüntülü Ders Çalışma', desc: 'WebRTC ve Socket.io ile düşük gecikmeli görüşme.' },
            { title: 'Not Pazarı', desc: 'Not yükle, kategorilere göre filtrele ve puanla.' },
            { title: 'Öğretmen Kiralama', desc: 'Uzman hocalarla uygun saatleri seç ve rezervasyon yap.' },
            { title: 'Kredi Modeli', desc: 'Kredi satın al, seans başlat, not indir.' },
            { title: 'Stripe Ödeme', desc: 'Güvenli ve hızlı ödeme akışı.' },
            { title: 'Supabase Auth', desc: 'Email/Şifre ve Google ile giriş.' }
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
              <div className="font-semibold">{f.title}</div>
              <div className="text-neutral-400 mt-2 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Kullanıcı Yorumları</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
              <p className="text-neutral-300">Harika bir platform, çalışmayı kolaylaştırıyor!</p>
              <div className="mt-4 text-sm text-neutral-500">Öğrenci {i}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">SSS</h2>
        <div className="space-y-3">
          <details className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
            <summary>Nasıl kredi satın alırım?</summary>
            <p className="text-neutral-400 mt-2">Kredi satın almak için Kredi Satın Al sayfasını kullanın.</p>
          </details>
          <details className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
            <summary>Video seansı nasıl başlatırım?</summary>
            <p className="text-neutral-400 mt-2">Panelden Video Seans seçeneğine gidin ve seansı başlatın.</p>
          </details>
        </div>
      </section>
    </div>
  );
}