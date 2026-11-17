"use client";

import { useState } from "react";

const MENU_ITEMS = [
  { id: 1, name: "Espresso Classic",    price: 25000, emoji: "☕", cat: "Espresso",    desc: "Kuat & autentik" },
  { id: 2, name: "Vanilla Latte",       price: 35000, emoji: "🥛", cat: "Latte",       desc: "Lembut & manis"  },
  { id: 3, name: "Cold Brew Original",  price: 30000, emoji: "🧊", cat: "Cold Brew",   desc: "Segar & dingin"  },
  { id: 4, name: "Caramel Frappuccino", price: 42000, emoji: "🍮", cat: "Frappuccino", desc: "Karamel & creamy" },
  { id: 5, name: "Matcha Latte",        price: 38000, emoji: "🍵", cat: "Non-Coffee",  desc: "Matcha premium"  },
  { id: 6, name: "Americano",           price: 28000, emoji: "💧", cat: "Espresso",    desc: "Bold & clean"    },
  { id: 7, name: "Mocha Latte",         price: 37000, emoji: "🍫", cat: "Latte",       desc: "Coklat & espresso"},
  { id: 8, name: "Kopi Aren",           price: 32000, emoji: "🍯", cat: "Latte",       desc: "Gula aren premium"},
];

const CATS = ["Semua", "Espresso", "Latte", "Cold Brew", "Frappuccino", "Non-Coffee"];

type CartItem = { id: number; name: string; price: number; emoji: string; qty: number; note: string };

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default function KasirPOSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState("Semua");
  const [search, setSearch] = useState("");
  const [payMethod, setPayMethod] = useState<"CASH" | "QRIS" | "DEBIT">("CASH");
  const [cashInput, setCashInput] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("ORD-" + Math.floor(Math.random() * 9000 + 1000));
  const [customerPhone, setCustomerPhone] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waSendResult, setWaSendResult] = useState<{
    success: boolean;
    message: string;
    mode?: string;
    directUrl?: string;
  } | null>(null);

  const sendWhatsAppReceipt = async (phoneToUse?: string) => {
    const targetPhone = phoneToUse || customerPhone;
    if (!targetPhone) return;

    setWaSending(true);
    try {
      const res = await fetch("/api/checkout-and-send-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: targetPhone,
          orderId: orderCode,
          totalAmount: total,
          orderType: `Kasir POS (${payMethod})`,
          items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
          customerName: "Pelanggan Kasir",
        }),
      });

      const data = await res.json();
      setWaSendResult(data);
    } catch (err: any) {
      console.error("Gagal auto send WA Kasir:", err);
      setWaSendResult({ success: false, message: "Koneksi gateway WA gagal." });
    } finally {
      setWaSending(false);
    }
  };

  const filtered = MENU_ITEMS.filter(m =>
    (activeCat === "Semua" || m.cat === activeCat) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, note: "" }];
    });
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.id !== id));
  const changeQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const kembalian = parseInt(cashInput.replace(/\D/g, "") || "0") - total;
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const processPayment = () => {
    setShowPayment(false);
    setShowSuccess(true);

    const orderPayload = {
      orderCode,
      items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
      total,
      orderType: "Walk-in (Kasir POS)",
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("kopi_latest_order", JSON.stringify(orderPayload));
      window.dispatchEvent(new CustomEvent("kopi:order_placed", { detail: orderPayload }));
      
      fetch("/api/notifications/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHATSAPP",
          recipientRole: "KASIR",
          orderCode,
          title: `Pesanan Kasir POS #${orderCode}`,
          content: `Pesanan #${orderCode} berhasil diproses kasir senilai ${fmt(total)}.`,
        }),
      }).catch(() => {});
    } catch (e) {
      console.warn("Notification error:", e);
    }

    if (customerPhone) {
      sendWhatsAppReceipt(customerPhone);
    }
  };

  return (
    <div className="flex gap-0 -m-6 lg:-m-8 min-h-screen">
      {/* Menu Area */}
      <div className="flex-1 p-6 overflow-auto bg-amber-50/30">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-amber-900">Point of Sale</h1>
          <p className="text-amber-700/60 text-sm mt-0.5">Pilih menu untuk ditambahkan ke pesanan.</p>
        </div>

        {/* Search & Cat Filter */}
        <input
          placeholder="Cari menu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-3 px-4 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex gap-2 flex-wrap mb-5">
          {CATS.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCat === cat ? "bg-amber-900 text-white shadow" : "bg-white border border-amber-200 text-amber-700 hover:border-amber-400"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(item => {
            const inCart = cart.find(c => c.id === item.id);
            return (
              <button key={item.id} onClick={() => addToCart(item)}
                className={`text-left bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all active:scale-95 group ${inCart ? "border-amber-400 ring-2 ring-amber-200" : "border-amber-100 hover:border-amber-300"}`}>
                <div className="text-4xl mb-3 text-center group-hover:scale-110 transition-transform">{item.emoji}</div>
                <p className="font-bold text-amber-900 text-sm leading-tight">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">{item.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-700 text-sm">{fmt(item.price)}</span>
                  {inCart && (
                    <span className="bg-amber-900 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {inCart.qty}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-80 xl:w-96 bg-white border-l border-amber-100 flex flex-col shadow-xl">
        <div className="p-5 border-b border-amber-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-amber-900 text-lg">Pesanan Baru</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{orderCode}</p>
            </div>
            {cartCount > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-amber-300 py-16">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-sm font-medium text-amber-700/50">Pilih menu untuk mulai</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-amber-50/50 rounded-2xl p-3 border border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="font-bold text-amber-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{fmt(item.price)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl overflow-hidden">
                    <button onClick={() => changeQty(item.id, -1)} className="px-3 py-1.5 text-amber-700 hover:bg-amber-50 font-bold text-lg">-</button>
                    <span className="px-3 font-bold text-amber-900 text-sm">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="px-3 py-1.5 text-amber-700 hover:bg-amber-50 font-bold text-lg">+</button>
                  </div>
                  <span className="font-extrabold text-amber-900 text-sm">{fmt(item.price * item.qty)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & Checkout */}
        <div className="p-5 border-t border-amber-100 bg-amber-50/30 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({cartCount} item)</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Pajak (10%)</span>
            <span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-amber-900 text-xl border-t border-amber-200 pt-3">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-amber-900 text-white font-bold rounded-2xl shadow-md hover:bg-amber-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg"
          >
            💳 Proses Pembayaran
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Proses Pembayaran</h2>

            {/* Method */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(["CASH", "QRIS", "DEBIT"] as const).map(m => (
                <button key={m} onClick={() => setPayMethod(m)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${payMethod === m ? "bg-amber-900 text-white shadow-md" : "border border-amber-200 text-amber-700 hover:border-amber-400"}`}>
                  {m === "CASH" ? "💵 Cash" : m === "QRIS" ? "📱 QRIS" : "💳 Debit"}
                </button>
              ))}
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 mb-5">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Pajak</span><span>{fmt(tax)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-amber-900 text-lg border-t border-amber-200 pt-2">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>

            {payMethod === "CASH" && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-amber-900 mb-2">Uang Diterima</label>
                <input
                  type="text"
                  value={cashInput}
                  onChange={e => setCashInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan jumlah uang..."
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-lg font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {parseInt(cashInput || "0") >= total && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-700">Kembalian</span>
                    <span className="font-extrabold text-green-700 text-lg">{fmt(kembalian)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Input Nomor WhatsApp Pelanggan */}
            <div className="mb-4 bg-green-50/70 border border-green-200/80 rounded-2xl p-3 text-left">
              <label className="block text-xs font-bold text-green-900 mb-1">
                📲 Nomor WhatsApp Pelanggan (Struk Otomatis)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="08123456789 (opsional)"
                className="w-full border border-green-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              />
              <p className="text-[10px] text-green-700/80 mt-1">Jika diisi, struk otomatis dikirim langsung ke WhatsApp ini saat bayar.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPayment(false)} className="flex-1 py-3 border border-amber-200 text-amber-800 rounded-2xl font-semibold hover:bg-amber-50 transition-colors">Batal</button>
              <button
                onClick={processPayment}
                disabled={payMethod === "CASH" && parseInt(cashInput || "0") < total}
                className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors disabled:opacity-40"
              >
                ✓ Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-300">
            <div className="text-6xl mb-3">✅</div>
            <h2 className="text-2xl font-bold text-green-700 mb-1">Pembayaran Berhasil!</h2>
            <p className="text-gray-500 mb-1">Kode: <strong className="font-mono text-amber-900">{orderCode}</strong></p>
            <p className="text-gray-500 mb-4">Total: <strong className="text-amber-900">{fmt(total)}</strong> ({payMethod})</p>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-xs text-green-800 text-left space-y-1">
              <p className="font-bold flex items-center gap-1"><span>🔔</span> Notifikasi Terkirim ke Chatbot & Staf!</p>
              <p>Struk digital telah siap untuk diteruskan ke pelanggan atau admin.</p>
            </div>

            {/* Status & Kontrol Pengiriman WhatsApp Otomatis */}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 mb-4 text-left">
              {waSending ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2 font-bold animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim struk ke WhatsApp {customerPhone}...</span>
                </div>
              ) : waSendResult ? (
                <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                  waSendResult.mode === 'automatic_gateway'
                    ? 'bg-green-50 border border-green-300 text-green-800'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <span>✅</span>
                    <span>{waSendResult.mode === 'automatic_gateway' ? 'Terkirim Otomatis ke WhatsApp!' : 'Struk Berhasil Diproses!'}</span>
                  </div>
                  <p className="text-[11px] opacity-90">{waSendResult.message}</p>
                </div>
              ) : null}

              {/* Input Nomor & Tombol Kirim */}
              <div className="flex items-center gap-1.5">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08123456789"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  onClick={() => sendWhatsAppReceipt()}
                  disabled={waSending || !customerPhone}
                  className="whitespace-nowrap px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 shadow-sm"
                >
                  <span>📲</span> Kirim WA
                </button>
              </div>

              <a
                href={waSendResult?.directUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `*☕ STRUK PEMBAYARAN KASIR - KOPI MAHASISWA*\n🆔 Kode: #${orderCode}\n💰 Total: ${fmt(total)} (${payMethod})\n\nTerima kasih atas kunjungan Anda di Kopi Mahasiswa!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>🔗</span> Buka WhatsApp Web (Manual)
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `[STRUK KASIR] Kopi Mahasiswa #${orderCode}`
                )}&body=${encodeURIComponent(
                  `*☕ STRUK PEMBAYARAN KASIR - KOPI MAHASISWA*\n🆔 Kode: #${orderCode}\n💰 Total: ${fmt(total)} (${payMethod})\n\nTerima kasih atas kunjungan Anda di Kopi Mahasiswa!`
                )}`}
                className="w-full py-2 px-3 bg-blue-600 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>📧</span> Kirim via Email
              </a>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setCart([]);
                  setCashInput("");
                }}
                className="w-full py-2.5 bg-amber-900 text-white rounded-xl font-bold text-sm hover:bg-amber-800 transition-colors"
              >
                Pesanan Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
