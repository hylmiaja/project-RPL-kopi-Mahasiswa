import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSettings, setSetting } from '@/lib/settings';

export const runtime = 'nodejs';

/**
 * GET /api/settings/ai
 * Mengambil model AI yang aktif dan status/kunci API dari masing-masing provider.
 */
export async function GET() {
  try {
    const session = await auth();
    const isPrivileged = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER';

    const settingsMap = await getSettings([
      'active_ai_model',
      'gemini_api_key',
      'gemini_model',
      'openai_api_key',
      'openai_model',
      'deepseek_api_key',
      'deepseek_model',
      'whatsapp_api_token',
    ]);

    const activeModel = settingsMap.get('active_ai_model') || 'gemini';

    // API Keys dari DB atau ENV
    const dbGeminiKey = settingsMap.get('gemini_api_key') || '';
    const envGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    const geminiKey = dbGeminiKey || envGeminiKey;

    const dbOpenaiKey = settingsMap.get('openai_api_key') || '';
    const envOpenaiKey = process.env.OPENAI_API_KEY || '';
    const openaiKey = dbOpenaiKey || envOpenaiKey;

    const dbDeepseekKey = settingsMap.get('deepseek_api_key') || '';
    const envDeepseekKey = process.env.DEEPSEEK_API_KEY || process.env.NOUS_API_KEY || '';
    const deepseekKey = dbDeepseekKey || envDeepseekKey;

    const dbWhatsAppToken = settingsMap.get('whatsapp_api_token') || '';
    const envWhatsAppToken = process.env.FONNTE_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
    const whatsappToken = dbWhatsAppToken || envWhatsAppToken;

    return NextResponse.json({
      success: true,
      model: activeModel,
      activeModel,
      whatsappGateway: {
        token: whatsappToken,
        isConfigured: Boolean(whatsappToken),
        source: dbWhatsAppToken ? 'database' : envWhatsAppToken ? 'env' : 'none',
      },
      providers: {
        gemini: {
          name: 'Google Gemini',
          apiKey: geminiKey,
          isConfigured: Boolean(geminiKey),
          source: dbGeminiKey ? 'database' : envGeminiKey ? 'env' : 'none',
          selectedModel: settingsMap.get('gemini_model') || 'gemini-2.5-flash',
          availableModels: [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Rekomendasi)' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
            { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Terbaru)' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          ],
        },
        gpt: {
          name: 'OpenAI GPT / xKiro Gateway',
          apiKey: openaiKey,
          isConfigured: Boolean(openaiKey),
          source: dbOpenaiKey ? 'database' : envOpenaiKey ? 'env' : 'none',
          selectedModel: settingsMap.get('openai_model') || (openaiKey.startsWith('sk-xt-') ? 'mistralai/mistral-large-2512' : 'gpt-4o-mini'),
          availableModels: [
            { id: 'mistralai/mistral-large-2512', name: 'Mistral Large 3 (xKiro Rekomendasi - Cepat & Cerdas)' },
            { id: 'cohere/command-r-plus-08-2024', name: 'Cohere Command R+ (xKiro Penalaran)' },
            { id: 'openai/gpt-5.6-luna', name: 'GPT-5.6 Luna (xKiro Berbayar/Saldo)' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (OpenAI Resmi)' },
            { id: 'gpt-4o', name: 'GPT-4o (OpenAI Resmi Unggulan)' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          ],
        },
        deepseek: {
          name: 'DeepSeek AI',
          apiKey: deepseekKey,
          isConfigured: Boolean(deepseekKey),
          source: dbDeepseekKey ? 'database' : envDeepseekKey ? 'env' : 'none',
          selectedModel: settingsMap.get('deepseek_model') || 'deepseek-chat',
          availableModels: [
            { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
            { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Penalaran Mendalam)' },
            { id: 'deepseek/deepseek-v4.1-flash-1017', name: 'Nous DeepSeek Flash' },
          ],
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan AI', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/ai
 * Menyimpan konfigurasi model AI aktif dan API Key masing-masing provider.
 *
 * FIX: Baca body sebagai text() dulu lalu parse JSON manual,
 * untuk menghindari bug "body already consumed" dari NextAuth auth().
 */
export async function POST(req: Request) {
  try {
    // Baca body sebagai raw text SEBELUM memanggil auth()
    // karena auth() bisa mengkonsumsi body stream di Next.js App Router
    const rawText = await req.text();

    // Validasi bahwa ada body yang dikirim
    if (!rawText || rawText.trim() === '') {
      return NextResponse.json(
        { error: 'Request body kosong. Pastikan data dikirim dalam format JSON.' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch (parseErr: any) {
      console.error('[Settings AI] JSON parse error:', parseErr.message, '| Raw:', rawText.slice(0, 200));
      return NextResponse.json(
        { error: 'Format JSON tidak valid', details: parseErr.message },
        { status: 400 }
      );
    }

    // Cek session setelah body dibaca
    const session = await auth();

    // Proteksi role: tolak jika user login tapi bukan ADMIN/OWNER
    if (session?.user?.role && session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Admin dan Owner yang dapat mengubah konfigurasi AI.' },
        { status: 403 }
      );
    }

    const activeModel = body.activeModel || body.model;

    if (activeModel && !['gemini', 'gpt', 'deepseek'].includes(activeModel)) {
      return NextResponse.json(
        { error: 'Model AI tidak valid. Pilihan: gemini, gpt, deepseek' },
        { status: 400 }
      );
    }

    const updates: Array<{ key: string; value: string }> = [];

    if (activeModel) {
      updates.push({ key: 'active_ai_model', value: activeModel });
    }

    // Simpan API Key hanya jika bukan string mask (••••) dan tidak kosong
    const isMasked = (val: string) => val.includes('••') || val.includes('\u2022\u2022');

    if (typeof body.geminiApiKey === 'string' && body.geminiApiKey.trim() && !isMasked(body.geminiApiKey)) {
      updates.push({ key: 'gemini_api_key', value: body.geminiApiKey.trim() });
    }
    if (typeof body.geminiModel === 'string' && body.geminiModel.trim()) {
      updates.push({ key: 'gemini_model', value: body.geminiModel.trim() });
    }

    if (typeof body.openaiApiKey === 'string' && body.openaiApiKey.trim() && !isMasked(body.openaiApiKey)) {
      updates.push({ key: 'openai_api_key', value: body.openaiApiKey.trim() });
    }
    if (typeof body.openaiModel === 'string' && body.openaiModel.trim()) {
      updates.push({ key: 'openai_model', value: body.openaiModel.trim() });
    }

    if (typeof body.deepseekApiKey === 'string' && body.deepseekApiKey.trim() && !isMasked(body.deepseekApiKey)) {
      updates.push({ key: 'deepseek_api_key', value: body.deepseekApiKey.trim() });
    }
    if (typeof body.deepseekModel === 'string' && body.deepseekModel.trim()) {
      updates.push({ key: 'deepseek_model', value: body.deepseekModel.trim() });
    }

    if (typeof body.whatsappToken === 'string' && body.whatsappToken.trim() && !isMasked(body.whatsappToken)) {
      updates.push({ key: 'whatsapp_api_token', value: body.whatsappToken.trim() });
    }

    // Simpan ke database
    for (const item of updates) {
      await setSetting(item.key, item.value);
    }

    console.log(`[Settings AI] Saved ${updates.length} settings. Model: ${activeModel}`);

    return NextResponse.json({
      success: true,
      message: `Pengaturan AI & API Key berhasil disimpan (${updates.length} item)`,
      activeModel: activeModel || 'gemini',
      savedKeys: updates.map(u => u.key),
    });
  } catch (error: any) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan pengaturan AI', details: error.message },
      { status: 500 }
    );
  }
}
