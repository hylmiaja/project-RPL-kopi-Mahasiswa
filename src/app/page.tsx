import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Coffee,
  Wifi,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Users,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kopi Mahasiswa – Kedai Kopi Premium & Coworking Space",
  description:
    "Nikmati cita rasa biji kopi nusantara dengan standar barista profesional dan harga ramah mahasiswa. Tempat nyaman untuk belajar, berdiskusi, dan berkolaborasi.",
};

const POPULAR_ITEMS = [
  {
    id: "latte",
    name: "Signature Latte",
    desc: "Keseimbangan presisi antara espresso nusantara dan kelembutan susu tersteamed secara segar.",
    price: "Rp 24.000",
    badge: "Best Seller",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "cappuccino",
    name: "Classic Cappuccino",
    desc: "Rasio 1:1:1 sempurna espresso, susu panas, dan busa susu lembut tebal dengan taburan cocoa.",
    price: "Rp 22.000",
    badge: "Pilihan Barista",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "coldbrew",
    name: "18-Hour Cold Brew",
    desc: "Ekstraksi dingin selama 18 jam penuh menghasilkan seduhan lembut kaya rasa dengan keasaman sangat rendah.",
    price: "Rp 20.000",
    badge: "Specialty",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
  },
];

const FEATURES = [
  {
    icon: Coffee,
    title: "100% Biji Kopi Nusantara",
    desc: "Kurasi biji kopi lokal berkualitas grade specialty dari petani binaan di Aceh Gayo, Toraja, hingga Mandailing.",
  },
  {
    icon: Wifi,
    title: "High-Speed WiFi & Colokan",
    desc: "Fasilitas internet kencang dan stop kontak melimpah di setiap sudut meja untuk mendukung sesi nugas panjang.",
  },
  {
    icon: Zap,
    title: "Harga Pas Kantong Mahasiswa",
    desc: "Cita rasa premium ala kafe berkelas dengan banderol harga yang ramah di dompet setiap hari.",
  },
  {
    icon: ShieldCheck,
    title: "Pemesanan & Kasir Modern",
    desc: "Sistem digital terintegrasi untuk pemesanan cepat meja, pembayaran QRIS instan, dan pelacakan pesanan.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-[#f8fafc] border-b border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Ruang Kolaborasi & Kopi Nusantara Pilihan</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none max-w-4xl mx-auto mb-6">
              Kopi Berkualitas Tinggi, <br className="hidden sm:inline" />
              <span className="text-blue-600">Harga Ramah Mahasiswa.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Tempat terbaik untuk nongkrong santai, berdiskusi tugas kelompok, atau menikmati
              racikan kopi barista profesional tanpa khawatir menguras dompet akhir bulan.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto mb-16">
              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Coffee className="w-4 h-4" />
                <span>Lihat Katalog Menu</span>
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Tentang Kami</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>

            {/* Highlights Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-200/80">
              <div className="flex flex-col items-center p-3">
                <span className="text-2xl font-black text-slate-900">100%</span>
                <span className="text-xs text-slate-500 mt-0.5">Biji Asli Nusantara</span>
              </div>
              <div className="flex flex-col items-center p-3">
                <span className="text-2xl font-black text-blue-600">Rp 15k+</span>
                <span className="text-xs text-slate-500 mt-0.5">Harga Bersahabat</span>
              </div>
              <div className="flex flex-col items-center p-3">
                <span className="text-2xl font-black text-slate-900">Free WiFi</span>
                <span className="text-xs text-slate-500 mt-0.5">Koneksi Kencang & Stabil</span>
              </div>
              <div className="flex flex-col items-center p-3">
                <span className="text-2xl font-black text-amber-600">4.9 ★</span>
                <span className="text-xs text-slate-500 mt-0.5">Rating Kepuasan Tamu</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: FEATURED MENU */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                <Coffee className="w-4 h-4" />
                Menu Pilihan Barista
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Varian Favorit Minggu Ini
              </h2>
            </div>
            <Link
              href="/menu"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>Lihat Semua Katalog Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden border border-slate-200 rounded-2xl bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 group"
              >
                {/* Image Container */}
                <div className="relative h-60 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-lg shadow-xs border backdrop-blur-md bg-white/95 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-sm shrink-0 ml-2">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                    {item.desc}
                  </p>

                  <Link href="/dashboard/pelanggan/katalog" className="w-full">
                    <button className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-medium transition-colors text-sm shadow-xs flex items-center justify-center gap-2">
                      <span>Pesan Varian Ini</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: VALUE PROPOSITIONS */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Fasilitas & Layanan
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mt-2 mb-4">
                Mengapa Mahasiswa Memilih Kami?
              </h2>
              <p className="text-slate-600 text-base">
                Dirancang khusus untuk memenuhi ritme harian perkuliahan—dari seduhan kafein pertama
                di pagi hari hingga ruang fokus mengerjakan tugas di malam hari.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION: STUDY SPACE ATMOSPHERE */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="grid lg:grid-cols-2 items-center">
              <div className="p-8 sm:p-12 lg:p-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-6">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Coworking & Study Atmosphere</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6 leading-tight">
                  Rumah Kedua untuk <br />
                  <span className="text-blue-400">Ide & Karya Hebatmu.</span>
                </h2>
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
                  Kami memahami kebutuhan ruang belajar yang tenang, nyaman, dan berenergi. Di Kopi
                  Mahasiswa, kamu dapat menyelesaikan skripsi, berkolaborasi dengan tim organisasi,
                  atau sekadar santai membaca buku favoritmu.
                </p>

                <div className="space-y-3 mb-10 text-sm text-slate-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Ruangan berpendingin udara (AC) yang bersih dan wangi seduhan kopi</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Stop kontak di setiap meja tanpa harus berebut tempat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Area indoor non-smoking & outdoor yang bersahabat</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/menu"
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg"
                  >
                    Pesan Menu Sekarang
                  </Link>
                  <Link
                    href="/about"
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors border border-white/20"
                  >
                    Pelajari Cerita Kami
                  </Link>
                </div>
              </div>

              <div className="relative h-72 sm:h-96 lg:h-full min-h-[380px] w-full bg-slate-800">
                <Image
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop"
                  alt="Suasana Ruang Belajar Kopi Mahasiswa"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: CTA BANNER */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Siap Menikmati Secangkir Kopi Hari Ini?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Kunjungi kedai kami langsung di kampus atau buka katalog untuk memilih sajian
              favoritmu sekarang.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/menu"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all"
              >
                Buka Katalog Lengkap
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-medium text-sm border border-blue-400/40 transition-all"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
