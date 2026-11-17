"use client";

import { useState } from "react";

const CATEGORIES = ["Espresso", "Latte", "Cold Brew", "Frappuccino", "Non-Coffee", "Makanan"];

const MENU_DEMO = [
  { id: "1", name: "Espresso Classic",    category: "Espresso",    price: 25000, active: true,  image: "☕", desc: "Shot espresso kuat dan autentik", recipe: [{bahan: "Biji Kopi", qty: "18g"}, {bahan: "Air", qty: "30ml"}] },
  { id: "2", name: "Vanilla Latte",       category: "Latte",       price: 35000, active: true,  image: "🥛", desc: "Espresso dengan susu segar dan sirup vanila", recipe: [{bahan: "Espresso", qty: "2 shot"}, {bahan: "Susu Segar", qty: "200ml"}, {bahan: "Sirup Vanila", qty: "15ml"}] },
  { id: "3", name: "Cold Brew Original",  category: "Cold Brew",   price: 30000, active: true,  image: "🧊", desc: "Kopi diseduh dingin selama 12 jam", recipe: [{bahan: "Biji Kopi Coarse", qty: "40g"}, {bahan: "Air Dingin", qty: "400ml"}] },
  { id: "4", name: "Caramel Frappuccino", category: "Frappuccino", price: 42000, active: true,  image: "🍮", desc: "Minuman dingin dengan karamel dan whipped cream", recipe: [{bahan: "Espresso", qty: "1 shot"}, {bahan: "Sirup Karamel", qty: "30ml"}, {bahan: "Es Batu", qty: "150g"}, {bahan: "Susu Segar", qty: "100ml"}] },
  { id: "5", name: "Matcha Latte",        category: "Non-Coffee",  price: 38000, active: true,  image: "🍵", desc: "Matcha premium Jepang dengan susu segar", recipe: [{bahan: "Matcha Powder", qty: "5g"}, {bahan: "Susu Segar", qty: "200ml"}, {bahan: "Gula Aren", qty: "20g"}] },
  { id: "6", name: "Americano",           category: "Espresso",    price: 28000, active: true,  image: "💧", desc: "Espresso dengan air panas", recipe: [{bahan: "Espresso", qty: "2 shot"}, {bahan: "Air Panas", qty: "150ml"}] },
  { id: "7", name: "Mocha Latte",         category: "Latte",       price: 37000, active: false, image: "🍫", desc: "Espresso dengan coklat dan susu", recipe: [{bahan: "Espresso", qty: "2 shot"}, {bahan: "Coklat Bubuk", qty: "15g"}, {bahan: "Susu Segar", qty: "180ml"}] },
];

export default function AdminMenuPage() {
  const [menus, setMenus] = useState(MENU_DEMO);
  const [categories, setCategories] = useState(CATEGORIES);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showRecipe, setShowRecipe] = useState<typeof MENU_DEMO[0] | null>(null);
  const [editItem, setEditItem] = useState<typeof MENU_DEMO[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "kategori">("menu");

  const [formMenu, setFormMenu] = useState({
    name: "",
    category: CATEGORIES[0],
    price: 25000,
    desc: "",
  });

  const openAddMenu = () => {
    setEditItem(null);
    setFormMenu({
      name: "",
      category: categories[0] || "Espresso",
      price: 25000,
      desc: "",
    });
    setShowModal(true);
  };

  const openEditMenu = (item: typeof MENU_DEMO[0]) => {
    setEditItem(item);
    setFormMenu({
      name: item.name,
      category: item.category,
      price: item.price,
      desc: item.desc,
    });
    setShowModal(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMenu.name.trim()) {
      alert("Nama menu tidak boleh kosong!");
      return;
    }

    if (editItem) {
      setMenus(prev =>
        prev.map(m =>
          m.id === editItem.id
            ? {
                ...m,
                name: formMenu.name.trim(),
                category: formMenu.category,
                price: Number(formMenu.price) || 0,
                desc: formMenu.desc.trim(),
              }
            : m
        )
      );
    } else {
      const newItem = {
        id: `menu-${Date.now()}`,
        name: formMenu.name.trim(),
        category: formMenu.category,
        price: Number(formMenu.price) || 0,
        active: true,
        image: "☕",
        desc: formMenu.desc.trim() || "Kopi racikan khas Kopi Mahasiswa.",
        recipe: [{ bahan: "Biji Kopi", qty: "18g" }, { bahan: "Air", qty: "150ml" }],
      };
      setMenus(prev => [newItem, ...prev]);
    }
    setShowModal(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;
    if (!categories.includes(clean)) {
      setCategories(prev => [...prev, clean]);
    }
    setNewCatName("");
    setShowCategoryModal(false);
  };

  const filtered = menus.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "Semua" || m.category === filterCat;
    return matchSearch && matchCat;
  });

  const toggleActive = (id: string) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Kelola Menu, Kategori & Resep</h1>
          <p className="mt-1 text-amber-700/60">Tambah dan edit menu, atur kategori, serta kelola resep bahan baku.</p>
        </div>
        <button
          onClick={openAddMenu}
          className="flex items-center gap-2 px-5 py-3 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition-colors shadow-md"
        >
          <span className="text-lg">+</span> Tambah Menu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-100">
        {(["menu", "kategori"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-semibold text-sm capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? "border-amber-700 text-amber-900" : "border-transparent text-amber-600/60 hover:text-amber-800"}`}
          >
            {tab === "menu" ? "🍽️ Daftar Menu" : "📁 Kategori"}
          </button>
        ))}
      </div>

      {activeTab === "menu" ? (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Cari nama menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="px-4 py-2.5 border border-amber-200 rounded-xl text-sm text-amber-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Grid Menu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(item => (
              <div key={item.id} className={`bg-white rounded-3xl overflow-hidden border shadow-sm transition-all ${item.active ? "border-amber-100 hover:shadow-md" : "border-gray-200 opacity-60"}`}>
                <div className="w-full h-40 bg-amber-50 flex items-center justify-center text-6xl relative">
                  {item.image}
                  {!item.active && (
                    <div className="absolute inset-0 bg-gray-100/70 flex items-center justify-center">
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">Nonaktif</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs text-amber-500 font-semibold uppercase">{item.category}</span>
                  <h3 className="font-bold text-amber-900 mt-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">{item.desc}</p>
                  <p className="font-extrabold text-amber-800 text-lg">Rp {item.price.toLocaleString("id-ID")}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setShowRecipe(item)}
                      className="flex-1 py-2 text-xs font-bold border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-colors"
                    >
                      📋 Resep
                    </button>
                    <button
                      onClick={() => openEditMenu(item)}
                      className="flex-1 py-2 text-xs font-bold border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => toggleActive(item.id)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${item.active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                    >
                      {item.active ? "Off" : "On"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-amber-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-900">Daftar Kategori Menu</h2>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-amber-900 text-white font-bold rounded-xl text-sm hover:bg-amber-800 transition-colors"
            >
              + Tambah Kategori
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat} className="border border-amber-100 rounded-2xl p-5 flex items-center justify-between bg-amber-50/50 hover:border-amber-300 transition-colors group">
                <div>
                  <p className="font-bold text-amber-900">{cat}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{menus.filter(m => m.category === cat).length} menu</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Resep */}
      {showRecipe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{showRecipe.image}</span>
              <div>
                <h2 className="text-xl font-bold text-amber-900">{showRecipe.name}</h2>
                <p className="text-sm text-gray-500">Resep & Bahan Baku</p>
              </div>
            </div>
            <div className="space-y-3">
              {showRecipe.recipe.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-amber-50 p-4 rounded-xl">
                  <span className="font-medium text-amber-900">{r.bahan}</span>
                  <span className="font-bold text-amber-700 bg-white px-3 py-1 rounded-lg text-sm">{r.qty}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowRecipe(null)} className="w-full mt-6 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Menu */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">{editItem ? "Edit Menu" : "Tambah Menu Baru"}</h2>
            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-1.5">Nama Menu</label>
                <input
                  value={formMenu.name}
                  onChange={e => setFormMenu(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Nama menu..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-1.5">Kategori</label>
                  <select
                    value={formMenu.category}
                    onChange={e => setFormMenu(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-1.5">Harga (Rp)</label>
                  <input
                    type="number"
                    value={formMenu.price}
                    onChange={e => setFormMenu(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="25000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-1.5">Deskripsi</label>
                <textarea
                  value={formMenu.desc}
                  onChange={e => setFormMenu(prev => ({ ...prev, desc: e.target.value }))}
                  rows={3}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  placeholder="Deskripsi menu..."
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-amber-200 text-amber-800 rounded-2xl font-semibold hover:bg-amber-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors"
                >
                  {editItem ? "Simpan Perubahan" : "Tambah Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kategori */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Tambah Kategori Baru</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-1.5">Nama Kategori</label>
                <input
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Contoh: Pastry / Dessert..."
                  className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2.5 border border-amber-200 text-amber-800 rounded-xl font-medium text-sm hover:bg-amber-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-900 text-white rounded-xl font-bold text-sm hover:bg-amber-800"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
