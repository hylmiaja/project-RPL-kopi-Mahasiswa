"use client";

import { useState, useEffect } from "react";

const STATUS_COLOR: Record<string, string> = {
  SELESAI: "bg-green-100 text-green-700",
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PROSES: "bg-blue-100 text-blue-700",
  PROCESS: "bg-blue-100 text-blue-700",
  DIBATALKAN: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    selesai: 0,
    pending: 0,
    proses: 0,
    dibatalkan: 0,
    totalRevenue: 0,
  });
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOrders(json.data || []);
          if (json.stats) setStats(json.stats);
        }
      }
    } catch (err) {
      console.error("Gagal load pesanan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(true);
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        await fetchOrders();
        setDetailOrder(null);
      } else {
        alert("Gagal memperbarui status di database");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (filterStatus === "SEMUA") return true;
    if (filterStatus === "SELESAI") return ["SELESAI", "COMPLETED"].includes(o.status);
    if (filterStatus === "PENDING") return o.status === "PENDING";
    if (filterStatus === "PROSES") return ["PROSES", "PROCESS"].includes(o.status);
    if (filterStatus === "DIBATALKAN") return ["DIBATALKAN", "CANCELLED"].includes(o.status);
    return o.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Kelola Pesanan</h1>
          <p className="mt-1 text-amber-700/60">Tersinkronisasi langsung dengan MySQL Laragon & AI Chatbot.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2.5 bg-amber-900 text-white font-semibold rounded-xl text-xs hover:bg-amber-800 transition-colors shadow-sm flex items-center gap-2"
        >
          🔄 {loading ? "Menyinkron..." : "Segarkan Data"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Pesanan</p>
          <p className="text-3xl font-bold text-amber-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pendapatan Selesai</p>
          <p className="text-2xl font-bold text-green-700 mt-1">Rp {stats.totalRevenue.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Menunggu (Pending)</p>
          <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Dibatalkan</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{stats.dibatalkan}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["SEMUA", "PENDING", "PROSES", "SELESAI", "DIBATALKAN"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterStatus === s
                ? "bg-amber-900 text-white shadow-md"
                : "bg-white border border-amber-200 text-amber-700 hover:border-amber-400"
            }`}
          >
            {s === "SEMUA" ? "Semua Pesanan" : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Kode Pesanan</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Pembayaran</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada pesanan ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const itemsStr =
                    order.items?.map((i: any) => `${i.quantity}x ${i.product?.name || "Item"}`).join(", ") || "-";
                  const paymentMethod = order.payment?.method || "CASH";

                  return (
                    <tr key={order.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-amber-900 font-mono">{order.code}</td>
                      <td className="px-6 py-4 text-gray-700">{order.user?.name || "Pelanggan Walk-in"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{itemsStr}</td>
                      <td className="px-6 py-4 font-bold text-amber-900">Rp {order.totalAmount.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                        >
                          Kelola Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kelola Status */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-amber-900">Kelola Status Pesanan</h2>
              <p className="text-xs text-amber-700/60 mt-1">Kode: <span className="font-mono font-bold text-amber-900">{detailOrder.code}</span></p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl space-y-2 text-sm text-amber-950">
              <p><strong>Pelanggan:</strong> {detailOrder.user?.name || "Pelanggan Walk-in"}</p>
              <p><strong>Total:</strong> Rp {detailOrder.totalAmount.toLocaleString("id-ID")}</p>
              <p><strong>Status Saat Ini:</strong> <span className="font-bold">{detailOrder.status}</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-2">Ubah Status Menjadi:</label>
              <div className="grid grid-cols-2 gap-2">
                {["PENDING", "PROSES", "SELESAI", "DIBATALKAN"].map((s) => (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => updateStatus(detailOrder.id, s)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      detailOrder.status === s
                        ? "bg-amber-900 text-white border-amber-900"
                        : "bg-white text-amber-800 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setDetailOrder(null)}
                className="w-full py-2.5 border border-amber-200 text-amber-800 rounded-xl font-semibold text-sm hover:bg-amber-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
