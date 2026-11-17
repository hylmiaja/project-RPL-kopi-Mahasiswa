"use client";

import { useState } from "react";

const SCHEDULE_DEMO = [
  { id: "1", hari: "Senin",  jamBuka: "07:00", jamTutup: "21:00", shiftKasir: "Kasir Kopi, Kasir Dua" },
  { id: "2", hari: "Selasa", jamBuka: "07:00", jamTutup: "21:00", shiftKasir: "Kasir Kopi" },
  { id: "3", hari: "Rabu",   jamBuka: "07:00", jamTutup: "21:00", shiftKasir: "Kasir Dua" },
  { id: "4", hari: "Kamis",  jamBuka: "07:00", jamTutup: "21:00", shiftKasir: "Kasir Kopi" },
  { id: "5", hari: "Jumat",  jamBuka: "07:00", jamTutup: "22:00", shiftKasir: "Kasir Kopi, Kasir Dua" },
  { id: "6", hari: "Sabtu",  jamBuka: "08:00", jamTutup: "22:00", shiftKasir: "Kasir Kopi, Kasir Dua" },
  { id: "7", hari: "Minggu", jamBuka: "08:00", jamTutup: "20:00", shiftKasir: "Kasir Dua" },
];

export default function OwnerPengaturanPage() {
  const [schedules, setSchedules] = useState(SCHEDULE_DEMO);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ jamBuka: "", jamTutup: "", shiftKasir: "" });
  const [saved, setSaved] = useState(false);

  // General settings state
  const [settings, setSettings] = useState({
    namaKafe: "Kopi Mahasiswa",
    alamat: "Jl. Kampus Raya No. 1, Bandung",
    telepon: "0812-3456-7890",
    email: "info@kopimahasiswa.com",
    instagram: "@kopimahasiswa",
    pajak: "10",
    biayaLayanan: "5",
    minOrder: "15000",
    maxCapacity: "50",
  });

  const startEdit = (s: typeof SCHEDULE_DEMO[0]) => {
    setEditId(s.id);
    setEditData({ jamBuka: s.jamBuka, jamTutup: s.jamTutup, shiftKasir: s.shiftKasir });
  };

  const saveEdit = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...editData } : s));
    setEditId(null);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Kendali & Pengaturan Sistem</h1>
          <p className="mt-1 text-amber-700/60">Atur informasi kafe, jam operasional, dan konfigurasi sistem.</p>
        </div>
        <button
          onClick={handleSaveAll}
          className={`flex items-center gap-2 px-5 py-3 font-bold rounded-2xl shadow-md transition-all ${saved ? "bg-green-600 text-white" : "bg-amber-900 text-white hover:bg-amber-800"}`}
        >
          {saved ? "✓ Tersimpan!" : "💾 Simpan Semua"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informasi Kafe */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm">
          <h2 className="text-xl font-bold text-amber-900 mb-5">🏪 Informasi Kafe</h2>
          <div className="space-y-4">
            {[
              { label: "Nama Kafe", key: "namaKafe" },
              { label: "Alamat", key: "alamat" },
              { label: "Telepon", key: "telepon" },
              { label: "Email", key: "email" },
              { label: "Instagram", key: "instagram" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-amber-800 mb-1.5">{label}</label>
                <input
                  value={settings[key as keyof typeof settings]}
                  onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/30"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Konfigurasi Transaksi */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm">
          <h2 className="text-xl font-bold text-amber-900 mb-5">⚙️ Konfigurasi Transaksi</h2>
          <div className="space-y-4">
            {[
              { label: "Pajak (%)", key: "pajak", suffix: "%" },
              { label: "Biaya Layanan (%)", key: "biayaLayanan", suffix: "%" },
              { label: "Minimum Order (Rp)", key: "minOrder", suffix: "Rp" },
              { label: "Kapasitas Tempat Duduk", key: "maxCapacity", suffix: "kursi" },
            ].map(({ label, key, suffix }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-amber-800 mb-1.5">{label}</label>
                <div className="flex items-center border border-amber-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 bg-amber-50/30">
                  <input
                    type="number"
                    value={settings[key as keyof typeof settings]}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 px-4 py-3 text-sm focus:outline-none bg-transparent"
                  />
                  <span className="px-4 text-sm text-amber-700 bg-amber-50 border-l border-amber-200 py-3 font-semibold">{suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jadwal Operasional */}
      <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm">
        <h2 className="text-xl font-bold text-amber-900 mb-5">🕐 Jadwal Operasional Harian</h2>
        <div className="overflow-x-auto rounded-2xl border border-amber-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50">
                <th className="px-5 py-3 text-left font-bold text-amber-700">Hari</th>
                <th className="px-5 py-3 text-left font-bold text-amber-700">Jam Buka</th>
                <th className="px-5 py-3 text-left font-bold text-amber-700">Jam Tutup</th>
                <th className="px-5 py-3 text-left font-bold text-amber-700">Shift Kasir</th>
                <th className="px-5 py-3 text-right font-bold text-amber-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {schedules.map(s => (
                <tr key={s.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-5 py-3 font-bold text-amber-900">{s.hari}</td>
                  {editId === s.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input type="time" value={editData.jamBuka} onChange={e => setEditData(p => ({ ...p, jamBuka: e.target.value }))} className="border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </td>
                      <td className="px-5 py-3">
                        <input type="time" value={editData.jamTutup} onChange={e => setEditData(p => ({ ...p, jamTutup: e.target.value }))} className="border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </td>
                      <td className="px-5 py-3">
                        <input value={editData.shiftKasir} onChange={e => setEditData(p => ({ ...p, shiftKasir: e.target.value }))} className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => saveEdit(s.id)} className="text-green-600 font-bold text-sm mr-3 hover:text-green-800 transition-colors">Simpan</button>
                        <button onClick={() => setEditId(null)} className="text-gray-500 font-semibold text-sm hover:text-gray-700 transition-colors">Batal</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-gray-700">{s.jamBuka}</td>
                      <td className="px-5 py-3 text-gray-700">{s.jamTutup}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{s.shiftKasir}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => startEdit(s)} className="text-amber-600 font-semibold text-sm hover:text-amber-900 transition-colors">Edit</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
