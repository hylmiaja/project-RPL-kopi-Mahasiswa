import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: { ingredient: true },
        },
        receipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: purchaseOrders });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil Purchase Orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { supplierId, items, expectedAt } = body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier dan item bahan baku wajib diisi' },
        { status: 400 }
      );
    }

    const count = await prisma.purchaseOrder.count();
    const year = new Date().getFullYear();
    const poCode = `PO-${year}-${String(count + 1).padStart(3, '0')}`;

    const poItemsData = items.map((item: any) => ({
      ingredientId: item.ingredientId,
      quantity: Number(item.quantity) || 1,
      unitCost: Number(item.unitCost) || 0,
      totalCost: (Number(item.quantity) || 1) * (Number(item.unitCost) || 0),
    }));

    const newPO = await prisma.purchaseOrder.create({
      data: {
        code: poCode,
        supplierId,
        status: 'SENT',
        expectedAt: expectedAt ? new Date(expectedAt) : null,
        items: {
          create: poItemsData,
        },
      },
      include: {
        supplier: true,
        items: {
          include: { ingredient: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: newPO }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat Purchase Order' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID dan status wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui status PO' }, { status: 500 });
  }
}
