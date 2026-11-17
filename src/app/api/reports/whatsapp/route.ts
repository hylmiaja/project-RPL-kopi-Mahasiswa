import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reports/whatsapp?target=owner|admin
 *
 * Generates a realtime revenue report from the database and returns a
 * WhatsApp link that pre‑fills the message.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target') ?? 'owner';

    // 1️⃣ Gather statistics
    const [orders, customers] = await Promise.all([
      prisma.order.findMany({
        where: { status: { in: ['SELESAI', 'COMPLETED', 'PAID'] } },
        select: { totalAmount: true },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const completedCount = orders.length;
    const averageTransaction = completedCount ? totalRevenue / completedCount : 0;
    const activeCustomers = customers.length;

    // 2️⃣ Build report text (Indonesian, executive style)
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const ownerName = process.env.OWNER_NAME || 'Owner Kopi Mahasiswa';
    const report = `📊 *Laporan Omset Kopi Mahasiswa*\n🗓️ Tanggal: ${dateStr}\n⏰ Waktu: ${timeStr} WIB\n👤 Owner: ${ownerName}\n\n💰 *Total Omset:* Rp ${totalRevenue.toLocaleString('id-ID')}\n🧾 *Transaksi Selesai:* ${completedCount}\n📈 *Rata‑Rata Transaksi:* Rp ${averageTransaction.toLocaleString('id-ID')}\n👥 *Pelanggan Aktif:* ${activeCustomers}`;

    // 3️⃣ Encode for WhatsApp URL
    const encoded = encodeURIComponent(report);
    const phoneNumber = '62895364528886'; // nomor tujuan (dalam format internasional, tanpa +)
    const waUrl = `https://wa.me/${phoneNumber}?text=${encoded}`;

    // 4️⃣ Jika ada token gateway, kirim otomatis (optional)
    const token = process.env.FONNTE_TOKEN || process.env.WHATSAPP_API_TOKEN || null;
    if (token) {
      try {
        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({ target: phoneNumber, message: report }),
        });
        // Return success with auto‑sent flag
        return NextResponse.json({ success: true, sent: true, waUrl, report });
      } catch (e) {
        console.error('WhatsApp gateway error', e);
        // fallback to link
      }
    }

    return NextResponse.json({ success: true, sent: false, waUrl, report });
  } catch (error) {
    console.error('Error generating WhatsApp report', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat laporan' }, { status: 500 });
  }
}
