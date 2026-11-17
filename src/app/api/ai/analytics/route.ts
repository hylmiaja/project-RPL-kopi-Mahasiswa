import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [orders, ingredients, products, revAgg] = await Promise.all([
      prisma.order.findMany({
        where: { status: { not: 'CANCELLED' } },
        include: {
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ingredient.findMany(),
      prisma.product.findMany(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } },
      }),
    ]);

    const totalRevenue = revAgg._sum.totalAmount || 0;
    const completedOrders = orders.filter((o) =>
      ['SELESAI', 'COMPLETED', 'PAID'].includes(o.status)
    ).length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;

    // Hitung menu paling laku dari transaksi nyata
    const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      for (const it of o.items) {
        const name = it.product?.name || 'Produk Kopi';
        if (!itemSales[name]) itemSales[name] = { name, qty: 0, revenue: 0 };
        itemSales[name].qty += it.quantity;
        itemSales[name].revenue += it.subtotal;
      }
    }
    const topMenu = Object.values(itemSales).sort((a, b) => b.qty - a.qty);
    const bestSeller = topMenu[0]?.name || (products[0]?.name ?? 'Kopi');

    // Analisis bahan baku kritis
    const lowStock = ingredients.filter((i) => i.stock <= i.minStock * 1.5);
    const criticalStock = ingredients.filter((i) => i.stock <= i.minStock);

    const insights = [
      `Total akumulasi omset tercatat di database saat ini: Rp ${totalRevenue.toLocaleString('id-ID')} dari ${orders.length} transaksi (${completedOrders} selesai, ${pendingOrders} pending).`,
      bestSeller
        ? `Menu terlaris di sistem: ${bestSeller} (${topMenu[0]?.qty || 1} porsi terjual). Pastikan ketersediaan bahan bakunya terjaga.`
        : 'Data pesanan menu tercatat dan terhubung sinkron ke database.',
      criticalStock.length > 0
        ? `Terdapat ${criticalStock.length} bahan baku dalam status kritis (${criticalStock.map((c) => c.name).join(', ')}). Segera buat Purchase Order.`
        : 'Seluruh stok bahan baku utama di gudang dalam kondisi aman.',
      `Tercatat ${ingredients.length} jenis bahan baku gudang dan ${products.length} menu aktif tersinkronisasi di sistem POS Kasir.`,
    ];

    const predictions = {
      recommendedRestock: lowStock.map((i) => ({
        ingredient: i.name,
        currentStock: i.stock,
        minStock: i.minStock,
        unit: i.unit,
        recommendedOrder: Math.max(i.minStock * 2 - i.stock, 10),
      })),
      revenueForecast: `Rp ${(totalRevenue > 0 ? Math.round(totalRevenue * 1.3) : 500000).toLocaleString('id-ID')} proyeksi periode berikutnya`,
      totalRevenue,
      totalOrders: orders.length,
      topMenu,
    };

    return NextResponse.json({
      success: true,
      data: {
        insights,
        predictions,
        stats: {
          totalRevenue,
          totalOrders: orders.length,
          completedOrders,
          pendingOrders,
        },
      },
    });
  } catch (error) {
    console.error('Error generating AI analytics:', error);
    return NextResponse.json({ error: 'Gagal memproses AI analytics' }, { status: 500 });
  }
}
