import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

const ALLOWED_ROLES = ['ADMIN', 'OWNER', 'KASIR', 'PETUGAS_STOK', 'PELANGGAN'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Khusus Admin dan Owner.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID pengguna tidak ditemukan.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, role, password, phone, isActive } = body;

    const updateData: {
      name?: string;
      email?: string;
      role?: string;
      phone?: string | null;
      isActive?: boolean;
      password?: string;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Nama lengkap tidak boleh kosong.' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        return NextResponse.json(
          { success: false, message: 'Format email tidak valid.' },
          { status: 400 }
        );
      }
      if (cleanEmail !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (emailTaken) {
          return NextResponse.json(
            { success: false, message: 'Email sudah digunakan pengguna lain.' },
            { status: 409 }
          );
        }
        updateData.email = cleanEmail;
      }
    }

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json(
          { success: false, message: `Peran tidak valid. Pilihan: ${ALLOWED_ROLES.join(', ')}` },
          { status: 400 }
        );
      }
      // Safety: jangan ubah role admin terakhir jika itu satu-satunya admin
      if (existingUser.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { success: false, message: 'Tidak dapat mengubah peran Admin terakhir yang aktif.' },
            { status: 400 }
          );
        }
      }
      updateData.role = role;
    }

    if (phone !== undefined) {
      updateData.phone = phone ? String(phone).trim() : null;
    }

    if (isActive !== undefined) {
      // Safety: jangan nonaktifkan akun sendiri
      if (session.user.id === id && isActive === false) {
        return NextResponse.json(
          { success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' },
          { status: 400 }
        );
      }
      updateData.isActive = Boolean(isActive);
    }

    // Update password jika diisi
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password baru minimal 6 karakter.' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Data pengguna ${updatedUser.name} berhasil diperbarui.`,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memperbarui pengguna.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Khusus Admin dan Owner.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID pengguna tidak valid.' },
        { status: 400 }
      );
    }

    // Safety: Tidak bisa hapus diri sendiri
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            kasirOrders: true,
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Safety: Cegah hapus admin terakhir
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Tidak dapat menghapus akun Admin terakhir di sistem.' },
          { status: 400 }
        );
      }
    }

    // Jika pengguna memiliki riwayat relasi (orders, reviews, dll), nonaktifkan saja untuk integritas database
    const hasRelations = (user._count.orders + user._count.kasirOrders + user._count.bookings) > 0;

    if (hasRelations) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: `Pengguna ${user.name} memiliki riwayat transaksi/pesanan. Status berhasil diubah menjadi Nonaktif demi menjaga integritas data.`,
      });
    }

    // Jika tidak ada data transaksi terkait, hapus permanen
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: `Pengguna ${user.name} berhasil dihapus permanen dari sistem.`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses penghapusan pengguna.' },
      { status: 500 }
    );
  }
}
