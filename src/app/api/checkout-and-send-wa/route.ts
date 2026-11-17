import { NextResponse } from 'next/server';
import { getSetting } from '@/lib/settings';

export const runtime = 'nodejs';

/**
 * POST /api/checkout-and-send-wa
 * Menerima data checkout dan langsung mengirimkan struk pembayaran otomatis ke WhatsApp pelanggan di background.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerPhone,
      orderId = 'ORD-' + Math.floor(Math.random() * 9000 + 1000),
      totalAmount = 0,
      orderType = 'Makan di Tempat',
      items = [],
      customerName = 'Pelanggan Kopi',
    } = body;

    if (!customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Nomor WhatsApp pelanggan wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Bersihkan dan format nomor telepon ke format internasional (62xxxxxxxxx)
    let cleanPhone = String(customerPhone).replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    const formattedTotal =
      typeof totalAmount === 'number'
        ? totalAmount.toLocaleString('id-ID')
        : String(totalAmount).replace(/^Rp\s?/, '');

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let itemsText = '';
    if (Array.isArray(items) && items.length > 0) {
      itemsText =
        '\n*📋 RINCIAN PESANAN:*\n' +
        items
          .map(
            (it: any) =>
              `• ${it.qty || it.quantity || 1}x ${it.name || it.productName || 'Item'} (Rp ${Number(
                it.price || 0
              ).toLocaleString('id-ID')})`
          )
          .join('\n') +
        '\n';
    }

    // 2. Format pesan WhatsApp profesional resmi Kopi Mahasiswa
    const waMessage = `*☕ STRUK PEMBAYARAN - KOPI MAHASISWA* 🧾\n\n🆔 *Kode Pesanan:* *${orderId}*\n👤 *Nama Pelanggan:* ${customerName}\n📅 *Waktu:* ${dateStr}, ${timeStr} WIB\n📦 *Tipe:* ${orderType}${itemsText}\n💰 *Total Pembayaran:* *Rp ${formattedTotal}*\n✅ *Status:* Pembayaran Berhasil\n⏱️ *Estimasi:* 10–15 menit disiapkan Barista\n\n_Terima kasih telah memesan di Kopi Mahasiswa! Kopi nikmat siap disajikan!_ ☕✨`;

    // 3. Cek WhatsApp API Token dari Database Settings atau ENV
    const dbToken = await getSetting('whatsapp_api_token').catch(() => null);
    const token = dbToken || process.env.FONNTE_TOKEN || process.env.WHATSAPP_API_TOKEN;

    let gatewayResult: any = null;
    let mode: 'automatic_gateway' | 'wa_link' = 'wa_link';

    if (token) {
      try {
        // Kirim langsung via Fonnte API di background (tanpa buka tab browser)
        const resFonnte = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({
            target: cleanPhone,
            message: waMessage,
          }),
        });

        gatewayResult = await resFonnte.json();
        if (gatewayResult && gatewayResult.status) {
          mode = 'automatic_gateway';
          console.log(`[WA Auto Send SUCCESS] Struk ${orderId} terkirim langsung ke ${cleanPhone}`);
        } else {
          console.warn('[WA Auto Send Gateway Warn]:', gatewayResult);
        }
      } catch (err: any) {
        console.error('[WA Auto Send Gateway Error]:', err.message);
      }
    }

    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

    return NextResponse.json({
      success: true,
      message:
        mode === 'automatic_gateway'
          ? `Struk pesanan #${orderId} telah otomatis terkirim langsung ke WhatsApp ${cleanPhone}!`
          : `Struk pesanan #${orderId} siap dikirimkan ke WhatsApp ${cleanPhone}.`,
      mode,
      target: cleanPhone,
      directUrl,
      gatewayResult,
    });
  } catch (error: any) {
    console.error('Error in /api/checkout-and-send-wa:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses pengiriman WhatsApp.', details: error.message },
      { status: 500 }
    );
  }
}
