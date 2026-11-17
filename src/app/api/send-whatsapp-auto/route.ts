import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';

export const runtime = 'nodejs';

/**
 * POST /api/send-whatsapp-auto
 *
 * Endpoint otomatis yang dipanggil saat halaman Pesanan Berhasil dibuka.
 * Mengambil data pesanan dari database berdasarkan orderId,
 * lalu mengirimkan struk pembayaran langsung ke WhatsApp pelanggan via Fonnte.
 *
 * Body JSON:
 * - orderId        : string  → Kode pesanan (misal: "ORD-9991")
 * - customerPhone  : string  → Nomor WA pelanggan (misal: "62895364528886")
 * - totalAmount    : string  → Opsional override total (misal: "Rp 70.000")
 * - customerName   : string  → Opsional override nama pelanggan
 * - orderType      : string  → Opsional tipe pesanan
 * - items          : array   → Opsional item pesanan (auto-fetch dari DB jika tidak diisi)
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      orderId,
      customerPhone,
      totalAmount: overrideTotal,
      customerName: overrideName,
      orderType: overrideType,
      items: overrideItems,
    } = body;

    // ─── Validasi input wajib ───────────────────────────────────────────────
    if (!customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Nomor WhatsApp pelanggan (customerPhone) wajib diisi.' },
        { status: 400 }
      );
    }

    // ─── Format nomor telepon ke standar internasional 62xxxxxxxxx ──────────
    let cleanPhone = String(customerPhone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }
    // Jika sudah dimulai dengan 62 (tidak perlu diubah)

    // ─── Ambil data pesanan dari database (jika orderId tersedia) ────────────
    let dbOrder: any = null;
    let resolvedOrderId = orderId || `ORD-${Date.now()}`;
    let resolvedName = overrideName || 'Pelanggan Kopi';
    let resolvedType = overrideType || 'Makan di Tempat';
    let resolvedTotal: number | string = overrideTotal || 0;
    let resolvedItems: any[] = overrideItems || [];

    if (orderId) {
      try {
        dbOrder = await prisma.order.findFirst({
          where: {
            OR: [
              { code: orderId },
              { id: orderId },
            ],
          },
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: {
              include: {
                product: { select: { name: true, price: true } },
              },
            },
            payment: true,
          },
        });

        if (dbOrder) {
          resolvedOrderId = dbOrder.orderCode || dbOrder.id || orderId;
          resolvedName = overrideName || dbOrder.user?.name || dbOrder.guestName || 'Pelanggan Kopi';
          resolvedType = overrideType || dbOrder.orderType || dbOrder.type || 'Makan di Tempat';
          resolvedTotal = overrideTotal || dbOrder.totalAmount || 0;

          // Ambil items dari database jika tidak di-override
          if (!overrideItems && dbOrder.items?.length > 0) {
            resolvedItems = dbOrder.items.map((it: any) => ({
              name: it.product?.name || it.name || 'Item',
              qty: it.quantity || it.qty || 1,
              price: it.product?.price || it.price || 0,
            }));
          }
        }
      } catch (dbErr: any) {
        // Lanjutkan dengan data dari body jika DB error
        console.warn('[WA Auto Send] DB lookup skip:', dbErr.message);
      }
    }

    // ─── Format total uang ────────────────────────────────────────────────
    let formattedTotal = '';
    if (typeof resolvedTotal === 'number') {
      formattedTotal = resolvedTotal.toLocaleString('id-ID');
    } else {
      formattedTotal = String(resolvedTotal).replace(/^Rp\s?/, '');
    }

    // ─── Tanggal & waktu ──────────────────────────────────────────────────
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // ─── Rincian item pesanan ─────────────────────────────────────────────
    let itemsText = '';
    if (Array.isArray(resolvedItems) && resolvedItems.length > 0) {
      itemsText =
        '\n\n📋 *RINCIAN PESANAN:*\n' +
        resolvedItems
          .map(
            (it: any) =>
              `• ${it.qty || it.quantity || 1}x ${it.name || it.productName || 'Item'}` +
              (it.price ? ` — Rp ${Number(it.price).toLocaleString('id-ID')}` : '')
          )
          .join('\n');
    }

    // ─── Susun pesan WhatsApp ─────────────────────────────────────────────
    const waMessage =
      `☕ *STRUK PEMBAYARAN — KOPI MAHASISWA* 🧾\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 *Kode Pesanan:* *${resolvedOrderId}*\n` +
      `👤 *Nama:* ${resolvedName}\n` +
      `📅 *Waktu:* ${dateStr}, ${timeStr} WIB\n` +
      `📦 *Tipe:* ${resolvedType}` +
      itemsText +
      `\n━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Total Pembayaran:* *Rp ${formattedTotal}*\n` +
      `✅ *Status:* Pembayaran Berhasil\n` +
      `⏱️ *Estimasi:* 10–15 menit disiapkan Barista\n\n` +
      `_Terima kasih telah memesan di Kopi Mahasiswa! Kopi nikmat siap disajikan!_ ☕✨`;

    // ─── Ambil token Fonnte dari database atau ENV ────────────────────────
    const dbToken = await getSetting('whatsapp_api_token').catch(() => '');
    const token = dbToken || process.env.FONNTE_TOKEN || process.env.WHATSAPP_API_TOKEN || '';

    if (!token) {
      // Tidak ada token → kembalikan WA link manual
      const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
      return NextResponse.json({
        success: false,
        message: 'Token WhatsApp Gateway (Fonnte) belum dikonfigurasi. Silakan atur di /dashboard/admin/ai.',
        mode: 'no_token',
        wa_link: directUrl,
      });
    }

    // ─── Kirim via Fonnte API ─────────────────────────────────────────────
    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({
        target: cleanPhone,
        message: waMessage,
        countryCode: '62',
      }),
    });

    const fonnteResult = await fonnteRes.json();
    const latencyMs = Date.now() - startTime;

    if (fonnteResult && fonnteResult.status) {
      console.log(`[WA Auto Send ✅] Struk ${resolvedOrderId} → ${cleanPhone} (${latencyMs}ms)`);
      return NextResponse.json({
        success: true,
        message: `Struk pesanan *${resolvedOrderId}* berhasil dikirim otomatis ke WhatsApp ${cleanPhone}!`,
        mode: 'automatic_gateway',
        target: cleanPhone,
        orderId: resolvedOrderId,
        latencyMs,
        gatewayResult: fonnteResult,
      });
    } else {
      // Gateway error → fallback ke WA link
      const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
      console.warn(`[WA Auto Send ⚠️] Gateway gagal untuk ${resolvedOrderId}:`, fonnteResult);
      return NextResponse.json({
        success: false,
        message: `Gagal mengirim via gateway: ${fonnteResult?.reason || fonnteResult?.detail || 'Unknown error'}`,
        mode: 'gateway_error',
        wa_link: directUrl,
        gatewayResult: fonnteResult,
        latencyMs,
      });
    }
  } catch (error: any) {
    console.error('[WA Auto Send 💥 ERROR]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
