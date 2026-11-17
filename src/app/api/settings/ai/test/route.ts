import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSetting } from '@/lib/settings';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/settings/ai/test
 * Menguji koneksi langsung ke provider AI (Google Gemini, OpenAI GPT, DeepSeek).
 * Mengembalikan status keberhasilan, waktu latensi (ms), dan pesan respons.
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const rawText = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Request body harus berformat JSON valid.' }, { status: 400 });
    }

    const session = await auth();
    // Proteksi: Hanya Admin & Owner yang boleh menguji koneksi
    if (session?.user?.role && session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Admin dan Owner yang berwenang.' }, { status: 403 });
    }

    const provider = body.provider as 'gemini' | 'gpt' | 'deepseek';
    if (!['gemini', 'gpt', 'deepseek'].includes(provider)) {
      return NextResponse.json({ error: 'Provider tidak valid. Pilihan: gemini, gpt, deepseek' }, { status: 400 });
    }

    let inputKey = (body.apiKey || '').trim();
    const isMasked = inputKey.includes('••') || inputKey.includes('\u2022\u2022');

    // Jika key kosong atau masih masked, ambil key aktual dari database atau env
    if (!inputKey || isMasked) {
      if (provider === 'gemini') {
        inputKey = (await getSetting('gemini_api_key')) || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
      } else if (provider === 'gpt') {
        inputKey = (await getSetting('openai_api_key')) || process.env.OPENAI_API_KEY || '';
      } else if (provider === 'deepseek') {
        inputKey = (await getSetting('deepseek_api_key')) || process.env.DEEPSEEK_API_KEY || process.env.NOUS_API_KEY || '';
      }
    }

    // Deteksi jika input berisi email atau password akibat autofill browser
    if (inputKey.includes('@') && (inputKey.includes('.com') || inputKey.includes('.id') || inputKey.includes('.net'))) {
      return NextResponse.json({
        success: false,
        message: `⚠️ Terdeteksi input berupa alamat email (${inputKey}). Ini terjadi akibat autofill browser. Masukkan API Key asli yang benar.`,
      }, { status: 400 });
    }

    if (!inputKey) {
      return NextResponse.json({
        success: false,
        message: `API Key untuk ${provider.toUpperCase()} belum diatur. Masukkan API Key terlebih dahulu lalu klik Simpan atau Uji.`,
      }, { status: 400 });
    }

    // ─────────────────────────────────────────
    // 1. PENGUJIAN GOOGLE GEMINI
    // ─────────────────────────────────────────
    if (provider === 'gemini') {
      const model = body.model || (await getSetting('gemini_model')) || 'gemini-2.5-flash';
      const testModels = [model, 'gemini-2.5-flash', 'gemini-3.8-flash'];

      let lastError = '';
      for (const tryModel of testModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${inputKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Balas dengan kata "Koneksi OK" saja.' }] }],
              }),
              signal: AbortSignal.timeout(7000),
            }
          );

          if (res.status === 401 || res.status === 403) {
            const err = await res.json().catch(() => ({}));
            return NextResponse.json({
              success: false,
              message: `API Key Google Gemini ditolak (${res.status}): ${err.error?.message || 'Key tidak valid atau belum diaktifkan di Google AI Studio'}.`,
              latencyMs: Date.now() - startTime,
            });
          }

          if (res.status === 503) {
            lastError = 'Server Gemini sedang mengalami lonjakan beban sementara (503). Key valid namun provider overload.';
            continue;
          }

          if (res.status === 404) {
            lastError = `Model ${tryModel} tidak tersedia untuk versi API ini.`;
            continue;
          }

          if (res.ok) {
            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
            const latencyMs = Date.now() - startTime;
            return NextResponse.json({
              success: true,
              message: `✅ Koneksi Google Gemini Berhasil! (Model: ${tryModel}, Respon: "${reply.slice(0, 50)}")`,
              model: tryModel,
              latencyMs,
            });
          }
        } catch (fetchErr: any) {
          lastError = fetchErr.message || 'Koneksi timeout (7 detik)';
        }
      }

      return NextResponse.json({
        success: false,
        message: `Gagal terhubung ke Google Gemini: ${lastError}`,
        latencyMs: Date.now() - startTime,
      });
    }

    // ─────────────────────────────────────────
    // 2. PENGUJIAN OPENAI GPT / xKiro GATEWAY
    // ─────────────────────────────────────────
    if (provider === 'gpt') {
      const isXKiro = inputKey.startsWith('sk-xt-');
      const endpoint = isXKiro
        ? 'https://api.xkiro.com/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const configuredModel = body.model || (await getSetting('openai_model')) || 'gpt-4o-mini';
      const modelsToTry = isXKiro
        ? [configuredModel, 'mistralai/mistral-large-2512', 'cohere/command-r-plus-08-2024']
        : [configuredModel];

      let lastError = '';
      for (const model of modelsToTry) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${inputKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: 'Ping' }],
              max_tokens: 15,
            }),
            signal: AbortSignal.timeout(8000),
          });

          const latencyMs = Date.now() - startTime;
          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';
            const providerLabel = isXKiro ? 'xKiro Gateway' : 'OpenAI GPT';
            return NextResponse.json({
              success: true,
              message: `✅ Koneksi ${providerLabel} Berhasil! (Model: ${model}, Respon: "${reply.slice(0, 50)}")`,
              model,
              latencyMs,
            });
          } else {
            const errData = await res.json().catch(() => ({}));
            lastError = errData.error?.message || `HTTP ${res.status}`;
            // Jika model tidak ditemukan di xKiro atau butuh wallet, coba fallback ke model gratis xKiro
            if (isXKiro && (res.status === 404 || res.status === 403)) {
              continue;
            }
            break;
          }
        } catch (err: any) {
          lastError = err.message || 'Timeout / Network error';
        }
      }

      const latencyMs = Date.now() - startTime;
      const providerLabel = isXKiro ? 'xKiro Gateway' : 'OpenAI GPT';
      return NextResponse.json({
        success: false,
        message: `Gagal terhubung ke ${providerLabel}: ${lastError}`,
        latencyMs,
      });
    }

    // ─────────────────────────────────────────
    // 3. PENGUJIAN DEEPSEEK AI
    // ─────────────────────────────────────────
    if (provider === 'deepseek') {
      const isNous = inputKey.startsWith('sk-nous') || (body.model || '').includes('nous');
      const endpoint = isNous
        ? 'https://inference-api.nousresearch.com/v1/chat/completions'
        : 'https://api.deepseek.com/chat/completions';
      const modelName = isNous
        ? 'deepseek/deepseek-v4.1-flash-1017'
        : body.model || (await getSetting('deepseek_model')) || 'deepseek-chat';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${inputKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(7000),
        });

        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';
          return NextResponse.json({
            success: true,
            message: `✅ Koneksi DeepSeek AI Berhasil! (Model: ${modelName}, Respon: "${reply}")`,
            model: modelName,
            latencyMs,
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          return NextResponse.json({
            success: false,
            message: `Gagal terhubung ke DeepSeek AI: ${errMsg}`,
            latencyMs,
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Koneksi ke DeepSeek timeout atau gagal: ${err.message}`,
          latencyMs: Date.now() - startTime,
        });
      }
    }

    return NextResponse.json({ error: 'Provider tidak dikenali' }, { status: 400 });
  } catch (globalErr: any) {
    console.error('[AI Test Route Error]:', globalErr);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan internal saat pengujian: ${globalErr.message}`,
      latencyMs: Date.now() - startTime,
    }, { status: 500 });
  }
}

