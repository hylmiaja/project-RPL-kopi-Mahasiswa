import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

const ALLOWED_ROLES = ['ADMIN', 'OWNER', 'KASIR', 'PETUGAS_STOK', 'PELANGGAN'];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Khusus Admin dan Owner.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            kasirOrders: true,
            reviews: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;
    const countByRole = {
      PELANGGAN: users.filter((u) => u.role === 'PELANGGAN').length,
      KASIR: users.filter((u) => u.role === 'KASIR').length,
      PETUGAS_STOK: users.filter((u) => u.role === 'PETUGAS_STOK').length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
      OWNER: users.filter((u) => u.role === 'OWNER').length,
    };

    return NextResponse.json({
      success: true,
      users,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        countByRole,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data pengguna dari database.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Khusus Admin dan Owner.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role, password, phone, isActive } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap wajib diisi.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: `Peran tidak valid. Pilihan: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar di sistem. Gunakan email lain.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        role,
        password: hashedPassword,
        phone: phone ? String(phone).trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: newUser,
        message: `Pengguna ${newUser.name} (${newUser.role}) berhasil ditambahkan.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server saat menambahkan pengguna.' },
      { status: 500 }
    );
  }
}
