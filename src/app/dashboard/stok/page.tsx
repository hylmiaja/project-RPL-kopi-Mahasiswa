import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard Petugas Stok – Kopi Mahasiswa" };

export default async function StokDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "PETUGAS_STOK") redirect("/dashboard");

  const [ingredients, purchaseOrders] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.purchaseOrder.findMany({
      include: { supplier: true, items: { include: { ingredient: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalItem = ingredients.length;
  const stokKritis = ingredients.filter((i) => i.stock <= i.minStock).length;
  const stokMenipis = ingredients.filter((i) => i.stock > i.minStock && i.stock <= i.minStock * 1.5).length;
  const stokAman = ingredients.filter((i) => i.stock > i.minStock * 1.5).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">📦</div>
          <div>
            <h1 className="text-2xl font-bold text-amber-900 font-display">Dashboard Petugas Stok (Live MySQL)</h1>
            <p className="text-amber-600/70 mt-0.5">
              Halo, <span className="font-semibold text-amber-800">{session.user.name}</span>! Data inventori tersinkronisasi langsung dengan MySQL Laragon.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bahan Baku", value: String(totalItem), icon: "📦", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-100" },
          { label: "Stok Menipis", value: String(stokMenipis), icon: "⚠️", bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-100" },
          { label: "Stok Kritis", value: String(stokKritis), icon: "🚨", bg: "bg-red-50", text: "text-red-800", border: "border-red-100" },
          { label: "Stok Aman", value: String(stokAman), icon: "✅", bg: "bg-green-50", text: "text-green-800", border: "border-green-100" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${stat.text}`}>{stat.value}</span>
            </div>
            <p className={`text-sm font-medium ${stat.text}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Inventori Bahan Baku */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-amber-900 font-display">📋 Inventori Bahan Baku Live</h2>
          <span className="text-xs text-amber-600 font-semibold">{totalItem} bahan terdaftar</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/50">
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Bahan Baku</th>
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Stok Saat Ini</th>
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Min. Stok</th>
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {ingredients.map((item) => {
                const isCritical = item.stock <= item.minStock;
                const isLow = item.stock > item.minStock && item.stock <= item.minStock * 1.5;

                return (
                  <tr key={item.id} className="hover:bg-amber-50/50">
                    <td className="py-3 px-4 font-medium text-amber-900">
                      <span className="mr-2">📦</span>
                      {item.name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-800">
                      {item.stock} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-amber-600">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isCritical
                            ? "bg-red-100 text-red-700"
                            : isLow
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isCritical ? "Kritis" : isLow ? "Menipis" : "Aman"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Order Terkini */}
      <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-amber-900 font-display mb-4">📋 Purchase Order Masuk dari Admin & Vendor</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/50">
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Kode PO</th>
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Supplier</th>
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Bahan</th>
                <th className="text-left py-3 px-4 text-amber-700 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    Belum ada Purchase Order terdaftar.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-amber-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{po.code}</td>
                    <td className="py-3 px-4 text-gray-700">{po.supplier?.name}</td>
                    <td className="py-3 px-4 text-xs text-amber-700">
                      {po.items.map((i) => `${i.quantity}x ${i.ingredient?.name}`).join(", ")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {po.status}
                      </span>
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
