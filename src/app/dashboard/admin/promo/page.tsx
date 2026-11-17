"use client";

import React, { useState, useEffect } from "react";

interface PromoItem {
  id: string;
  name: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export default function KelolaPromoPage() {
  const [promotions, setPromotions] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "PERCENTAGE",
    value: 15,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    active: true,
  });

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/promotions");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setPromotions(json.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Nama promo wajib diisi!");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFeedback("Promo berhasil diterbitkan!");
        fetchPromos();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(json.error || "Gagal membuat promo.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePromo = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      });
      if (res.ok) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-gray-50/50 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Kelola Promo</h1>
            <p className="mt-1 text-sm text-gray-600">Buat diskon menarik dan atur periode promosi aktif.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>+</span> Buat Promo Baru
          </button>
        </header>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
            {feedback}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <th className="p-4 font-semibold">Nama Promo</th>
                  <th className="p-4 font-semibold">Tipe</th>
                  <th className="p-4 font-semibold">Nilai (Diskon)</th>
                  <th className="p-4 font-semibold">Masa Berlaku</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Memuat daftar promosi...
                    </td>
                  </tr>
                ) : promotions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Belum ada data promo. Klik &ldquo;Buat Promo Baru&rdquo; untuk menambahkan diskon.
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => (
                    <tr key={promo.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">{promo.name}</td>
                      <td className="p-4 text-gray-500">{promo.type}</td>
                      <td className="p-4 font-bold text-red-600">
                        {promo.type === "PERCENTAGE"
                          ? `${promo.value}%`
                          : `Rp ${Number(promo.value).toLocaleString("id-ID")}`}
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(promo.startDate).toLocaleDateString("id-ID")} -{" "}
                        {new Date(promo.endDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            promo.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {promo.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => togglePromo(promo.id, promo.active)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            promo.active
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {promo.active ? "Matikan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Buat Promo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Buat Promo Diskon Baru</h2>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Nama Promo / Kupon
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon Nugas Akhir Bulan"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Tipe Diskon
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Nilai Diskon
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Berakhir Pada
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
