"use client";

import { useState } from "react";

const PRODUCTS_DEMO = [
  { id: "1", name: "Espresso Classic",    category: "Espresso",    price: 25000, emoji: "☕", desc: "Shot espresso kuat dan autentik",            promo: null },
  { id: "2", name: "Vanilla Latte",       category: "Latte",       price: 35000, emoji: "🥛", desc: "Espresso dengan susu segar dan sirup vanila", promo: "10%" },
  { id: "3", name: "Cold Brew Original",  category: "Cold Brew",   price: 30000, emoji: "🧊", desc: "Kopi diseduh dingin selama 12 jam",           promo: null },
  { id: "4", name: "Caramel Frappuccino", category: "Frappuccino", price: 42000, emoji: "🍮", desc: "Dingin, karamel, dan whipped cream",           promo: null },
  { id: "5", name: "Matcha Latte",        category: "Non-Coffee",  price: 38000, emoji: "🍵", desc: "Matcha premium Jepang dengan susu segar",     promo: "15%" },
  { id: "6", name: "Americano",           category: "Espresso",    price: 28000, emoji: "💧", desc: "Espresso dengan air panas, bold & clean",     promo: null },
  { id: "7", name: "Kopi Susu Aren",      category: "Latte",       price: 32000, emoji: "🍯", desc: "Kopi susu gula aren premium",                 promo: "20%" },
  { id: "8", name: "Mocha Latte",         category: "Latte",       price: 37000, emoji: "🍫", desc: "Perpaduan espresso, coklat, dan susu",        promo: null },
];

const CATS = ["Semua", "Espresso", "Latte", "Cold Brew", "Frappuccino", "Non-Coffee"];

export default function PelangganKatalogPage() {
  const [activeCat, setActiveCat] = useState("Semua");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const filtered = PRODUCTS_DEMO.filter(p =>
    (activeCat === "Semua" || p.category === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (id: string, name: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setToast(`${name} ditambahkan ke keranjang!`);
    setTimeout(() => setToast(null), 2000);
  };

  const totalItems = Object.values(cart).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-amber-900 text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm animate-in slide-in-from-right duration-300">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Katalog Menu</h1>
          <p className="mt-1 text-amber-700/60">Temukan kopi dan minuman favoritmu hari ini.</p>
        </div>
        <a href="/dashboard/pelanggan/keranjang" className="relative flex items-center gap-2 px-5 py-3 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition-colors shadow-md">
          🛒 Keranjang
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-extrabold rounded-full flex items-center justify-center animate-bounce">
              {totalItems}
            </span>
          )}
        </a>
      </div>

      {/* Search */}
      <input
        placeholder="Cari nama menu..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATS.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCat === cat ? "bg-amber-900 text-white shadow-md" : "bg-white border border-amber-200 text-amber-700 hover:border-amber-400"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(product => {
          const inCart = cart[product.id] || 0;
          return (
            <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group relative">
              {product.promo && (
                <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full animate-pulse">
                  -{product.promo}
                </div>
              )}
              {inCart > 0 && (
                <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-amber-900 text-white text-xs font-extrabold rounded-full flex items-center justify-center">
                  {inCart}
                </div>
              )}
              <div className="h-44 bg-amber-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
                {product.emoji}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{product.category}</span>
                <h3 className="font-bold text-lg mt-1 text-amber-900 leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4 flex-1">{product.desc}</p>
                <div className="flex justify-between items-center border-t border-amber-50 pt-3">
                  <div>
                    <span className="font-extrabold text-xl text-amber-900">Rp {product.price.toLocaleString("id-ID")}</span>
                    {product.promo && (
                      <p className="text-xs text-red-500 font-semibold">Hemat {product.promo}!</p>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product.id, product.name)}
                    className="w-11 h-11 bg-amber-900 text-white rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors shadow-md text-xl font-bold active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
