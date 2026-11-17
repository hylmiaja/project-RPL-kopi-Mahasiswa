"use client";

import { useState } from "react";

const BAHAN_BAKU_DEMO = [
  { id: "1", name: "Biji Kopi Arabika",  unit: "kg",  stock: 8.5,  minStock: 5,   avgCost: 180000, lastRestock: "18 Sep 2025" },
  { id: "2", name: "Susu Segar",         unit: "liter",stock: 12,  minStock: 20,  avgCost: 18000,  lastRestock: "19 Sep 2025" },
  { id: "3", name: "Gula Aren",          unit: "kg",  stock: 3.2,  minStock: 8,   avgCost: 45000,  lastRestock: "10 Sep 2025" },
  { id: "4", name: "Matcha Powder",      unit: "kg",  stock: 1.8,  minStock: 2,   avgCost: 350000, lastRestock: "15 Sep 2025" },
  { id: "5", name: "Sirup Vanilla",      unit: "liter",stock: 4.5,  minStock: 3,   avgCost: 85000,  lastRestock: "12 Sep 2025" },
  { id: "6", name: "Sirup Karamel",      unit: "liter",stock: 2.1,  minStock: 3,   avgCost: 90000,  lastRestock: "12 Sep 2025" },
  { id: "7", name: "Whipped Cream",      unit: "kaleng",stock: 15,  minStock: 10,  avgCost: 35000,  lastRestock: "17 Sep 2025" },
  { id: "8", name: "Air Mineral",        unit: "galon",stock: 6,    minStock: 4,   avgCost: 25000,  lastRestock: "20 Sep 2025" },
];

export default function BahanBakuPage() {
  const [items, setItems] = useState(BAHAN_BAKU_DEMO);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"SEMUA" | "KRITIS" | "AMAN">("SEMUA");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<typeof BAHAN_BAKU_DEMO[0] | null>(null);

  const [formBahan, setFormBahan] = useState({
    name: "",
    stock: 0,
    unit: "kg",
    minStock: 0,
    avgCost: 0,
  });

  const openAddBahan = () => {
    setEditItem(null);
    setFormBahan({ name: "", stock: 0, unit: "kg", minStock: 0, avgCost: 0 });
    setShowModal(true);
  };

  const openEditBahan = (item: typeof BAHAN_BAKU_DEMO[0]) => {
    setEditItem(item);
    setFormBahan({
      name: item.name,
      stock: item.stock,
      unit: item.unit,
      minStock: item.minStock,
      avgCost: item.avgCost,
    });
    setShowModal(true);
  };

  const handleSaveBahan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBahan.name.trim()) {
      alert("Nama bahan wajib diisi!");
      return;
    }

    if (editItem) {
      setItems(prev =>
        prev.map(i =>
          i.id === editItem.id
            ? {
                ...i,
                name: formBahan.name.trim(),
                stock: Number(formBahan.stock) || 0,
                unit: formBahan.unit,
                minStock: Number(formBahan.minStock) || 0,
                avgCost: Number(formBahan.avgCost) || 0,
              }
            : i
        )
      );
    } else {
      const newItem = {
        id: `bahan-${Date.now()}`,
        name: formBahan.name.trim(),
        stock: Number(formBahan.stock) || 0,
        unit: formBahan.unit,
        minStock: Number(formBahan.minStock) || 0,
        avgCost: Number(formBahan.avgCost) || 0,
        lastRestock: "Hari ini",
      };
      setItems(prev => [newItem, ...prev]);
    }
    setShowModal(false);
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const isCritical = i.stock <= i.minStock;
    const matchFilter = filter === "SEMUA" || (filter === "KRITIS" && isCritical) || (filter === "AMAN" && !isCritical);
    return matchSearch && matchFilter;
  });

  const kritis = items.filter(i => i.stock <= i.minStock);
  const totalAset = items.reduce((s, i) => s + i.stock * i.avgCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Kelola Bahan Baku</h1>
          <p className="mt-1 text-amber-700/60">Monitor stok, harga, dan status ketersediaan bahan.</p>
        </div>
        <button onClick={openAddBahan} className="flex items-center gap-2 px-5 py-3 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition-colors shadow-md">
          <span>+</span> Tambah Bahan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-amber-100 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Total Jenis Bahan</p>
          <p className="text-3xl font-bold text-amber-900 mt-1">{items.length}</p>
        </div>
        <div className={`border rounded-2xl p-5 ${kritis.length > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
          <p className="text-sm text-gray-500">Stok Kritis ⚠️</p>
          <p className={`text-3xl font-bold mt-1 ${kritis.length > 0 ? "text-red-700" : "text-green-700"}`}>{kritis.length}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Stok Aman</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{items.length - kritis.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-sm text-amber-700">Total Nilai Stok</p>
          <p className="text-xl font-bold text-amber-900 mt-1">Rp {(totalAset / 1000000).toFixed(1)}jt</p>
        </div>
      </div>

      {/* Alert kritis */}
      {kritis.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-bold text-red-800">Peringatan Stok Kritis!</p>
            <p className="text-sm text-red-700 mt-0.5">
              {kritis.map(k => k.name).join(", ")} membutuhkan restock segera.
            </p>
          </div>
          <button className="ml-auto px-3 py-1.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Buat PO</button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Cari bahan baku..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="flex gap-2">
          {(["SEMUA", "KRITIS", "AMAN"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${filter === f ? "bg-amber-900 text-white shadow" : "bg-white border border-amber-200 text-amber-700 hover:border-amber-400"}`}>
              {f === "SEMUA" ? "Semua" : f === "KRITIS" ? "🔴 Kritis" : "🟢 Aman"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50 border-b border-amber-100">
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Nama Bahan</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Min. Stok</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Harga/Satuan</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider">Restock Terakhir</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-700 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {filtered.map(item => {
                const isCritical = item.stock <= item.minStock;
                const pct = Math.min((item.stock / item.minStock) * 100, 100);
                return (
                  <tr key={item.id} className={`hover:bg-amber-50/50 transition-colors ${isCritical ? "bg-red-50/30" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isCritical && <span className="text-red-500 animate-pulse">🔴</span>}
                        <div>
                          <p className="font-semibold text-amber-900">{item.name}</p>
                          <p className="text-xs text-gray-500">per {item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`font-bold ${isCritical ? "text-red-700" : "text-green-700"}`}>
                            {item.stock} {item.unit}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isCritical ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{item.minStock} {item.unit}</td>
                    <td className="px-6 py-4 font-medium text-amber-900">Rp {item.avgCost.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.lastRestock}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openEditBahan(item)} className="text-amber-600 hover:text-amber-900 font-semibold text-sm">Edit</button>
                      {isCritical && <button className="text-red-600 hover:text-red-800 font-semibold text-sm">Restock</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">{editItem ? "Edit Bahan Baku" : "Tambah Bahan Baku"}</h2>
            <form onSubmit={handleSaveBahan} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-1.5">Nama Bahan</label>
                <input
                  value={formBahan.name}
                  onChange={e => setFormBahan(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Nama bahan baku..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-1.5">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={formBahan.stock}
                    onChange={e => setFormBahan(prev => ({ ...prev, stock: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-1.5">Satuan</label>
                  <select
                    value={formBahan.unit}
                    onChange={e => setFormBahan(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="gram">gram</option>
                    <option value="kaleng">kaleng</option>
                    <option value="galon">galon</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-1.5">Stok Minimum</label>
                  <input
                    type="number"
                    step="any"
                    value={formBahan.minStock}
                    onChange={e => setFormBahan(prev => ({ ...prev, minStock: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-1.5">Harga/Satuan (Rp)</label>
                  <input
                    type="number"
                    value={formBahan.avgCost}
                    onChange={e => setFormBahan(prev => ({ ...prev, avgCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0"
                    required
                  />
                </div>
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
                  {editItem ? "Simpan Perubahan" : "Tambah Bahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
