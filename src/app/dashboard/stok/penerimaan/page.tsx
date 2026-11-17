import React from 'react';
import { prisma } from '@/lib/prisma';

export default async function PenerimaanPage() {
  const receipts = await prisma.goodsReceipt.findMany({
    include: { purchaseOrder: true, items: true },
    orderBy: { receivedAt: 'desc' }
  });

  return (
    <div className="min-h-screen p-8 bg-gray-50/50 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Penerimaan Barang</h1>
            <p className="mt-2 text-lg text-gray-600">Catat penerimaan barang dari supplier.</p>
          </div>
          <button className="px-6 py-3 bg-black text-white font-semibold rounded-2xl shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2">
            Catat Penerimaan
          </button>
        </header>

        {/* Table Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600">No. Penerimaan</th>
                  <th className="p-4 font-semibold text-gray-600">Kode PO</th>
                  <th className="p-4 font-semibold text-gray-600">Tanggal Diterima</th>
                  <th className="p-4 font-semibold text-gray-600">Total Item Diterima</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Belum ada data penerimaan barang.</td>
                  </tr>
                ) : (
                  receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium">{receipt.receiptNumber}</td>
                      <td className="p-4 text-blue-600 font-medium cursor-pointer">{receipt.purchaseOrder.code}</td>
                      <td className="p-4 text-gray-500">{receipt.receivedAt.toLocaleDateString('id-ID')}</td>
                      <td className="p-4 text-gray-500">{receipt.items.length} item</td>
                      <td className="p-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">Detail</button>
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
