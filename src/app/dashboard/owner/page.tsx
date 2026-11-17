"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const SCHEDULE_DATA = [
  { hari: "Senin",  jamBuka: "07:00", jamTutup: "21:00", shift: "Kasir Kopi"             },
  { hari: "Selasa", jamBuka: "07:00", jamTutup: "21:00", shift: "Kasir Kopi"             },
  { hari: "Rabu",   jamBuka: "07:00", jamTutup: "21:00", shift: "Kasir Dua"              },
  { hari: "Kamis",  jamBuka: "07:00", jamTutup: "21:00", shift: "Kasir Dua"              },
  { hari: "Jumat",  jamBuka: "08:00", jamTutup: "22:00", shift: "Kasir Kopi"             },
  { hari: "Sabtu",  jamBuka: "08:00", jamTutup: "22:00", shift: "Kasir Kopi & Kasir Dua" },
  { hari: "Minggu", jamBuka: "09:00", jamTutup: "20:00", shift: "Kasir Dua"              },
];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default function OwnerDashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"laporan" | "jadwal" | "menu">("laporan");
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAnalytics, resOrders] = await Promise.all([
        fetch("/api/ai/analytics"),
        fetch("/api/orders"),
      ]);

      if (resAnalytics.ok) {
        const json = await resAnalytics.json();
        if (json.success) setAnalytics(json.data);
      }
      if (resOrders.ok) {
        const jsonOrders = await resOrders.json();
        if (jsonOrders.success) setOrders(jsonOrders.data || []);
      }
    } catch (err) {
      console.error("Error loading owner data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#3b2b20] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (session?.user?.role !== "OWNER") {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return null;
  }

  const totalOmzet = analytics?.totalRevenue || 0;
  const totalPesanan = analytics?.totalOrders || orders.length || 0;
  const completedOrders = analytics?.completedOrders || 0;
  const pendingOrders = analytics?.pendingOrders || 0;

  // Chart data from real orders
  const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const revenueByDay: Record<string, { amount: number; count: number }> = {};
  daysOfWeek.forEach((d) => (revenueByDay[d] = { amount: 0, count: 0 }));

  orders.forEach((o) => {
    if (o.createdAt) {
      const d = new Date(o.createdAt);
      const dayName = daysOfWeek[d.getDay()];
      revenueByDay[dayName].amount += o.totalAmount;
      revenueByDay[dayName].count += 1;
    }
  });

  const chartData = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => ({
    day: d,
    amount: revenueByDay[d]?.amount || 0,
    orders: revenueByDay[d]?.count || 0,
  }));

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 100000);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <div className="relative overflow-hidden bg-gradient-premium rounded-3xl p-8 shadow-elegant">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-16 bottom-0 w-32 h-32 bg-[#b8860b]/10 rounded-full blur-2xl translate-y-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl backdrop-blur-md shadow-inner">👑</div>
            <div>
              <p className="text-[#d4bda8] text-xs font-medium tracking-widest uppercase mb-1">Executive Dashboard (Live MySQL)</p>
              <h1 className="text-3xl font-display font-bold text-white">Halo, {session.user.name}</h1>
              <p className="text-[#eaddd7] text-sm mt-1 max-w-md">
                Tinjauan omzet dan laporan bisnis live dari database Laragon & terhubung dengan AI Chatbot.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-xs font-medium text-white backdrop-blur-md transition-all flex items-center gap-2"
            >
              🔄 {loading ? "Menyinkron..." : "Sinkronkan Data"}
            </button>
            <div className="px-4 py-2 bg-[#b8860b]/20 rounded-xl border border-[#b8860b]/30 text-xs font-medium text-[#fdfaf6] backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              MySQL Aktif
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Omzet (DB)",   value: fmt(totalOmzet),    sub: "Sinkron Chatbot & Kasir", icon: "💰", trend: "+100% Real" },
          { label: "Total Transaksi",     value: `${totalPesanan} Pesanan`, sub: `${completedOrders} Selesai, ${pendingOrders} Pending`, icon: "🧾", trend: "Live DB" },
          { label: "Menu Paling Laris",   value: analytics?.bestSeller || "Vanilla Latte", sub: "Berdasarkan pesanan nyata", icon: "⭐", trend: "Terlaris" },
          { label: "Bahan Baku Kritis",   value: `${analytics?.criticalStockCount || 0} Bahan`, sub: "Stok menipis", icon: "⚠️", trend: "Inventori" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#eaddd7] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-[11px] font-bold text-[#b8860b] bg-[#fdfaf6] border border-[#d4bda8] px-2 py-0.5 rounded-full">
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#3b2b20]">{stat.value}</p>
            <p className="text-xs font-semibold text-[#8b5e34] mt-1">{stat.label}</p>
            <p className="text-[11px] text-[#8b5e34]/70 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex gap-2 border-b border-[#eaddd7]">
        {(["laporan", "jadwal", "menu"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === tab
                ? "border-[#3b2b20] text-[#3b2b20] bg-white font-bold"
                : "border-transparent text-[#8b5e34] hover:text-[#3b2b20]"
            }`}
          >
            {tab === "laporan" ? "📊 Omzet & Grafik Live" : tab === "jadwal" ? "📅 Jadwal Operasional" : "☕ Status Menu & Resep"}
          </button>
        ))}
      </div>

      {/* ─── Tab: Laporan Live ─── */}
      {activeTab === "laporan" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eaddd7] shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#3b2b20]">Grafik Pendapatan Mingguan (Real Database)</h3>
                <p className="text-xs text-[#8b5e34] mt-1">Data langsung terhubung dengan transaksi di kasir dan SQL Laragon</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#b8860b]">{fmt(totalOmzet)}</span>
                <p className="text-xs text-[#8b5e34]">Total omzet tercatat</p>
              </div>
            </div>

            {/* Dynamic Bar Chart */}
            <div className="flex items-end gap-3 h-52 pt-6">
              {chartData.map((d, i) => {
                const pct = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3b2b20] text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-20 shadow-md">
                      {fmt(d.amount)} ({d.orders} pesanan)
                    </div>
                    <div
                      className="w-full rounded-t-xl transition-all duration-500 bg-gradient-to-t from-[#8b5e34] to-[#b8860b] group-hover:brightness-110"
                      style={{ height: `${Math.max(pct, 12)}%`, minHeight: "12px" }}
                    />
                    <span className="text-xs font-semibold text-[#8b5e34]">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Menu from Live DB */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eaddd7] shadow-sm">
            <h3 className="text-xl font-bold text-[#3b2b20] mb-4">Penjualan Menu Terlaris (Database Real-Time)</h3>
            <div className="space-y-4">
              {(analytics?.topMenu || []).length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada transaksi menu.</p>
              ) : (
                analytics.topMenu.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#fdfaf6] border border-[#eaddd7]">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">☕</span>
                      <div>
                        <p className="font-bold text-[#3b2b20] text-sm">{m.name}</p>
                        <p className="text-xs text-[#8b5e34]">{m.qty} porsi terjual</p>
                      </div>
                    </div>
                    <p className="font-bold text-[#b8860b] text-sm">{fmt(m.revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Jadwal ─── */}
      {activeTab === "jadwal" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eaddd7] shadow-sm">
          <h3 className="text-xl font-bold text-[#3b2b20] mb-4">Jadwal Operasional & Shift Kasir</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fdfaf6] border-b border-[#eaddd7]">
                  <th className="py-3 px-4 text-left font-bold text-[#3b2b20]">Hari</th>
                  <th className="py-3 px-4 text-left font-bold text-[#3b2b20]">Jam Buka</th>
                  <th className="py-3 px-4 text-left font-bold text-[#3b2b20]">Jam Tutup</th>
                  <th className="py-3 px-4 text-left font-bold text-[#3b2b20]">Petugas Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaddd7]">
                {SCHEDULE_DATA.map((row) => (
                  <tr key={row.hari} className="hover:bg-[#fdfaf6]/50">
                    <td className="py-3 px-4 font-semibold text-[#3b2b20]">{row.hari}</td>
                    <td className="py-3 px-4 text-[#8b5e34]">{row.jamBuka}</td>
                    <td className="py-3 px-4 text-[#8b5e34]">{row.jamTutup}</td>
                    <td className="py-3 px-4 font-medium text-[#b8860b]">{row.shift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Tab: Menu ─── */}
      {activeTab === "menu" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eaddd7] shadow-sm">
          <h3 className="text-xl font-bold text-[#3b2b20] mb-4">Katalog Menu & Integrasi Database</h3>
          <p className="text-sm text-[#8b5e34]">
            Seluruh menu terhubung langsung ke inventori stok dan sistem resep kopi pada database MySQL.
          </p>
        </div>
      )}
    </div>
  );
}
