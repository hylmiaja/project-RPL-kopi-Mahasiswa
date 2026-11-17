"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const DEFAULT_MENU = [
  { id: "1", name: "Espresso Classic",    price: 25000, emoji: "☕", cat: "Espresso",    desc: "Kuat & autentik" },
  { id: "2", name: "Vanilla Latte",       price: 35000, emoji: "🥛", cat: "Latte",       desc: "Lembut & manis"  },
  { id: "3", name: "Cold Brew Original",  price: 30000, emoji: "🧊", cat: "Cold Brew",   desc: "Segar & dingin"  },
  { id: "4", name: "Caramel Frappuccino", price: 42000, emoji: "🍮", cat: "Frappuccino", desc: "Karamel & creamy"},
  { id: "5", name: "Matcha Latte",        price: 38000, emoji: "🍵", cat: "Non-Coffee",  desc: "Matcha premium"  },
  { id: "6", name: "Americano",           price: 28000, emoji: "💧", cat: "Espresso",    desc: "Bold & clean"    },
];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  qty: number;
}

interface Receipt {
  orderCode: string;
  items: CartItem[];
  total: number;
  kasir: string;
  time: string;
}

export default function KasirDashboardPage() {
  const { data: session, status } = useSession();
  const [menuItems, setMenuItems] = useState<any[]>(DEFAULT_MENU);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    selesai: 0,
    pending: 0,
    proses: 0,
    dibatalkan: 0,
    totalRevenue: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [activeTab, setActiveTab] = useState<"pos" | "orders" | "laporan">("pos");
  const [catFilter, setCatFilter] = useState("Semua");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");

  // Fetch menu and orders from live database
  const fetchData = async () => {
    try {
      setLoadingOrders(true);
      const [resOrders, resProducts] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
      ]);

      if (resOrders.ok) {
        const json = await resOrders.json();
        if (json.success && json.data) {
          setOrders(json.data);
          if (json.stats) setStats(json.stats);
        }
      }

      if (resProducts.ok) {
        const jsonProd = await resProducts.json();
        if (jsonProd.success && jsonProd.data && jsonProd.data.length > 0) {
          const mapped = jsonProd.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            emoji: p.category?.name?.toLowerCase().includes("non") ? "🍵" : p.name.toLowerCase().includes("cold") ? "🧊" : "☕",
            cat: p.category?.name || "Kopi",
            desc: p.description || "Menu Spesial",
          }));
          setMenuItems(mapped);
        }
      }
    } catch (err) {
      console.error("Error fetching data in Kasir:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (session?.user?.role !== "KASIR") {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return null;
  }

  const addToCart = (item: any) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id === id);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c));
    });
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || "Pelanggan Walk-in",
          paymentMethod,
          items: cart.map((c) => ({
            id: c.id,
            name: c.name,
            qty: c.qty,
            price: c.price,
          })),
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        const createdOrder = resJson.order;
        const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        setReceipt({
          orderCode: createdOrder?.code || "ORD-NEW",
          items: [...cart],
          total: cartTotal,
          kasir: session.user.name || "Kasir",
          time: now,
        });
        setCart([]);
        setCustomerName("");
        // Refresh live orders from DB
        fetchData();
      } else {
        alert(resJson.error || "Gagal membuat pesanan ke database");
      }
    } catch (err) {
      console.error("Gagal simpan order:", err);
      alert("Terjadi kesalahan saat memproses pesanan ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const printReceipt = () => window.print();

  const cats = ["Semua", ...Array.from(new Set(menuItems.map((m) => m.cat)))];
  const filteredMenu = catFilter === "Semua" ? menuItems : menuItems.filter((m) => m.cat === catFilter);

  // Grouping for Laporan Penjualan (Live Chart)
  const chartDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const orderCountByDay: Record<string, number> = { Min: 0, Sen: 0, Sel: 0, Rab: 0, Kam: 0, Jum: 0, Sab: 0 };
  orders.forEach((o) => {
    if (o.createdAt) {
      const d = new Date(o.createdAt);
      const dayName = chartDays[d.getDay()];
      orderCountByDay[dayName] = (orderCountByDay[dayName] || 0) + 1;
    }
  });
  const chartData = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => ({
    day: d,
    orders: orderCountByDay[d] || (d === "Sen" ? orders.length : 0),
  }));
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-700 via-amber-700 to-yellow-600 rounded-2xl p-6 shadow-lg">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">💰</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Kasir POS</h1>
              <p className="text-amber-100/80 text-sm mt-0.5">
                Selamat datang, <span className="font-semibold text-white">{session.user.name}</span>! Data live & tersinkronisasi ke MySQL Laragon.
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loadingOrders}
            className="self-start sm:self-auto px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
          >
            🔄 {loadingOrders ? "Menyinkron..." : "Sinkronkan Database"}
          </button>
        </div>
      </div>

      {/* ─── Stats Sinkron Database ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pesanan Masuk (DB)", value: String(stats.total), icon: "🧾", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", sub: "Total Database" },
          { label: "Selesai",            value: String(stats.selesai), icon: "✅", bg: "bg-green-50", text: "text-green-800", border: "border-green-200", sub: "Berhasil" },
          { label: "Pending",            value: String(stats.pending), icon: "⏳", bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200", sub: "Menunggu" },
          { label: "Total Transaksi",    value: fmt(stats.totalRevenue), icon: "💵", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", sub: "Tercatat di DB" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/60 ${stat.text}`}>{stat.sub}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className={`text-xs font-medium ${stat.text} opacity-70 mt-1`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-2 border-b border-amber-100">
        {(["pos", "orders", "laporan"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === tab ? "border-amber-600 text-amber-800 bg-amber-50" : "border-transparent text-amber-500 hover:text-amber-700"
            }`}
          >
            {tab === "pos" ? "🛒 Point of Sale" : tab === "orders" ? `📋 Pesanan (${orders.length})` : "📈 Laporan"}
          </button>
        ))}
      </div>

      {/* ─── Tab POS ─── */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Grid */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    catFilter === c ? "bg-amber-800 text-white" : "bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenu.map((item) => {
                const inCart = cart.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 overflow-hidden cursor-pointer group transition-all hover:shadow-md ${
                      inCart ? "border-amber-500 shadow-md" : "border-amber-100 hover:border-amber-300"
                    }`}
                    onClick={() => addToCart(item)}
                  >
                    <div className={`p-4 text-center transition-colors ${inCart ? "bg-amber-100" : "bg-amber-50 group-hover:bg-amber-100"}`}>
                      <span className="text-4xl">{item.emoji}</span>
                      {inCart && (
                        <div className="mt-1">
                          <span className="inline-block bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{inCart.qty}x</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <p className="font-bold text-amber-900 text-xs leading-tight">{item.name}</p>
                      <p className="text-[10px] text-amber-400 mt-0.5">{item.desc}</p>
                      <p className="font-bold text-amber-700 mt-1.5 text-sm">{fmt(item.price)}</p>
                      <button
                        className={`w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          inCart ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {inCart ? `+${inCart.qty} ditambah` : "+ Pesan"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart / Order Summary */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm flex flex-col h-fit sticky top-4">
            <div className="p-5 border-b border-amber-100">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                🧾 Pesanan POS
                {cartCount > 0 && <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
              </h3>
            </div>
            <div className="p-4 flex-1 min-h-32">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-amber-400">
                  <span className="text-3xl block mb-2">🛒</span>
                  <p className="text-sm">Belum ada item dipilih</p>
                  <p className="text-xs mt-1">Klik menu untuk menambah pesanan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-amber-50">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-amber-900 leading-tight">{item.name}</p>
                            <p className="text-[10px] text-amber-500">{fmt(item.price)} × {item.qty}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-300 transition-colors flex items-center justify-center">-</button>
                          <span className="text-xs font-bold text-amber-800 w-4 text-center">{item.qty}</span>
                          <button onClick={() => addToCart(item)} className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors flex items-center justify-center">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer and Payment Inputs */}
                  <div className="pt-2 border-t border-amber-100 space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-amber-800 block mb-1">Nama Pelanggan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-800 block mb-1">Metode Pembayaran</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("CASH")}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            paymentMethod === "CASH" ? "bg-amber-800 text-white border-amber-800" : "bg-white text-amber-800 border-amber-200"
                          }`}
                        >
                          💵 Tunai (Cash)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("QRIS")}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            paymentMethod === "QRIS" ? "bg-amber-800 text-white border-amber-800" : "bg-white text-amber-800 border-amber-200"
                          }`}
                        >
                          📱 QRIS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-amber-100 space-y-3">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>Total</span>
                  <span>{fmt(cartTotal)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-800 text-white font-bold text-sm hover:bg-amber-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "⏳ Menyimpan ke DB..." : "🧾 Buat Pesanan & Simpan ke DB"}
                </button>
                <button
                  onClick={() => setCart([])}
                  className="w-full py-2 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab Orders (Data Live dari Database MySQL) ─── */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-amber-900">📋 Pesanan Live Database</h2>
              <p className="text-xs text-amber-500 mt-0.5">Semua pesanan sinkron dengan Chatbot, Admin, Owner, & Pelanggan</p>
            </div>
            <button
              onClick={fetchData}
              className="text-xs px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50">
                  <th className="text-left py-3 px-6 text-amber-700 font-semibold">Kode Order</th>
                  <th className="text-left py-3 px-6 text-amber-700 font-semibold">Pelanggan</th>
                  <th className="text-left py-3 px-6 text-amber-700 font-semibold">Item</th>
                  <th className="text-left py-3 px-6 text-amber-700 font-semibold">Total</th>
                  <th className="text-left py-3 px-6 text-amber-700 font-semibold">Status</th>
                  <th className="text-left py-3 px-6 text-amber-700 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Belum ada data pesanan di database.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const itemsSummary = o.items?.map((it: any) => `${it.quantity}x ${it.product?.name || 'Item'}`).join(", ") || "-";
                    const isSelesai = ["SELESAI", "COMPLETED", "PAID"].includes(o.status);
                    return (
                      <tr key={o.id || o.code} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-amber-800">{o.code}</td>
                        <td className="py-3.5 px-6 font-medium text-amber-900">{o.user?.name || "Pelanggan Walk-in"}</td>
                        <td className="py-3.5 px-6 text-amber-600 text-xs max-w-44 truncate">{itemsSummary}</td>
                        <td className="py-3.5 px-6 font-semibold text-amber-800">{fmt(o.totalAmount)}</td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isSelesai
                                ? "bg-green-100 text-green-700"
                                : o.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => {
                              setReceipt({
                                orderCode: o.code,
                                items: (o.items || []).map((it: any) => ({
                                  id: it.id,
                                  name: it.product?.name || "Item",
                                  price: it.unitPrice,
                                  emoji: "☕",
                                  qty: it.quantity,
                                })),
                                total: o.totalAmount,
                                kasir: o.kasir?.name || session.user.name || "Kasir",
                                time: new Date(o.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                              });
                            }}
                            className="px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                          >
                            🖨️ Cetak
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
      )}

      {/* ─── Tab Laporan ─── */}
      {activeTab === "laporan" && (
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-amber-900">📈 Laporan Penjualan (Live DB)</h2>
              <p className="text-xs text-amber-500 mt-0.5">Pesanan per hari terkoneksi dengan database MySQL Laragon</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-amber-800">{orders.length}</p>
              <p className="text-xs text-amber-500">Total pesanan di DB</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {chartData.map((d, i) => {
              const pct = (d.orders / maxOrders) * 100;
              const isToday = i === chartData.length - 1;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                    {d.orders} pesanan
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all ${isToday ? "bg-amber-500" : "bg-amber-200 group-hover:bg-amber-400"}`}
                    style={{ height: `${Math.max(pct, 10)}%`, minHeight: "8px" }}
                  />
                  <span className={`text-[10px] font-medium ${isToday ? "text-amber-700" : "text-amber-400"}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Struk Digital Modal ─── */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" id="receipt-print">
            <div className="bg-amber-800 rounded-t-2xl p-5 text-center text-white">
              <p className="text-lg font-bold">☕ Kopi Mahasiswa</p>
              <p className="text-amber-200 text-xs mt-1">Jl. Kopi No. 1, Bandung</p>
              <p className="text-amber-200 text-xs">Telp: 08123456789</p>
            </div>
            <div className="p-5">
              <div className="border-b border-dashed border-amber-200 pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-600">No. Order</span>
                  <span className="font-bold text-amber-900 font-mono">{receipt.orderCode}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-amber-600">Kasir</span>
                  <span className="font-medium text-amber-800">{receipt.kasir}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-amber-600">Waktu</span>
                  <span className="font-medium text-amber-800">{receipt.time}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Detail Pesanan</p>
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-amber-800">{item.emoji} {item.name} <span className="text-amber-400">×{item.qty}</span></span>
                    <span className="font-semibold text-amber-800">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-amber-200 pt-4">
                <div className="flex justify-between font-bold text-lg text-amber-900">
                  <span>TOTAL</span>
                  <span>{fmt(receipt.total)}</span>
                </div>
                <p className="text-center text-xs text-amber-400 mt-3">— Terima kasih telah berkunjung! —</p>
                <p className="text-center text-xs text-amber-400">Semoga harimu menyenangkan ☕</p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setReceipt(null)} className="flex-1 py-2.5 rounded-xl border border-amber-200 text-sm text-amber-700 font-semibold hover:bg-amber-50 transition-colors">Tutup</button>
              <button onClick={printReceipt} className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-bold hover:bg-amber-900 transition-colors flex items-center justify-center gap-2">
                🖨️ Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
