"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  SELESAI: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESS: "bg-blue-100 text-blue-700",
  PROSES: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
  DIBATALKAN: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "✅ Selesai",
  SELESAI: "✅ Selesai",
  PENDING: "⏳ Menunggu",
  PROCESS: "🔄 Diproses",
  PROSES: "🔄 Diproses",
  CANCELLED: "❌ Dibatalkan",
  DIBATALKAN: "❌ Dibatalkan",
};

export default function PelangganPesananPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  const [reviewOrder, setReviewOrder] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all orders or orders belonging to this user
      const url = session?.user?.id ? `/api/orders?userId=${session.user.id}` : "/api/orders";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOrders(json.data || []);
        }
      }
    } catch (err) {
      console.error("Gagal load pesanan pelanggan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [session?.user?.id]);

  const filtered = orders.filter((o) => {
    if (filterStatus === "SEMUA") return true;
    if (filterStatus === "COMPLETED") return ["SELESAI", "COMPLETED"].includes(o.status);
    if (filterStatus === "PENDING") return o.status === "PENDING";
    if (filterStatus === "CANCELLED") return ["DIBATALKAN", "CANCELLED"].includes(o.status);
    return o.status === filterStatus;
  });

  const submitReview = (id: string) => {
    alert("Terima kasih atas ulasan dan rating yang Anda berikan!");
    setReviewOrder(null);
    setRating(5);
    setComment("");
  };

  const countSelesai = orders.filter((o) => ["SELESAI", "COMPLETED"].includes(o.status)).length;
  const countPending = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Riwayat & Lacak Pesanan</h1>
          <p className="mt-1 text-amber-700/60">Data tersinkronisasi langsung dengan MySQL Laragon & AI Chatbot.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto px-4 py-2 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          🔄 {loading ? "Menyinkron..." : "Sinkronkan Pesanan"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-900">{orders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Pesanan</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-700">{countSelesai}</p>
          <p className="text-xs text-gray-500 mt-1">Selesai</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-700">{countPending}</p>
          <p className="text-xs text-gray-500 mt-1">Menunggu</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["SEMUA", "PENDING", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterStatus === s
                ? "bg-amber-900 text-white shadow-md"
                : "bg-white border border-amber-200 text-amber-700 hover:border-amber-400"
            }`}
          >
            {s === "SEMUA" ? "Semua" : STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-amber-100 text-center text-gray-500">
            {loading ? "Memuat pesanan..." : "Belum ada pesanan dalam status ini."}
          </div>
        ) : (
          filtered.map((order) => {
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("id-ID") : "-";
            const timeStr = order.createdAt ? new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
            const items = order.items || [];
            const isCompleted = ["SELESAI", "COMPLETED"].includes(order.status);

            return (
              <div
                key={order.id || order.code}
                className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-amber-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-extrabold text-amber-900 font-mono text-lg">{order.code}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {dateStr} • {timeStr} • Pembayaran: {order.payment?.method || "CASH"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="px-6 py-4 space-y-3">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">☕</span>
                        <div>
                          <p className="font-bold text-amber-900">{item.product?.name || "Item Menu"}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × Rp {item.unitPrice.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-amber-900">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-amber-50/50 border-t border-amber-50 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500">Total Pembayaran</span>
                    <p className="text-lg font-bold text-amber-900">
                      Rp {order.totalAmount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isCompleted && (
                      <button
                        onClick={() => setReviewOrder(order.id)}
                        className="px-4 py-2 bg-amber-900 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition-colors"
                      >
                        ⭐ Beri Ulasan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-amber-900">Beri Ulasan Pesanan</h3>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Beri Bintang</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className={`text-2xl ${s <= rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Komentar / Pengalaman</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Rasa kopinya nikmat, suasana sangat ramah mahasiswa..."
                className="w-full border border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setReviewOrder(null)}
                className="flex-1 py-2.5 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold hover:bg-amber-50"
              >
                Batal
              </button>
              <button
                onClick={() => submitReview(reviewOrder)}
                className="flex-1 py-2.5 bg-amber-900 text-white rounded-xl text-xs font-bold hover:bg-amber-800"
              >
                Kirim Ulasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
