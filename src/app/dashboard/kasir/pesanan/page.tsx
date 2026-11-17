import React from 'react';
import { prisma } from '@/lib/prisma';

export default async function KasirPesananPage() {
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen p-8 bg-gray-50/50 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Kelola Pesanan</h1>
            <p className="mt-2 text-lg text-gray-600">Pantau dan perbarui status pesanan pelanggan.</p>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600">Kode Pesanan</th>
                  <th className="p-4 font-semibold text-gray-600">Pelanggan</th>
                  <th className="p-4 font-semibold text-gray-600">Total</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Belum ada pesanan masuk.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium">{order.code}</td>
                      <td className="p-4 text-gray-600">{order.user?.name || 'Walk-in'}</td>
                      <td className="p-4 font-semibold">Rp {order.totalAmount.toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium 
                          ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors mr-3">Proses</button>
                        <button className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors">Cetak Struk</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
