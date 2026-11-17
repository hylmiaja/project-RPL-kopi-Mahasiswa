"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  countByRole: Record<string, number>;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  OWNER: "bg-amber-100 text-amber-800",
  KASIR: "bg-blue-100 text-blue-800",
  PETUGAS_STOK: "bg-stone-100 text-stone-700",
  PELANGGAN: "bg-emerald-100 text-emerald-800",
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    countByRole: { PELANGGAN: 0, KASIR: 0, PETUGAS_STOK: 0, ADMIN: 0, OWNER: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OWNER") {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return null;
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "Semua" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalUsersCount = stats.totalUsers || users.length;
  const roleDistribution = [
    { role: "Pelanggan", key: "PELANGGAN", color: "bg-emerald-400" },
    { role: "Kasir", key: "KASIR", color: "bg-blue-400" },
    { role: "Petugas Stok", key: "PETUGAS_STOK", color: "bg-stone-400" },
    { role: "Admin", key: "ADMIN", color: "bg-purple-400" },
    { role: "Owner", key: "OWNER", color: "bg-amber-400" },
  ].map((r) => {
    const count = stats.countByRole[r.key] || 0;
    const pct = totalUsersCount > 0 ? Math.round((count / totalUsersCount) * 100) : 0;
    return { ...r, count, pct };
  });

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-amber-800 rounded-2xl p-6 shadow-lg">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
            <p className="text-slate-300/80 text-sm mt-0.5">
              Selamat datang, <span className="text-white font-semibold">{session?.user?.name}</span>! Kelola sistem Kopi Mahasiswa dari sini.
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex gap-3 flex-wrap">
          <div className="px-3 py-1.5 bg-green-500/20 border border-green-400/30 rounded-lg text-xs text-green-200">
            🟢 Sistem Terhubung Database
          </div>
          <div className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-slate-200">
            👥 {totalUsersCount} Pengguna Terdaftar
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Pengguna",
            value: String(totalUsersCount),
            icon: "👥",
            bg: "bg-blue-50",
            text: "text-blue-800",
            border: "border-blue-200",
            sub: `${totalUsersCount} akun di database`,
          },
          {
            label: "Pelanggan Terdaftar",
            value: String(stats.countByRole.PELANGGAN || 0),
            icon: "☕",
            bg: "bg-purple-50",
            text: "text-purple-800",
            border: "border-purple-200",
            sub: "Akun konsumen",
          },
          {
            label: "Status Sistem",
            value: "OK",
            icon: "🟢",
            bg: "bg-amber-50",
            text: "text-amber-800",
            border: "border-amber-200",
            sub: "Database aktif",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} border ${stat.border} rounded-2xl p-5 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/60 ${stat.text}`}>
                {stat.sub}
              </span>
            </div>
            <p className={`text-2xl font-bold ${stat.text}`}>
              {loading ? "..." : stat.value}
            </p>
            <p className={`text-xs font-medium ${stat.text} opacity-70 mt-1`}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Quick Actions ─── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-amber-900 mb-4">⚡ Aksi Cepat</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/admin/pengguna"
              className="w-full flex items-center gap-3 p-3 rounded-xl border bg-emerald-50 border-emerald-200 hover:border-emerald-400 transition-all text-left"
            >
              <span className="text-xl w-8 text-center">➕</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Kelola & Tambah Pengguna</p>
                <p className="text-xs text-gray-500">Edit, tambah, atau nonaktifkan akun</p>
              </div>
            </Link>
            <Link
              href="/dashboard/admin/menu"
              className="w-full flex items-center gap-3 p-3 rounded-xl border bg-blue-50 border-blue-200 hover:border-blue-400 transition-all text-left"
            >
              <span className="text-xl w-8 text-center">☕</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Katalog Produk & Resep</p>
                <p className="text-xs text-gray-500">Atur menu minuman dan harga</p>
              </div>
            </Link>
            <Link
              href="/dashboard/admin/pesanan"
              className="w-full flex items-center gap-3 p-3 rounded-xl border bg-purple-50 border-purple-200 hover:border-purple-400 transition-all text-left"
            >
              <span className="text-xl w-8 text-center">🧾</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Riwayat Pesanan</p>
                <p className="text-xs text-gray-500">Pantau transaksi dan status order</p>
              </div>
            </Link>
            <button
              onClick={() => window.print()}
              className="w-full flex items-center gap-3 p-3 rounded-xl border bg-amber-50 border-amber-200 hover:border-amber-400 transition-all text-left"
            >
              <span className="text-xl w-8 text-center">📄</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Cetak Laporan</p>
                <p className="text-xs text-gray-500">Ekspor tampilan ringkasan admin</p>
              </div>
            </button>
          </div>
        </div>

        {/* ─── Distribusi Role ─── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-amber-900 mb-4">📊 Distribusi Role</h2>
          <div className="space-y-3">
            {roleDistribution.map((r) => (
              <div key={r.role}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{r.role}</span>
                  <span className="text-gray-500">
                    {r.count} user ({r.pct}%)
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.color} transition-all duration-500`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Total Akun</span>
            <span className="font-bold text-amber-900">{totalUsersCount} pengguna</span>
          </div>
        </div>

        {/* ─── Aktivitas & Bantuan Chatbot ─── */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-amber-900 mb-4">🤖 AI Kopi Assistant</h2>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Chatbot sekarang dapat menjawab pertanyaan real-time berdasarkan peran Anda sebagai Admin:
          </p>
          <div className="space-y-2">
            {[
              "\"Ada berapa pelanggan?\"",
              "\"Ringkasan pengguna & peran\"",
              "\"Berapa total pesanan?\"",
              "\"Bahan baku yang menipis?\"",
            ].map((q, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs font-medium text-amber-950 flex items-center gap-2"
              >
                <span>💬</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 text-center">
            Gunakan tombol chat di pojok kanan bawah untuk bertanya!
          </p>
        </div>
      </div>

      {/* ─── Tabel Akun Real dari Database ─── */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-amber-900">👥 Daftar Akun Database</h2>
              <p className="text-xs text-amber-700/60 mt-0.5">
                {filtered.length} dari {totalUsersCount} pengguna
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Cari nama / email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 w-44"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400"
              >
                {["Semua", "ADMIN", "OWNER", "KASIR", "PETUGAS_STOK", "PELANGGAN"].map((r) => (
                  <option key={r} value={r}>
                    {r === "Semua" ? "Semua Peran" : r}
                  </option>
                ))}
              </select>
              <Link
                href="/dashboard/admin/pengguna"
                className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition-colors"
              >
                + Kelola Lengkap
              </Link>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50">
                <th className="text-left py-3 px-6 text-amber-700 font-semibold">Nama</th>
                <th className="text-left py-3 px-6 text-amber-700 font-semibold">Email</th>
                <th className="text-left py-3 px-6 text-amber-700 font-semibold">Role</th>
                <th className="text-left py-3 px-6 text-amber-700 font-semibold">Status</th>
                <th className="text-left py-3 px-6 text-amber-700 font-semibold">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Memuat pengguna...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs">
                          {u.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-semibold text-amber-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-amber-700">{u.email}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          ROLE_BADGE[u.role] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-amber-600 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
