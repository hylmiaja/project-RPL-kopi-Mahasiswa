import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Katalog Produk | Kopi Mahasiswa",
  description: "Eksplorasi lini produk unggulan kami yang diproses melalui standar kualitas premium.",
};

const MENU_ITEMS = [
  {
    id: "espresso",
    name: "Pure Espresso",
    desc: "Ekstraksi kopi konsentrasi tinggi dengan profil rasa intens. Ideal untuk stimulan energi optimal.",
    price: "Rp 15.000",
    image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800&auto=format&fit=crop",
    badge: "Core Product",
  },
  {
    id: "latte",
    name: "Signature Latte",
    desc: "Keseimbangan presisi antara espresso kuat dan kelembutan susu tersteamed. Konsistensi rasa terjamin.",
    price: "Rp 24.000",
    image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop",
    badge: "Best Seller",
  },
  {
    id: "cappuccino",
    name: "Classic Cappuccino",
    desc: "Rasio 1:1:1 sempurna dari espresso, susu panas, dan busa susu. Profil rasa klasik internasional.",
    price: "Rp 22.000",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop",
    badge: "Recommended",
  },
  {
    id: "matcha",
    name: "Premium Matcha Latte",
    desc: "Matcha grade seremonial Jepang yang dipadukan dengan tekstur susu lembut. Alternatif non-kafein unggulan.",
    price: "Rp 28.000",
    image: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?q=80&w=800&auto=format&fit=crop",
    badge: "Premium",
  },
  {
    id: "coldbrew",
    name: "18-Hour Cold Brew",
    desc: "Metode seduh dingin selama 18 jam menghasilkan profil rasa yang sangat halus dan tingkat keasaman rendah.",
    price: "Rp 20.000",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop",
    badge: "Specialty",
  },
  {
    id: "americano",
    name: "Iced Americano",
    desc: "Espresso base yang dilarutkan dalam air es murni. Pilihan esensial untuk produktivitas tanpa kalori tambahan.",
    price: "Rp 18.000",
    image: "https://images.unsplash.com/photo-1551030173-122aabc4489c?q=80&w=800&auto=format&fit=crop",
    badge: "Essential",
  },
];

export default function MenuPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        {/* Header Section */}
        <section className="px-4 sm:px-6 lg:px-8 mb-20 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            Katalog Produk
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
            Koleksi Produk <span className="text-blue-600">Premium</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
            Jelajahi lini produk F&B kami yang dirancang dengan presisi, menggunakan bahan baku berkualitas tinggi dan standar operasional yang konsisten.
          </p>
        </section>

        {/* Menu Grid */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {MENU_ITEMS.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col overflow-hidden border border-slate-200 rounded-2xl bg-white hover:border-slate-300 transition-all hover:shadow-lg hover:shadow-slate-200/50 group"
              >
                {/* Image Container */}
                <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 text-xs font-bold bg-white/90 backdrop-blur-sm text-slate-900 rounded-lg shadow-sm border border-slate-200/50">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-sm">{item.price}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                    {item.desc}
                  </p>
                  
                  <Link href="/dashboard/pelanggan/katalog" className="w-full">
                    <button className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm shadow-sm">
                      Pesan Sekarang
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
