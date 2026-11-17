import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    const ingredients = await prisma.ingredient.findMany({
      select: { id: true, name: true, unit: true, costPerUnit: true, stock: true },
    });

    return NextResponse.json({ success: true, data: suppliers, ingredients });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data supplier' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contactInfo, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nama supplier wajib diisi' }, { status: 400 });
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        name,
        contactInfo: contactInfo || null,
        address: address || null,
      },
    });

    return NextResponse.json({ success: true, data: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat supplier' }, { status: 500 });
  }
}
