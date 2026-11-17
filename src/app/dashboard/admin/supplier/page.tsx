"use client";

import { useState, useEffect } from "react";

export default function AdminSupplierPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal Supplier
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", contactInfo: "", address: "" });

  // Modal Open PO
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [poForm, setPoForm] = useState({
    ingredientId: "",
    quantity: 10,
    unitCost: 50000,
  });
  const [submittingPo, setSubmittingPo] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSuppliers(json.data || []);
          if (json.ingredients) {
            setIngredients(json.ingredients);
            if (json.ingredients.length > 0 && !poForm.ingredientId) {
              setPoForm((prev) => ({
                ...prev,
                ingredientId: json.ingredients[0].id,
                unitCost: json.ingredients[0].costPerUnit || 50000,
              }));
            }
          }
        }
      }
    } catch (err) {
      console.error("Gagal load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });
      if (res.ok) {
        setShowSupplierModal(false);
        setSupplierForm({ name: "", contactInfo: "", address: "" });
        await fetchSuppliers();
      } else {
        alert("Gagal menambahkan supplier");
      }
    } catch (err) {
      console.error("Error creating supplier:", err);
    }
  };

  const handleOpenPo = (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowPoModal(true);
  };

  const handleSubmitPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !poForm.ingredientId) {
      alert("Silakan pilih bahan baku terlebih dahulu!");
      return;
    }
    setSubmittingPo(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier.id,
          items: [
            {
              ingredientId: poForm.ingredientId,
              quantity: Number(poForm.quantity),
              unitCost: Number(poForm.unitCost),
            },
          ],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        alert(`Berhasil membuat Purchase Order ${json.data.code} untuk ${selectedSupplier.name}!`);
        setShowPoModal(false);
        await fetchSuppliers();
      } else {
        alert(json.error || "Gagal membuat Purchase Order");
      }
    } catch (err) {
      console.error("Gagal submit PO:", err);
      alert("Terjadi kesalahan saat memproses PO.");
    } finally {
      setSubmittingPo(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(search.toLowerCase())) ||
      (s.contactInfo && s.contactInfo.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPoCount = suppliers.reduce((acc, s) => acc + (s.purchaseOrders?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Vendors & Supplier (Open PO)</h1>
          <p className="mt-1 text-amber-700/60">Kelola supplier dan terbitkan Purchase Order (PO) langsung ke database.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSuppliers}
            className="px-4 py-3 bg-amber-100 text-amber-900 font-bold rounded-2xl hover:bg-amber-200 transition-colors"
          >
            🔄 Sinkron
          </button>
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition-colors shadow-md"
          >
            <span className="text-lg">+</span> Tambah Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Supplier Aktif</p>
          <p className="text-3xl font-bold text-amber-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Purchase Order (PO)</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{totalPoCount}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Bahan Baku Terdaftar</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{ingredients.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Status Sistem</p>
          <p className="text-xl font-bold text-blue-700 mt-2">MySQL Terkoneksi</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Cari nama supplier, kontak, atau alamat..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-3xl border border-amber-100 text-gray-500">
            {loading ? "Memuat data supplier..." : "Belum ada data supplier. Klik Tambah Supplier untuk memulai."}
          </div>
        ) : (
          filtered.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-800">
                    {supplier.name[0]}
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                    Vendor Resmi
                  </span>
                </div>
                <h3 className="font-bold text-amber-900 text-lg mb-1">{supplier.name}</h3>
                <div className="space-y-2 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📞</span> <span>{supplier.contactInfo || "Tidak ada telepon"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span> <span>{supplier.address || "Alamat belum diatur"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-amber-50">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>
                    PO Terakhir:{" "}
                    <strong className="text-amber-800">
                      {supplier.purchaseOrders && supplier.purchaseOrders.length > 0
                        ? supplier.purchaseOrders[0].code
                        : "Belum ada"}
                    </strong>
                  </span>
                  <span>
                    <strong className="text-amber-800">{supplier.purchaseOrders?.length || 0}</strong> pesanan
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenPo(supplier)}
                    className="w-full py-2.5 text-sm font-bold bg-amber-900 text-white rounded-xl hover:bg-amber-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    📋 Open PO (Buat PO Baru)
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah Supplier */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSupplier}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-4"
          >
            <h2 className="text-2xl font-bold text-amber-900">Tambah Supplier Baru</h2>
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Nama Supplier *</label>
              <input
                required
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Contoh: PT Sumber Kopi Prima"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Kontak / Telepon / Email</label>
              <input
                value={supplierForm.contactInfo}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactInfo: e.target.value })}
                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="0812-xxxx-xxxx / supplier@kopi.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Alamat</label>
              <textarea
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                rows={2}
                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                placeholder="Alamat lengkap gudang / vendor..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="flex-1 py-3 border border-amber-200 text-amber-800 rounded-2xl font-semibold hover:bg-amber-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Open PO */}
      {showPoModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitPo}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-4"
          >
            <div>
              <h2 className="text-2xl font-bold text-amber-900">Open Purchase Order (PO)</h2>
              <p className="text-xs text-amber-700/70 mt-1">
                Vendor: <strong className="text-amber-900">{selectedSupplier.name}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">Pilih Bahan Baku *</label>
              <select
                value={poForm.ingredientId}
                onChange={(e) => {
                  const ing = ingredients.find((i) => i.id === e.target.value);
                  setPoForm({
                    ...poForm,
                    ingredientId: e.target.value,
                    unitCost: ing?.costPerUnit || poForm.unitCost,
                  });
                }}
                className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit}) — Stok saat ini: {ing.stock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Jumlah Pemesanan</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={poForm.quantity}
                  onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                  className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={poForm.unitCost}
                  onChange={(e) => setPoForm({ ...poForm, unitCost: Number(e.target.value) })}
                  className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl text-sm text-amber-950 flex justify-between font-bold">
              <span>Estimasi Biaya PO:</span>
              <span className="text-amber-900">
                Rp {(Number(poForm.quantity) * Number(poForm.unitCost)).toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowPoModal(false)}
                className="flex-1 py-3 border border-amber-200 text-amber-800 rounded-2xl font-semibold hover:bg-amber-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingPo}
                className="flex-1 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors disabled:opacity-50"
              >
                {submittingPo ? "Memproses..." : "🚀 Terbitkan PO"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
