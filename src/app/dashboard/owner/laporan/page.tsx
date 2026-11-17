"use client";

import { useState, useEffect } from "react";

export default function OwnerLaporanPage() {
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [currentInsight, setCurrentInsight] = useState(0);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/ai/analytics");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAnalytics(json.data);
      }
    } catch (err) {
      console.error("Gagal load analytics:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalPendapatan = analytics?.totalRevenue || 0;
  const totalPesanan = analytics?.totalOrders || 0;
  const avgPerOrder = totalPesanan > 0 ? Math.round(totalPendapatan / totalPesanan) : 0;
  const topMenu = analytics?.topMenu || [];
  const insights = analytics?.insights || [
    "Sistem tersinkronisasi langsung dengan MySQL Laragon.",
    "Data transaksi dan pesanan dapat ditanyakan langsung pada AI Chatbot.",
  ];

  const requestAI = () => {
    setAiLoading(true);
    setShowAI(false);
    fetchAnalytics().then(() => {
      setTimeout(() => {
        setAiLoading(false);
        setShowAI(true);
      }, 1000);
    });
  };

  useEffect(() => {
    if (!showAI || insights.length === 0) return;
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showAI, insights.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Laporan & AI Analytics (Live DB)</h1>
          <p className="mt-1 text-amber-700/60">Dashboard omzet, laba, dan insight bisnis terhubung 100% ke database Laragon.</p>
        </div>
        <button
          onClick={requestAI}
          disabled={aiLoading}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-70"
        >
          {aiLoading ? (
            <><span className="animate-spin">⏳</span> Menganalisis Database...</>
          ) : (
            <><span>🧠</span> Minta Insight AI Terkini</>
          )}
        </button>
      </div>

      {/* AI Insight Panel */}
      {showAI && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-3xl p-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg">🤖</div>
            <div>
              <p className="font-bold text-indigo-900">Ringkasan AI Bisnis Terkoneksi Database</p>
              <p className="text-xs text-indigo-600">Dihitung otomatis dari tabel Order, Product, dan Ingredient</p>
            </div>
          </div>
          <div className="space-y-3">
            {insights.map((insight: string, i: number) => (
              <div
                key={i}
                className={`flex gap-3 p-4 rounded-2xl border transition-all duration-500 ${
                  i === currentInsight
                    ? "bg-white shadow-md border-indigo-200 scale-[1.01]"
                    : "bg-white/50 border-transparent"
                }`}
              >
                <span className="text-2xl">💡</span>
                <p className="text-sm leading-relaxed text-indigo-900 font-medium">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Total Omzet Database</p>
          <p className="text-3xl font-extrabold text-amber-900 mt-2">Rp {totalPendapatan.toLocaleString("id-ID")}</p>
          <p className="text-xs text-green-600 mt-2 font-medium">✓ Sinkron dengan Chatbot & Kasir</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Total Pesanan Tercatat</p>
          <p className="text-3xl font-extrabold text-amber-900 mt-2">{totalPesanan} Pesanan</p>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            {analytics?.completedOrders || 0} Selesai • {analytics?.pendingOrders || 0} Pending
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Rata-rata Transaksi</p>
          <p className="text-3xl font-extrabold text-amber-900 mt-2">Rp {avgPerOrder.toLocaleString("id-ID")}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">Nilai per keranjang belanja</p>
        </div>
      </div>

      {/* Top Menu Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-sm">
        <h2 className="text-xl font-bold text-amber-900 mb-6">Menu Terlaris (Real Database)</h2>
        <div className="space-y-4">
          {topMenu.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada transaksi menu.</p>
          ) : (
            topMenu.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 hover:bg-amber-50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-amber-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.qty} porsi terjual</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-900">Rp {item.revenue.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-green-700 font-medium">Total Terjual</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
