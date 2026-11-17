import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const {
      type, // 'WHATSAPP' | 'EMAIL'
      recipientRole, // 'OWNER' | 'ADMIN' | 'PETUGAS_STOK' | 'PELANGGAN'
      recipientName,
      recipientContact, // phone number or email
      title,
      content,
      orderCode,
    } = body;

    if (!type || !content) {
      return NextResponse.json(
        { success: false, error: 'Tipe notifikasi dan konten wajib diisi.' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const sender = session?.user?.name || 'Sistem Chatbot Kopi Mahasiswa';

    // Log notifikasi untuk keperluan tracking / audit laporan
    console.log(`[NOTIFIKASI CHATBOT ${type}]`, {
      timestamp,
      sender,
      recipientRole,
      recipientName,
      recipientContact,
      title,
      orderCode,
      contentSnippet: content.slice(0, 100),
    });

    // Format tautan pengiriman langsung
    let directUrl = '';
    if (type === 'WHATSAPP') {
      let cleanPhone = (recipientContact || '').replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }
      directUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(content)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(content)}`;
    } else if (type === 'EMAIL') {
      const emailTarget = recipientContact || '';
      directUrl = `mailto:${encodeURIComponent(emailTarget)}?subject=${encodeURIComponent(
        title || 'Laporan Kopi Mahasiswa'
      )}&body=${encodeURIComponent(content)}`;
    }

    return NextResponse.json({
      success: true,
      message: `Notifikasi/Laporan ${type} untuk ${recipientRole || 'Pengguna'} berhasil diproses!`,
      directUrl,
      details: {
        type,
        recipientRole,
        recipientName,
        recipientContact,
        title,
        timestamp,
      },
    });
  } catch (error) {
    console.error('Error handling notification report:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengirim notifikasi/laporan.' },
      { status: 500 }
    );
  }
}
