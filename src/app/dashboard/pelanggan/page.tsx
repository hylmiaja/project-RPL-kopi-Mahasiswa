import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Pelanggan – Kopi Mahasiswa" };

export default async function PelangganDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "PELANGGAN") redirect("/dashboard");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header / Welcome */}
      <div className="relative bg-gradient-premium rounded-3xl p-10 overflow-hidden shadow-elegant">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute left-10 bottom-0 w-32 h-32 bg-[#b8860b]/10 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="absolute right-8 top-8 text-8xl opacity-10 select-none drop-shadow-lg filter blur-[2px]">☕</div>
        <div className="relative z-10">
          <p className="text-[#d4bda8] text-sm font-medium mb-2 tracking-widest uppercase text-xs">Selamat datang kembali</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-3 tracking-tight">
            {session.user.name} <span className="text-[#b8860b]">✨</span>
          </h1>
          <p className="text-[#eaddd7] max-w-md text-sm md:text-base leading-relaxed">
            Nikmati seduhan kopi premium favoritmu hari ini. Setiap tetes adalah mahakarya.
          </p>
        </div>
      </div>

      {/* Stats Pelanggan */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Total Pesanan",    value: "0",   icon: "🧾", accent: "from-[#d4bda8]/20 to-transparent" },
          { label: "Pesanan Selesai",  value: "0",   icon: "✨", accent: "from-[#b8860b]/20 to-transparent" },
          { label: "Poin Reward",      value: "0 Pt",icon: "⭐", accent: "from-[#8b5e34]/20 to-transparent" },
        ].map((stat, i) => (
          <div key={stat.label} className={`glass-premium border border-[#eaddd7] rounded-3xl p-6 relative overflow-hidden group hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 animate-delay-${(i+1)*100}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl drop-shadow-sm">{stat.icon}</span>
                <span className="text-2xl font-display font-bold text-[#3b2b20]">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-[#5c4033] uppercase tracking-wider text-[10px]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Favorit */}
      <div className="glass-premium rounded-3xl border border-[#eaddd7] p-8 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-end mb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#3b2b20] font-display">☕ Pesan Favoritmu</h2>
            <p className="text-sm text-[#8b5e34] mt-1">Pilihan kopi terbaik untuk menemanimu hari ini.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
          {[
            { name: "Espresso Classic",   price: "Rp 25.000", emoji: "☕", desc: "Kuat & autentik", tag: "Best Seller" },
            { name: "Vanilla Latte",      price: "Rp 35.000", emoji: "🥛", desc: "Lembut & manis", tag: "Sweet" },
            { name: "Cold Brew Original", price: "Rp 30.000", emoji: "🧊", desc: "Segar & dingin", tag: "Refreshing" },
          ].map((item) => (
            <div key={item.name} className="bg-white rounded-2xl border border-[#eaddd7] overflow-hidden hover:border-[#b8860b] hover:shadow-elegant transition-all duration-300 cursor-pointer group flex flex-col">
              <div className="bg-[#fcf9f5] p-8 text-center relative border-b border-[#eaddd7]">
                {item.tag && (
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-bold bg-[#3b2b20] text-white px-2 py-1 rounded-full">
                    {item.tag}
                  </span>
                )}
                <span className="text-5xl block group-hover:scale-110 transition-transform duration-500">{item.emoji}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <p className="font-display font-bold text-[#3b2b20] text-lg group-hover:text-gradient-gold transition-colors">{item.name}</p>
                <p className="text-xs text-[#8b5e34] mt-1 mb-3">{item.desc}</p>
                <div className="mt-auto flex items-center justify-between">
                  <p className="font-bold text-[#5c4033]">{item.price}</p>
                  <button className="w-10 h-10 rounded-full bg-[#fdfaf6] border border-[#d4bda8] text-[#3b2b20] font-bold group-hover:bg-[#3b2b20] group-hover:text-white group-hover:border-[#3b2b20] transition-all flex items-center justify-center shadow-sm">
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Pesanan */}
      <div className="glass-premium rounded-3xl border border-[#eaddd7] p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#3b2b20] mb-6 font-display">📋 Riwayat Pesanan</h2>
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-2xl border border-dashed border-[#d4bda8]">
          <span className="text-6xl mb-4 opacity-50 grayscale">🧾</span>
          <p className="text-[#3b2b20] font-bold font-display text-xl mb-2">Belum ada riwayat pesanan</p>
          <p className="text-[#8b5e34] text-sm max-w-sm mb-6">Yuk, jelajahi menu premium kami dan buat pesanan pertamamu hari ini!</p>
          <a href="/menu" className="px-8 py-3 rounded-xl bg-[#3b2b20] text-white text-sm font-semibold hover:bg-[#2b1d14] hover:shadow-elegant transition-all duration-300">
            Jelajahi Menu
          </a>
        </div>
      </div>
    </div>
  );
}
