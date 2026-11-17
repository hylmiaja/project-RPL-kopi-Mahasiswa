import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Endpoint Terpadu: Chatbot AI Kopi Mahasiswa + WhatsApp Gateway Otomatis
 * Route: POST /api/kopi-mahasiswa/process
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userMessage, customerPhone, orderId, totalAmount, clientRole, clientName } = body;

    let aiReply = '';
    let aiActions: any[] = [];

    // [A] Proses Logika Chatbot AI jika ada pesan pengguna
    if (userMessage) {
      try {
        const chatbotRes = await fetch('http://localhost:3000/api/ai/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userMessage }],
            clientRole: clientRole || 'PELANGGAN',
            clientName: clientName || 'Pelanggan Kopi',
          }),
        });

        if (chatbotRes.ok) {
          const chatbotData = await chatbotRes.json();
          aiReply = chatbotData.reply || '';
          aiActions = chatbotData.actions || [];
        }
      } catch (aiErr) {
        console.error('[AI Process Error]:', aiErr);
      }
    }

    // [B] Logika Kirim WhatsApp Otomatis di Background (contoh: konfirmasi pesanan)
    let whatsappStatus = 'skipped';
    if (orderId && customerPhone) {
      let cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }

      const formattedTotal = Number(totalAmount || 0).toLocaleString('id-ID');
      const waMessage = `☕ *STRUK PEMBAYARAN KOPI MAHASISWA*\n\nPesanan *${orderId}* berhasil dibuat!\nTotal Pembayaran: Rp ${formattedTotal}\nEstimasi waktu: 10–15 menit.\n\nTerima kasih telah memesan di Kopi Mahasiswa!`;

      const token = process.env.FONNTE_TOKEN || process.env.WHATSAPP_API_TOKEN;
      if (token) {
        try {
          const waRes = await fetch('https://api.fonnte.com/send', {
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
          const waData = await waRes.json();
          whatsappStatus = waData.status ? 'sent' : 'failed';
          console.log(`[WA Gateway Direct] Struk ${orderId} terkirim ke ${cleanPhone}:`, waData);
        } catch (waErr) {
          console.error('[WA Gateway Send Error]:', waErr);
          whatsappStatus = 'error';
        }
      } else {
        // Fallback: Siapkan direct link WhatsApp jika token belum diset di environment
        whatsappStatus = 'ready_link';
        aiActions.push({
          type: 'whatsapp',
          label: `📲 Kirim Struk ${orderId} via WhatsApp`,
          url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`,
          target: '_blank',
          text: waMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      actions: aiActions,
      whatsappStatus,
      message: 'AI menjawab sesuai pertanyaan dan struk WhatsApp diproses!',
    });
  } catch (error: any) {
    console.error('Terjadi kesalahan pada /api/kopi-mahasiswa/process:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses sistem.', error: error.message },
      { status: 500 }
    );
  }
}
