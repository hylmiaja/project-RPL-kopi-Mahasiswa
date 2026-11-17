"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type CartItem = { id: string; name: string; price: number; emoji: string; qty: number; note: string };

const DEMO_CART: CartItem[] = [
  { id: "2", name: "Vanilla Latte",   price: 35000, emoji: "🥛", qty: 2, note: "" },
  { id: "5", name: "Matcha Latte",    price: 38000, emoji: "🍵", qty: 1, note: "Kurangi gula" },
  { id: "7", name: "Kopi Susu Aren",  price: 32000, emoji: "🍯", qty: 1, note: "" },
];

const PROMOS = [
  { code: "KOPI10", discount: 0.1, label: "Diskon 10%" },
  { code: "MAHASISWA15", discount: 0.15, label: "Diskon 15% Mahasiswa" },
];

export default function PelangganKeranjangPage() {
  const [cart, setCart] = useState<CartItem[]>(DEMO_CART);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<typeof PROMOS[0] | null>(null);
  const [promoError, setPromoError] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderCode] = useState("ORD-" + Math.floor(Math.random() * 9000 + 1000));
  const [customerPhone, setCustomerPhone] = useState("08123456789");
  const [waSending, setWaSending] = useState(false);
  const [waSendResult, setWaSendResult] = useState<{
    success: boolean;
    message: string;
    mode?: string;
    directUrl?: string;
  } | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.phone) {
      setCustomerPhone(session.user.phone);
    } else {
      const savedPhone = localStorage.getItem("kopi_customer_phone");
      if (savedPhone) setCustomerPhone(savedPhone);
    }
  }, [session]);

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };
  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const changeNote = (id: string, note: string) => setCart(prev => prev.map(c => c.id === id ? { ...c, note } : c));

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discount = appliedPromo ? Math.round(subtotal * appliedPromo.discount) : 0;
  const total = subtotal - discount;

  const applyPromo = () => {
    const found = PROMOS.find(p => p.code === promoCode.toUpperCase());
    if (found) { setAppliedPromo(found); setPromoError(""); }
    else setPromoError("Kode promo tidak valid atau sudah kedaluwarsa.");
  };

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
          orderType: orderType === "dine-in" ? "Makan di Tempat" : "Dibawa Pulang",
          items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
        }),
      });

      const data = await res.json();
      setWaSendResult(data);
    } catch (err: any) {
      console.error("Gagal auto send WA:", err);
      setWaSendResult({ success: false, message: "Koneksi ke gateway WA gagal." });
    } finally {
      setWaSending(false);
    }
  };

  const placeOrder = () => {
    setShowCheckout(false);
    setOrderSuccess(true);

    if (customerPhone) {
      try { localStorage.setItem("kopi_customer_phone", customerPhone); } catch {}
    }

    const orderPayload = {
      orderCode,
      items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
      total,
      orderType: orderType === "dine-in" ? "Makan di Tempat" : "Dibawa Pulang",
      createdAt: new Date().toISOString(),
      customerPhone,
    };

    try {
      localStorage.setItem("kopi_latest_order", JSON.stringify(orderPayload));
      window.dispatchEvent(new CustomEvent("kopi:order_placed", { detail: orderPayload }));
      
      // Kirim event notifikasi ke server
      fetch("/api/notifications/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WHATSAPP",
          recipientRole: "PELANGGAN",
          recipientContact: customerPhone,
          orderCode,
          title: `Pesanan Baru #${orderCode}`,
          content: `Pesanan #${orderCode} berhasil dibuat dengan total Rp ${total.toLocaleString("id-ID")}.`,
        }),
      }).catch(() => {});
    } catch (e) {
      console.warn("Notification dispatch error:", e);
    }

    // Picu pengiriman WhatsApp otomatis langsung ke nomor pelanggan di latar belakang
    sendWhatsAppReceipt(customerPhone);
  };

  if (orderSuccess) {
    const waReceiptText = `*☕ STRUK & NOTIFIKASI PESANAN KOPI MAHASISWA* 🧾\n🆔 Kode: #${orderCode}\n💰 Total: Rp ${total.toLocaleString("id-ID")}\n📦 Tipe: ${orderType === "dine-in" ? "Makan di Tempat" : "Dibawa Pulang"}\n\nTerima kasih telah memesan di Kopi Mahasiswa! Kopi siap disajikan! ☕✨`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waReceiptText)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(`[STRUK PESANAN] Kopi Mahasiswa #${orderCode}`)}&body=${encodeURIComponent(waReceiptText)}`;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 py-10">
        <div className="text-8xl animate-bounce">✅</div>
        <h1 className="text-3xl font-bold text-green-700">Pesanan Berhasil!</h1>
        <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-8 max-w-sm w-full space-y-3">
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Kode Pesanan</p>
            <p className="text-2xl font-extrabold font-mono text-amber-900 mt-1">{orderCode}</p>
          </div>
          <p className="text-sm text-gray-600">Total Pembayaran: <strong className="text-amber-900">Rp {total.toLocaleString("id-ID")}</strong></p>
          <p className="text-sm text-gray-600">Tipe: <strong>{orderType === "dine-in" ? "Makan di Tempat" : "Dibawa Pulang"}</strong></p>
          <p className="text-xs text-gray-400 mt-2">Estimasi waktu: 10–15 menit. Chatbot AI telah mencatat pesanan Anda!</p>

          {/* Status & Kontrol Pengiriman WhatsApp Otomatis */}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5 text-left">
            <label className="text-[11px] font-bold text-gray-700">📱 Status Struk WhatsApp:</label>
            
            {waSending ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2 font-bold animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>Mengirim otomatis ke WhatsApp {customerPhone}...</span>
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
                <p className="text-[11px] opacity-90 leading-relaxed">{waSendResult.message}</p>
              </div>
            ) : null}

            {/* Input Ubah/Kirim Nomor WhatsApp */}
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
                disabled={waSending}
                className="whitespace-nowrap px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 shadow-sm"
              >
                <span>📲</span> Kirim Ulang
              </button>
            </div>

            {/* Tombol Cadangan Buka WhatsApp Web Langsung */}
            <a
              href={waSendResult?.directUrl || waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>🔗</span> Buka di WhatsApp Web (Manual)
            </a>

            <a
              href={emailUrl}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>📧</span> Kirim Bukti ke Email
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <a href="/dashboard/pelanggan/pesanan" className="px-6 py-3 border border-amber-200 text-amber-800 rounded-2xl font-semibold hover:bg-amber-50 transition-colors">
            Lacak Pesanan
          </a>
          <a href="/dashboard/pelanggan/katalog" className="px-6 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors">
            Pesan Lagi
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Keranjang Belanja</h1>
        <p className="mt-1 text-amber-700/60">Review pesananmu sebelum checkout.</p>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 shadow-sm border border-amber-100 flex flex-col items-center justify-center text-center">
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">Keranjang Kosong</h2>
          <p className="text-amber-700/60 mb-6">Belum ada menu yang ditambahkan.</p>
          <a href="/dashboard/pelanggan/katalog" className="px-6 py-3 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition-colors">
            Lihat Katalog Menu
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Order Type */}
            <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm">
              <p className="text-sm font-bold text-amber-900 mb-3">Tipe Pesanan</p>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: "dine-in", label: "🪑 Makan di Tempat" }, { key: "takeaway", label: "🛍️ Dibawa Pulang" }].map(t => (
                  <button key={t.key} onClick={() => setOrderType(t.key as any)}
                    className={`py-3 rounded-2xl font-semibold text-sm transition-all ${orderType === t.key ? "bg-amber-900 text-white shadow-md" : "border border-amber-200 text-amber-700 hover:border-amber-400"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
              {cart.map((item, i) => (
                <div key={item.id} className={`p-5 ${i < cart.length - 1 ? "border-b border-amber-50" : ""}`}>
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shrink-0">{item.emoji}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-amber-900">{item.name}</p>
                          <p className="font-semibold text-amber-700 text-sm mt-0.5">Rp {item.price.toLocaleString("id-ID")}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors ml-4">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-amber-200 rounded-xl overflow-hidden">
                          <button onClick={() => changeQty(item.id, -1)} className="px-3 py-2 text-amber-700 hover:bg-amber-50 font-bold">-</button>
                          <span className="px-4 font-bold text-amber-900">{item.qty}</span>
                          <button onClick={() => changeQty(item.id, 1)} className="px-3 py-2 text-amber-700 hover:bg-amber-50 font-bold">+</button>
                        </div>
                        <span className="font-extrabold text-amber-900">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                      </div>
                      <input
                        value={item.note}
                        onChange={e => changeNote(item.id, e.target.value)}
                        placeholder="Catatan (opsional)..."
                        className="mt-2 w-full text-xs border border-amber-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 bg-amber-50/30"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm">
              <p className="text-sm font-bold text-amber-900 mb-3">Kode Promo</p>
              <div className="flex gap-3">
                <input
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  placeholder="Masukkan kode promo..."
                  className="flex-1 border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                />
                <button onClick={applyPromo} className="px-5 py-2.5 bg-amber-100 text-amber-900 font-bold rounded-xl hover:bg-amber-200 transition-colors text-sm">
                  Pakai
                </button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
              {appliedPromo && (
                <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-700 font-semibold">{appliedPromo.label} berhasil diterapkan!</span>
                  <button onClick={() => { setAppliedPromo(null); setPromoCode(""); }} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">Hapus</button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">Coba: KOPI10 atau MAHASISWA15</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm h-fit sticky top-8">
            <h2 className="text-lg font-bold text-amber-900 mb-5">Ringkasan Pesanan</h2>
            <div className="space-y-3 text-sm">
              {cart.map(c => (
                <div key={c.id} className="flex justify-between text-gray-600">
                  <span>{c.qty}x {c.name}</span>
                  <span>Rp {(c.price * c.qty).toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div className="border-t border-amber-100 pt-3 flex justify-between text-gray-700">
                <span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Diskon ({appliedPromo.label})</span>
                  <span>- Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
            </div>
            <div className="border-t border-amber-200 mt-4 pt-4 flex justify-between font-extrabold text-amber-900 text-xl mb-6">
              <span>Total</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
            <button onClick={() => setShowCheckout(true)} className="w-full py-4 bg-amber-900 text-white font-bold rounded-2xl shadow-md hover:bg-amber-800 transition-colors text-lg">
              Checkout →
            </button>
            <a href="/dashboard/pelanggan/katalog" className="block text-center mt-3 text-sm text-amber-600 hover:text-amber-900 transition-colors font-medium">
              + Tambah Item
            </a>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-900 mb-1">Konfirmasi Pesanan</h2>
            <p className="text-gray-500 text-sm mb-6">Pastikan pesananmu sudah benar sebelum dikonfirmasi.</p>
            <div className="bg-amber-50 rounded-2xl p-5 mb-6 space-y-2">
              {cart.map(c => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{c.qty}x {c.name} {c.note ? <span className="text-amber-600 italic">({c.note})</span> : null}</span>
                  <span className="font-bold">Rp {(c.price * c.qty).toLocaleString("id-ID")}</span>
                </div>
              ))}
              <div className="border-t border-amber-200 pt-2 flex justify-between font-extrabold text-amber-900 text-lg">
                <span>Total</span><span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Input Nomor WhatsApp Otomatis */}
            <div className="mb-5 bg-green-50/70 border border-green-200/80 rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-green-900 mb-1">
                📲 Nomor WhatsApp (Kirim Struk Otomatis)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full border border-green-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-mono bg-white"
              />
              <p className="text-[11px] text-green-700/80 mt-1">Struk pembayaran akan langsung dikirim otomatis ke nomor WhatsApp ini.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 border border-amber-200 text-amber-800 rounded-2xl font-semibold hover:bg-amber-50 transition-colors">Kembali</button>
              <button onClick={placeOrder} className="flex-1 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors">Pesan Sekarang!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
