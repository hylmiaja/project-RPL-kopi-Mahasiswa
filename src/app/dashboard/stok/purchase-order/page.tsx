"use client";

import React, { useState, useEffect } from "react";

interface POItem {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  supplier?: { name: string } | null;
  items?: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    ingredient?: { name: string; unit: string } | null;
  }>;
}

export default function PurchaseOrderPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<POItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<POItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    supplierId: "",
    ingredientId: "",
    quantity: 10,
    unitCost: 50000,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPO, resSuppliers] = await Promise.all([
        fetch("/api/purchase-orders"),
        fetch("/api/suppliers"),
      ]);

      if (resPO.ok) {
        const jsonPO = await resPO.json();
        if (jsonPO.success) setPurchaseOrders(jsonPO.data || []);
      }

      if (resSuppliers.ok) {
        const jsonSupp = await resSuppliers.json();
        if (jsonSupp.success) {
          setSuppliers(jsonSupp.data || []);
          setIngredients(jsonSupp.ingredients || []);
          if (jsonSupp.data?.length > 0 && !formData.supplierId) {
            setFormData((prev) => ({
              ...prev,
              supplierId: jsonSupp.data[0].id,
              ingredientId: jsonSupp.ingredients?.[0]?.id || "",
              unitCost: jsonSupp.ingredients?.[0]?.costPerUnit || 50000,
            }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIngredientChange = (ingId: string) => {
    const found = ingredients.find((i) => i.id === ingId);
    setFormData((prev) => ({
      ...prev,
      ingredientId: ingId,
      unitCost: found?.costPerUnit || prev.unitCost,
    }));
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.ingredientId) {
      alert("Harap pilih supplier dan bahan baku!");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: formData.supplierId,
          items: [
            {
              ingredientId: formData.ingredientId,
              quantity: Number(formData.quantity) || 1,
              unitCost: Number(formData.unitCost) || 0,
            },
          ],
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFeedback("Purchase Order berhasil diterbitkan!");
        fetchData();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        alert(json.error || "Gagal menerbitkan Purchase Order.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-gray-50/50 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Purchase Order</h1>
            <p className="mt-1 text-sm text-gray-600">Kelola dan terbitkan pengadaan bahan baku ke supplier.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>+</span> Buat PO Baru
          </button>
        </header>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <th className="p-4 font-semibold">Kode PO</th>
                  <th className="p-4 font-semibold">Supplier</th>
                  <th className="p-4 font-semibold">Tanggal Dibuat</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Total Item</th>
                  <th className="p-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Memuat data Purchase Order...
                    </td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Belum ada data Purchase Order. Klik &ldquo;Buat PO Baru&rdquo; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">{po.code}</td>
                      <td className="p-4 text-gray-700">{po.supplier?.name || "Supplier Umum"}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(po.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            po.status === "SENT"
                              ? "bg-blue-100 text-blue-700"
                              : po.status === "RECEIVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{po.items?.length || 0} item</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedPO(po)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-xs transition-colors"
                        >
                          Lihat Detail
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

      {/* Modal Buat PO Baru */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Terbitkan Purchase Order Baru</h2>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Pilih Supplier
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData((p) => ({ ...p, supplierId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contactInfo ? `(${s.contactInfo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Bahan Baku yang Dipesan
                </label>
                <select
                  value={formData.ingredientId}
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  required
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit}) — Estimasi Rp {Number(ing.costPerUnit || 0).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Jumlah Kuantitas
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, quantity: parseFloat(e.target.value) || 1 }))
                    }
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                    Biaya Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                <span className="text-slate-500">Estimasi Total Biaya PO:</span>
                <span className="font-bold text-slate-900">
                  Rp {(formData.quantity * formData.unitCost).toLocaleString("id-ID")}
                </span>
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
                  {submitting ? "Menerbitkan..." : "Terbitkan PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail PO */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPO.code}</h3>
                <p className="text-xs text-slate-500">Supplier: {selectedPO.supplier?.name || "-"}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                {selectedPO.status}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase">Daftar Bahan:</h4>
              {selectedPO.items && selectedPO.items.length > 0 ? (
                selectedPO.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                    <span>
                      {it.ingredient?.name || "Bahan Baku"} ({it.quantity} {it.ingredient?.unit || "unit"})
                    </span>
                    <span className="font-semibold text-slate-900">
                      Rp {Number(it.totalCost || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Tidak ada rincian item.</p>
              )}
            </div>

            <button
              onClick={() => setSelectedPO(null)}
              className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
