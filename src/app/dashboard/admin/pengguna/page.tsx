"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders?: number;
    kasirOrders?: number;
  };
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  countByRole: Record<string, number>;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin Kopi",
  OWNER: "Owner Kopi",
  KASIR: "Kasir",
  PETUGAS_STOK: "Petugas Stok",
  PELANGGAN: "Pelanggan",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  OWNER: "bg-amber-100 text-amber-800 border-amber-200",
  KASIR: "bg-blue-100 text-blue-800 border-blue-200",
  PETUGAS_STOK: "bg-stone-100 text-stone-700 border-stone-200",
  PELANGGAN: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function AdminPenggunaPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    countByRole: { PELANGGAN: 0, KASIR: 0, PETUGAS_STOK: 0, ADMIN: 0, OWNER: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("SEMUA");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "PELANGGAN",
    password: "",
    isActive: true,
  });

  // Modal & Action states
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setFeedback({ type: "error", text: data.message || "Gagal mengambil data pengguna." });
      }
    } catch {
      setFeedback({ type: "error", text: "Terjadi kesalahan jaringan saat memuat pengguna." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Dismiss feedback after 5s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Open Add Modal
  const openAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "PELANGGAN",
      password: "",
      isActive: true,
    });
    setFormError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (user: UserItem) => {
    setModalMode("edit");
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "", // Kosong jika tidak ganti
      isActive: user.isActive,
    });
    setFormError(null);
    setShowModal(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Nama lengkap wajib diisi.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setFormError("Format email tidak valid.");
      return;
    }

    if (modalMode === "add" && (!formData.password || formData.password.length < 6)) {
      setFormError("Password minimal 6 karakter untuk akun baru.");
      return;
    }
    if (modalMode === "edit" && formData.password && formData.password.length < 6) {
      setFormError("Password baru minimal 6 karakter.");
      return;
    }

    setFormLoading(true);

    try {
      if (modalMode === "add") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (result.success) {
          setShowModal(false);
          setFeedback({ type: "success", text: result.message || "Pengguna berhasil ditambahkan!" });
          fetchUsers();
        } else {
          setFormError(result.message || "Gagal menambahkan pengguna.");
        }
      } else {
        // Edit Mode
        const payload: Record<string, any> = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.success) {
          setShowModal(false);
          setFeedback({ type: "success", text: result.message || "Pengguna berhasil diperbarui!" });
          fetchUsers();
        } else {
          setFormError(result.message || "Gagal memperbarui pengguna.");
        }
      }
    } catch {
      setFormError("Terjadi gangguan koneksi ke server.");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle User Active Status
  const toggleStatus = async (user: UserItem) => {
    if (session?.user?.id === user.id) {
      alert("Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          text: `Status ${user.name} berhasil diubah menjadi ${!user.isActive ? "Aktif" : "Nonaktif"}.`,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
        );
        setStats((prev) => ({
          ...prev,
          activeUsers: user.isActive ? prev.activeUsers - 1 : prev.activeUsers + 1,
          inactiveUsers: user.isActive ? prev.inactiveUsers + 1 : prev.inactiveUsers - 1,
        }));
      } else {
        setFeedback({ type: "error", text: data.message || "Gagal mengubah status pengguna." });
      }
    } catch {
      setFeedback({ type: "error", text: "Gagal terhubung ke server untuk mengubah status." });
    }
  };

  // Delete User
  const handleDelete = async (user: UserItem) => {
    if (session?.user?.id === user.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    const confirm = window.confirm(
      `Apakah Anda yakin ingin menghapus pengguna "${user.name}" (${user.email})?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: data.message });
        fetchUsers();
      } else {
        setFeedback({ type: "error", text: data.message || "Gagal menghapus pengguna." });
      }
    } catch {
      setFeedback({ type: "error", text: "Gagal terhubung ke server saat menghapus pengguna." });
    }
  };

  // Filtered Users List
  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchRole = filterRole === "SEMUA" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const statCards = [
    { label: "Total Pengguna", value: stats.totalUsers || users.length, color: "text-amber-950", bg: "bg-white", icon: "👥" },
    { label: "Pelanggan", value: stats.countByRole.PELANGGAN || 0, color: "text-purple-700", bg: "bg-purple-50/50", icon: "☕" },
    { label: "Kasir", value: stats.countByRole.KASIR || 0, color: "text-blue-700", bg: "bg-blue-50/50", icon: "🧑‍💼" },
    { label: "Petugas Stok", value: stats.countByRole.PETUGAS_STOK || 0, color: "text-orange-700", bg: "bg-orange-50/50", icon: "📦" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "success" ? "✅" : "⚠️"}</span>
            <span className="text-sm font-semibold">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-950 tracking-tight">Kelola Pengguna & Peran</h1>
          <p className="mt-1 text-sm text-amber-900/60">
            Atur hak akses akun Admin, Owner, Kasir, Petugas Stok, dan Pelanggan langsung dari database.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-900 text-white font-bold rounded-2xl hover:bg-amber-800 transition-all shadow-md active:scale-95"
        >
          <span className="text-xl leading-none">+</span> Tambah Pengguna
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} border border-amber-100 rounded-2xl p-5 shadow-xs`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold mt-2 ${s.color}`}>
              {loading ? "..." : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau no. telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
          />
          <span className="absolute left-3.5 top-2.5 text-gray-400">🔍</span>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2.5 border border-amber-200 rounded-xl text-sm font-medium text-amber-950 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="SEMUA">Semua Peran</option>
          <option value="ADMIN">Admin Kopi</option>
          <option value="OWNER">Owner Kopi</option>
          <option value="KASIR">Kasir</option>
          <option value="PETUGAS_STOK">Petugas Stok</option>
          <option value="PELANGGAN">Pelanggan</option>
        </select>
        <button
          onClick={fetchUsers}
          title="Segarkan Data"
          className="px-4 py-2.5 border border-amber-200 text-amber-800 rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 text-sm font-semibold"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100">
                <th className="px-6 py-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Pengguna</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Peran</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Bergabung</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-900 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-amber-900 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full" />
                      <span>Memuat data pengguna dari database...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center font-bold text-amber-900 text-sm shrink-0">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-amber-950 flex items-center gap-2">
                            {user.name}
                            {session?.user?.id === user.id && (
                              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ROLE_COLOR[user.role] || "bg-gray-100 text-gray-800"}`}>
                        {ROLE_LABEL[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone ? (
                        <span>📞 {user.phone}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(user)}
                        title="Klik untuk ubah status aktif/nonaktif"
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          user.isActive
                            ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                            : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                        }`}
                      >
                        {user.isActive ? "✓ Aktif" : "✗ Nonaktif"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg font-semibold text-xs transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={session?.user?.id === user.id}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-semibold text-xs transition-colors"
                          title={session?.user?.id === user.id ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-amber-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-amber-100 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-amber-950">
                  {modalMode === "add" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
                </h2>
                <p className="text-xs text-amber-900/60 mt-0.5">
                  {modalMode === "add"
                    ? "Isi data akun baru yang akan disimpan ke database."
                    : `Memperbarui akun untuk ${formData.name}.`}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                  Alamat Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="budi@kopimahasiswa.com"
                  className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                    Peran (Role) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="PELANGGAN">Pelanggan</option>
                    <option value="KASIR">Kasir</option>
                    <option value="PETUGAS_STOK">Petugas Stok</option>
                    <option value="ADMIN">Admin Kopi</option>
                    <option value="OWNER">Owner Kopi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                    No. Handphone / WA
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-1.5">
                  {modalMode === "add" ? "Password Awal *" : "Password Baru (Opsional)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={
                    modalMode === "add"
                      ? "Minimal 6 karakter"
                      : "Kosongkan jika tidak ingin mengubah password"
                  }
                  className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {modalMode === "edit" && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Biarkan kosong jika tetap menggunakan password lama.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-semibold text-amber-950">
                    Akun Aktif (Dapat Login ke Sistem)
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                  className="flex-1 py-3 border border-amber-200 text-amber-900 rounded-2xl font-semibold hover:bg-amber-50 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-amber-900 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {formLoading && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  )}
                  <span>{modalMode === "add" ? "Simpan Pengguna" : "Perbarui Akun"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
