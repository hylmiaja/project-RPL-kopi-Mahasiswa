import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Ambil daftar seluruh pesanan real-time dari database
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status && status !== 'SEMUA') where.status = status;

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        kasir: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, description: true } },
          },
        },
        payment: true,
      },
    });

    const allOrders = await prisma.order.findMany({
      select: { status: true, totalAmount: true },
    });

    const totalRevenue = allOrders
      .filter((o) => ['SELESAI', 'COMPLETED', 'PAID'].includes(o.status))
      .reduce((s, o) => s + o.totalAmount, 0);

    const stats = {
      total: allOrders.length,
      selesai: allOrders.filter((o) => ['SELESAI', 'COMPLETED', 'PAID'].includes(o.status)).length,
      pending: allOrders.filter((o) => o.status === 'PENDING').length,
      proses: allOrders.filter((o) => o.status === 'PROSES' || o.status === 'PROCESS').length,
      dibatalkan: allOrders.filter((o) => o.status === 'DIBATALKAN' || o.status === 'CANCELLED').length,
      totalRevenue,
    };

    return NextResponse.json({ success: true, data: orders, stats });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data pesanan' }, { status: 500 });
  }
}

// POST: Buat pesanan baru langsung ke MySQL Laragon
export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { items, customerName, customerEmail, paymentMethod = 'CASH', userId: bodyUserId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Item pesanan tidak boleh kosong' }, { status: 400 });
    }

    // Ambil data produk untuk hitung subtotal akurat
    const productIds = items.map((i: any) => i.productId || i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const prod = dbProducts.find((p) => p.id === (item.productId || item.id));
      const price = prod ? prod.price : item.price || 0;
      const qty = item.qty || item.quantity || 1;
      const subtotal = price * qty;
      totalAmount += subtotal;
      return {
        productId: prod ? prod.id : item.productId || item.id,
        quantity: qty,
        unitPrice: price,
        subtotal,
        note: item.note || null,
      };
    });

    // Cari user id jika ada
    let targetUserId = session?.user?.id || bodyUserId || null;
    if (!targetUserId && customerEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: customerEmail } });
      if (existingUser) targetUserId = existingUser.id;
    }

    // Tentukan kasir id jika login sebagai kasir
    const kasirId = session?.user?.role === 'KASIR' ? session.user.id : null;

    // Generate kode unik ORD-XXX
    const count = await prisma.order.count();
    const orderCode = `ORD-${String(count + 1).padStart(3, '0')}`;

    const newOrder = await prisma.order.create({
      data: {
        code: orderCode,
        userId: targetUserId,
        kasirId,
        status: 'SELESAI', // Langsung selesai untuk POS Kasir
        totalAmount,
        items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: paymentMethod.toUpperCase(),
            amountPaid: totalAmount,
            changeGiven: 0,
          },
        },
      },
      include: {
        items: { include: { product: true } },
        payment: true,
        user: true,
      },
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}

// PATCH: Update status pesanan (SELESAI, PENDING, PROSES, DIBATALKAN)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID dan status wajib diisi' }, { status: 400 });
    }

    // Normalisasi status
    let normalizedStatus = status.toUpperCase();
    if (normalizedStatus === 'COMPLETED') normalizedStatus = 'SELESAI';
    if (normalizedStatus === 'PROCESS') normalizedStatus = 'PROSES';
    if (normalizedStatus === 'CANCELLED') normalizedStatus = 'DIBATALKAN';

    const updated = await prisma.order.update({
      where: { id },
      data: { status: normalizedStatus },
      include: {
        items: { include: { product: true } },
        user: true,
        payment: true,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui status pesanan' }, { status: 500 });
  }
}
