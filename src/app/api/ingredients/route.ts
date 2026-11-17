import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    const critical = ingredients.filter((i) => i.stock <= i.minStock).length;
    const low = ingredients.filter((i) => i.stock > i.minStock && i.stock <= i.minStock * 1.5).length;
    const safe = ingredients.filter((i) => i.stock > i.minStock * 1.5).length;

    return NextResponse.json({
      success: true,
      data: ingredients,
      stats: {
        total: ingredients.length,
        critical,
        low,
        safe,
      },
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil bahan baku' }, { status: 500 });
  }
}
