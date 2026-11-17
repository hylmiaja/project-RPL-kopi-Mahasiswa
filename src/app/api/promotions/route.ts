import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: promotions });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data promosi' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Khusus Admin & Owner.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, type, value, startDate, endDate, active } = body;

    if (!name || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Nama promo dan nilai diskon wajib diisi.' },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const promo = await prisma.promotion.create({
      data: {
        name: String(name).trim(),
        type: type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: Number(value) || 0,
        startDate: start,
        endDate: end,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json({ success: true, data: promo }, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat membuat promo.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Khusus Admin & Owner.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID promo diperlukan' }, { status: 400 });
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: { active: Boolean(active) },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui status promo' },
      { status: 500 }
    );
  }
}

