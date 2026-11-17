"use client";

import { useState, useEffect } from "react";

interface ProviderData {
  name: string;
  apiKey: string;
  isConfigured: boolean;
  source: "database" | "env" | "none";
  selectedModel: string;
  availableModels: Array<{ id: string; name: string }>;
}

interface SettingsResponse {
  success: boolean;
  activeModel: "gemini" | "gpt" | "deepseek";
  whatsappGateway?: {
    token: string;
    isConfigured: boolean;
    source: "database" | "env" | "none";
  };
  providers: {
    gemini: ProviderData;
    gpt: ProviderData;
    deepseek: ProviderData;
  };
}

interface TestResult {
  testing: boolean;
  success?: boolean;
  message?: string;
  latencyMs?: number;
}

interface ToastNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

/** Cek apakah string tampak seperti email dari browser autofill */
function isAutofillEmail(val: string): boolean {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v.includes("@") && (v.includes(".com") || v.includes(".id") || v.includes(".net") || v.includes(".org"));
}

export function AiSettingsForm() {
  const [activeModel, setActiveModel] = useState<"gemini" | "gpt" | "deepseek">("gpt");
  const [initialActiveModel, setInitialActiveModel] = useState<"gemini" | "gpt" | "deepseek">("gpt");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Toast notifications array
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Provider info dari server
  const [providersInfo, setProvidersInfo] = useState<SettingsResponse["providers"] | null>(null);

  // Form State untuk API Keys
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiKeyDirty, setGeminiKeyDirty] = useState(false);
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [showGemini, setShowGemini] = useState(false);
  const [geminiTest, setGeminiTest] = useState<TestResult>({ testing: false });

  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiKeyDirty, setOpenaiKeyDirty] = useState(false);
  const [openaiModel, setOpenaiModel] = useState("mistralai/mistral-large-2512");
  const [showOpenai, setShowOpenai] = useState(false);
  const [openaiTest, setOpenaiTest] = useState<TestResult>({ testing: false });

  const [deepseekKey, setDeepseekKey] = useState("");
  const [deepseekKeyDirty, setDeepseekKeyDirty] = useState(false);
  const [deepseekModel, setDeepseekModel] = useState("deepseek-chat");
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [deepseekTest, setDeepseekTest] = useState<TestResult>({ testing: false });

  // WhatsApp Gateway API Token State
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappTokenDirty, setWhatsappTokenDirty] = useState(false);
  const [showWhatsappToken, setShowWhatsappToken] = useState(false);
  const [whatsappSource, setWhatsappSource] = useState<"database" | "env" | "none">("none");

  // Tab filter untuk skill AI
  const [skillFilter, setSkillFilter] = useState<"all" | "important" | "recommended">("all");

  const addToast = (type: ToastNotification["type"], title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/ai", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data pengaturan AI");
      const data: SettingsResponse = await res.json();

      if (data.activeModel) {
        setActiveModel(data.activeModel);
        setInitialActiveModel(data.activeModel);
      }
      if (data.providers) {
        setProvidersInfo(data.providers);

        // Isi field dengan API key aktual dari database agar admin BISA MELIHAT & MENGGANTINYA
        setGeminiKey(data.providers.gemini.apiKey || "");
        setGeminiKeyDirty(false);
        setGeminiModel(data.providers.gemini.selectedModel || "gemini-2.5-flash");

        setOpenaiKey(data.providers.gpt.apiKey || "");
        setOpenaiKeyDirty(false);
        setOpenaiModel(data.providers.gpt.selectedModel || "mistralai/mistral-large-2512");

        setDeepseekKey(data.providers.deepseek.apiKey || "");
        setDeepseekKeyDirty(false);
        setDeepseekModel(data.providers.deepseek.selectedModel || "deepseek-chat");
      }

      if (data.whatsappGateway) {
        setWhatsappToken(data.whatsappGateway.token || "");
        setWhatsappSource(data.whatsappGateway.source || "none");
        setWhatsappTokenDirty(false);
      }
    } catch (err: any) {
      console.error(err);
      addToast("error", "Gagal Memuat", err.message || "Gagal memuat pengaturan AI");
    } finally {
      setLoading(false);
    }
  };

  // Handler Salin Key ke Clipboard
  const handleCopyKey = (key: string, providerName: string) => {
    if (!key) {
      addToast("info", "Key Kosong", `Belum ada API Key untuk ${providerName}.`);
      return;
    }
    navigator.clipboard.writeText(key);
    addToast("success", "Berhasil Disalin! 📋", `API Key ${providerName} telah disalin ke clipboard.`);
  };

  // Handler Tempel Key dari Clipboard (Satu Klik Tempel)
  const handlePasteKey = async (
    setter: (val: string) => void,
    dirtySetter: (val: boolean) => void,
    providerName: string
  ) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setter(text.trim());
        dirtySetter(true);
        addToast("success", "Key Berhasil Ditempel! 📋", `API Key baru untuk ${providerName} telah dimasukkan.`);
      } else {
        addToast("info", "Clipboard Kosong", "Tidak ada teks yang dapat disalin dari clipboard.");
      }
    } catch {
      addToast("info", "Gunakan Shortcut", "Silakan klik kolom input lalu tekan Ctrl+V untuk menempelkan key.");
    }
  };

  // Handler Uji Koneksi Langsung ke Provider
  const handleTestConnection = async (provider: "gemini" | "gpt" | "deepseek") => {
    let currentKey = "";
    let currentModel = "";
    let setTestState: React.Dispatch<React.SetStateAction<TestResult>>;

    if (provider === "gemini") {
      currentKey = geminiKey;
      currentModel = geminiModel;
      setTestState = setGeminiTest;
    } else if (provider === "gpt") {
      currentKey = openaiKey;
      currentModel = openaiModel;
      setTestState = setOpenaiTest;
    } else {
      currentKey = deepseekKey;
      currentModel = deepseekModel;
      setTestState = setDeepseekTest;
    }

    if (isAutofillEmail(currentKey)) {
      addToast("error", "Autofill Terdeteksi", "Input berisi alamat email browser autofill. Bersihkan kolom dan masukkan API key asli.");
      return;
    }

    setTestState({ testing: true });
    addToast("info", "Menguji Koneksi...", `Menghubungi server ${provider.toUpperCase()}...`);

    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: currentKey,
          model: currentModel,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setTestState({
          testing: false,
          success: true,
          message: result.message,
          latencyMs: result.latencyMs,
        });
        addToast("success", "Koneksi Berhasil! ⚡", `${result.message} (${result.latencyMs} ms)`);
      } else {
        setTestState({
          testing: false,
          success: false,
          message: result.message || "Gagal terhubung.",
          latencyMs: result.latencyMs,
        });
        addToast("error", "Koneksi Gagal", result.message || "Gagal menghubungi API provider.");
      }
    } catch (err: any) {
      setTestState({
        testing: false,
        success: false,
        message: err.message || "Network error",
      });
      addToast("error", "Uji Koneksi Gagal", err.message || "Terjadi kesalahan jaringan.");
    }
  };

  // Handler Simpan Seluruh Perubahan
  const handleSaveAll = async () => {
    if (isAutofillEmail(geminiKey)) {
      addToast("error", "Peringatan Autofill", "Kolom Gemini berisi alamat email! Hapus dan masukkan API Key Google AI Studio Anda.");
      return;
    }
    if (isAutofillEmail(openaiKey)) {
      addToast("error", "Peringatan Autofill", "Kolom OpenAI berisi email! Hapus dan masukkan API Key OpenAI Anda.");
      return;
    }
    if (isAutofillEmail(deepseekKey)) {
      addToast("error", "Peringatan Autofill", "Kolom DeepSeek berisi email! Hapus dan masukkan API Key DeepSeek Anda.");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, string> = {
        activeModel,
        geminiModel,
        openaiModel,
        deepseekModel,
      };

      if (geminiKey.trim()) payload.geminiApiKey = geminiKey.trim();
      if (openaiKey.trim()) payload.openaiApiKey = openaiKey.trim();
      if (deepseekKey.trim()) payload.deepseekApiKey = deepseekKey.trim();
      if (whatsappToken.trim()) payload.whatsappToken = whatsappToken.trim();

      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.details || result.error || "Gagal menyimpan konfigurasi");
      }

      const activeName =
        activeModel === "gemini"
          ? "Google Gemini"
          : activeModel === "gpt"
          ? "OpenAI GPT / xKiro"
          : "DeepSeek AI";

      addToast("success", "Pengaturan Tersimpan! ✅", `Model aktif saat ini: ${activeName}. Perubahan berlaku instan ke chatbot.`);
      fetchSettings();
    } catch (err: any) {
      console.error(err);
      addToast("error", "Gagal Menyimpan", err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // Cek apakah ada perubahan yang belum disimpan
  const isAnyDirty =
    geminiKeyDirty ||
    openaiKeyDirty ||
    deepseekKeyDirty ||
    whatsappTokenDirty ||
    activeModel !== initialActiveModel;

  // Daftar Registry Skill AI Barista
  const AI_SKILLS = [
    {
      id: "inventory",
      icon: "📦",
      title: "Live Inventory & Peringatan Stok Kritis",
      category: "important",
      badge: "PENTING & REKOMENDASI",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      desc: "Memantau sisa stok bahan baku kopi, susu, sirup real-time. Mendeteksi stok di bawah batas minimal dan membuat tombol kirim laporan instan ke WhatsApp Petugas Stok (REVAN) & Owner.",
      samplePrompt: "berapa stok susu full cream?",
    },
    {
      id: "users",
      icon: "👥",
      title: "User Management & Direktori Staf Kedai",
      category: "important",
      badge: "PENTING & REKOMENDASI",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      desc: "Mengetahui detail 5 personil kedai (1 Owner, 1 Admin, 2 Kasir, 1 Petugas Stok) serta seluruh pelanggan. Memeriksa wewenang RBAC dan menjawab pertanyaan personil.",
      samplePrompt: "berapa petugas stok disini?",
    },
    {
      id: "po",
      icon: "🚚",
      title: "Purchase Order (PO) & Vendor Tracking",
      category: "important",
      badge: "PENTING & REKOMENDASI",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      desc: "Melacak transaksi PO pengadaan bahan baku, status barang (Draft/Sent/Received), rincian pesanan bahan, serta kontak vendor/supplier terdaftar.",
      samplePrompt: "berapa jumlah po di database?",
    },
    {
      id: "finance",
      icon: "🧾",
      title: "Financial & Sales Analytics (Omset & Pesanan)",
      category: "important",
      badge: "PENTING & REKOMENDASI",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      desc: "Menghitung total transaksi pesanan, pesanan pending/selesai, rekapitulasi omset, nota belanja, dan rata-rata pengeluaran pelanggan per pesanan secara presisi.",
      samplePrompt: "berapa total pesanan?",
    },
    {
      id: "recipes",
      icon: "☕",
      title: "Smart Barista & Resep Komposisi Menu",
      category: "important",
      badge: "PENTING",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      desc: "Katalog produk lengkap, komposisi takaran gramasi bahan baku, perhitungan HPP per menu, dan rekomendasi minuman sesuai selera pengunjung kedai.",
      samplePrompt: "berapa harga Vanilla Latte?",
    },
    {
      id: "page_reader",
      icon: "🌐",
      title: "Web Page Context Awareness (DOM Reader)",
      category: "recommended",
      badge: "BARU & REKOMENDASI",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      desc: "Chatbot otomatis membaca URL dan isi teks halaman web yang sedang dibuka pengunjung, memungkinkan asisten menjawab pertanyaan spesifik halaman yang sedang dilihat.",
      samplePrompt: "halaman apa yang sedang saya buka sekarang?",
    },
    {
      id: "rewards",
      icon: "🎟️",
      title: "Promo Aktif & Poin Loyalitas Pelanggan",
      category: "recommended",
      badge: "REKOMENDASI",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      desc: "Menjelaskan promo diskon aktif kedai, kalkulasi poin reward pelanggan setia, dan syarat penukaran voucher potongan harga.",
      samplePrompt: "promo apa saja yang sedang aktif?",
    },
    {
      id: "schedules",
      icon: "🕒",
      title: "Jadwal Operasional & Monitoring Shift Kasir",
      category: "recommended",
      badge: "REKOMENDASI",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      desc: "Memberikan jadwal operasional kedai per hari, jam buka/tutup, fasilitas study space (Wi-Fi, colokan), dan shift aktif kasir.",
      samplePrompt: "jam berapa kedai kopi mahasiswa buka dan tutup?",
    },
  ];

  const filteredSkills = AI_SKILLS.filter((s) => {
    if (skillFilter === "important") return s.category === "important";
    if (skillFilter === "recommended") return s.category === "recommended";
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-amber-900">
        <div className="animate-spin w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold">Memuat konfigurasi AI & Model Switcher...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Notification Container (Floating) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all animate-in slide-in-from-top-2 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-blue-50 border-blue-300 text-blue-900"
            }`}
          >
            <span className="text-xl">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : toast.type === "warning" ? "⚠️" : "ℹ️"}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-60 hover:opacity-100 px-1 font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* HEADER BANNER: Warm Premium Coffee Theme */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white rounded-3xl p-7 sm:p-9 shadow-lg relative overflow-hidden border border-amber-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 text-9xl opacity-10 pointer-events-none select-none">
          ☕
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
              <span>🤖</span> Panel Kontrol AI Barista
            </span>
            <span className="text-xs text-amber-200/80 font-medium">Multi-Model Engine Switcher & Live API Testing</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Model Aktif: {activeModel === "gpt" ? "xKiro Gateway (Mistral/Cohere/GPT)" : activeModel === "gemini" ? "Google Gemini" : "DeepSeek AI"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Konfigurasi Model AI, API Key & Tujuan
          </h1>

          <p className="text-amber-100/80 text-sm sm:text-base max-w-3xl leading-relaxed">
            Kelola kecerdasan buatan kedai Kopi Mahasiswa. Anda dapat <strong>melihat, mengganti, dan menguji koneksi API Key secara langsung</strong>, serta menentukan model utama untuk melayani pelanggan dan staf secara otomatis.
          </p>
        </div>
      </div>

      {/* SECTION 1: Pilih AI Model Aktif beserta Tujuan Model */}
      <div className="bg-white rounded-3xl border border-amber-100/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-950 flex items-center gap-2">
              <span>🎯</span> 1. Pilih Model AI Aktif & Pahami Tujuannya
            </h2>
            <p className="text-xs text-amber-800/60 mt-1">
              Klik salah satu kartu untuk mengaktifkan engine utama. Chatbot memprioritaskan model aktif untuk melayani pelanggan & staf.
            </p>
          </div>
          {activeModel !== initialActiveModel && (
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full animate-pulse self-start sm:self-auto">
              ● Pilihan Berubah (Klik Simpan di Bawah)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Google Gemini */}
          <div
            onClick={() => setActiveModel("gemini")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between relative ${
              activeModel === "gemini"
                ? "bg-gradient-to-b from-amber-50/90 to-amber-100/50 border-amber-600 shadow-md ring-4 ring-amber-500/10"
                : "bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 shadow-xs hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
                  ✨
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="active_model_picker"
                    value="gemini"
                    checked={activeModel === "gemini"}
                    onChange={() => setActiveModel("gemini")}
                    className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-amber-950 text-lg">Google Gemini</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold">
                  Tercepat
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Gemini 2.5 Flash / 1.5 Pro. Respon ekstra cepat (&lt;300ms), hemat token, dan sangat fasih percakapan bahasa Indonesia.
              </p>

              {/* Kotak Tujuan Model */}
              <div className="mt-4 p-3.5 rounded-xl bg-white/90 border border-amber-200/80 text-xs text-gray-700 space-y-1.5 shadow-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1">
                  <span>🎯</span> Tujuan & Keunggulan:
                </div>
                <p className="leading-relaxed">• Respon paling cepat untuk obrolan langsung pelanggan di web.</p>
                <p className="leading-relaxed">• Kuota gratis Google AI Studio besar & stabil untuk operasional harian.</p>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className={`font-semibold ${providersInfo?.gemini.isConfigured ? "text-emerald-700" : "text-gray-400"}`}>
                {providersInfo?.gemini.isConfigured ? "🟢 Key Siap" : "⚪ Belum Ada Key"}
              </span>
              {activeModel === "gemini" ? (
                <span className="px-3 py-1 rounded-full bg-amber-700 text-white font-extrabold text-[11px] shadow-xs">
                  ✓ AKTIF SEKARANG
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 hover:text-amber-800 font-semibold">Klik untuk pilih</span>
              )}
            </div>
          </div>

          {/* Card 2: OpenAI GPT & xKiro Gateway */}
          <div
            onClick={() => setActiveModel("gpt")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between relative ${
              activeModel === "gpt"
                ? "bg-gradient-to-b from-amber-50/90 to-amber-100/50 border-amber-600 shadow-md ring-4 ring-amber-500/10"
                : "bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 shadow-xs hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-2xl shadow-xs">
                  🧠
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="active_model_picker"
                    value="gpt"
                    checked={activeModel === "gpt"}
                    onChange={() => setActiveModel("gpt")}
                    className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-amber-950 text-lg">OpenAI & xKiro</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-extrabold">
                  xKiro Gateway & Cerdas
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Mendukung xKiro Gateway (Mistral Large 3, Cohere, GPT) dan OpenAI resmi (GPT-4o). Fleksibel dan penalaran mendalam.
              </p>

              {/* Kotak Tujuan Model */}
              <div className="mt-4 p-3.5 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-gray-700 space-y-1.5 shadow-xs">
                <div className="font-bold text-blue-900 flex items-center gap-1">
                  <span>🎯</span> Tujuan & Keunggulan:
                </div>
                <p className="leading-relaxed">• Mendukung key xKiro (<code className="text-blue-800 font-mono font-bold">sk-xt-...</code>) & OpenAI.</p>
                <p className="leading-relaxed">• Sangat fasih menjawab menu, resep, omset, dan kalkulasi stok.</p>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className={`font-semibold ${providersInfo?.gpt.isConfigured ? "text-emerald-700" : "text-gray-400"}`}>
                {providersInfo?.gpt.isConfigured ? "🟢 Key Siap" : "⚪ Belum Ada Key"}
              </span>
              {activeModel === "gpt" ? (
                <span className="px-3 py-1 rounded-full bg-amber-700 text-white font-extrabold text-[11px] shadow-xs">
                  ✓ AKTIF SEKARANG
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 hover:text-amber-800 font-semibold">Klik untuk pilih</span>
              )}
            </div>
          </div>

          {/* Card 3: DeepSeek AI */}
          <div
            onClick={() => setActiveModel("deepseek")}
            className={`cursor-pointer rounded-2xl p-6 border-2 transition-all flex flex-col justify-between relative ${
              activeModel === "deepseek"
                ? "bg-gradient-to-b from-amber-50/90 to-amber-100/50 border-amber-600 shadow-md ring-4 ring-amber-500/10"
                : "bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 shadow-xs hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 border border-indigo-200 flex items-center justify-center text-2xl shadow-xs">
                  ⚡
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="active_model_picker"
                    value="deepseek"
                    checked={activeModel === "deepseek"}
                    onChange={() => setActiveModel("deepseek")}
                    className="w-5 h-5 text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-amber-950 text-lg">DeepSeek AI</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 font-extrabold">
                  Hemat & Analitis
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                DeepSeek V3 / R1 / Nous Inference. Kecerdasan open reasoning, tajam dalam analisis keuangan, resep, dan hemat biaya.
              </p>

              {/* Kotak Tujuan Model */}
              <div className="mt-4 p-3.5 rounded-xl bg-white/90 border border-purple-200/80 text-xs text-gray-700 space-y-1.5 shadow-xs">
                <div className="font-bold text-purple-900 flex items-center gap-1">
                  <span>🎯</span> Tujuan & Keunggulan:
                </div>
                <p className="leading-relaxed">• Kalkulasi finansial & HPP bahan baku paling presisi.</p>
                <p className="leading-relaxed">• Biaya token paling ekonomis untuk analitik data kedai.</p>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
              <span className={`font-semibold ${providersInfo?.deepseek.isConfigured ? "text-emerald-700" : "text-gray-400"}`}>
                {providersInfo?.deepseek.isConfigured ? "🟢 Key Siap" : "⚪ Belum Ada Key"}
              </span>
              {activeModel === "deepseek" ? (
                <span className="px-3 py-1 rounded-full bg-amber-700 text-white font-extrabold text-[11px] shadow-xs">
                  ✓ AKTIF SEKARANG
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 hover:text-amber-800 font-semibold">Klik untuk pilih</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Konfigurasi & Manajemen API Key (Bisa Lihat, Ubah, Salin & Uji Langsung) */}
      <div className="bg-white rounded-3xl border border-amber-100/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-950 flex items-center gap-2">
              <span>🔑</span> 2. Manajemen API Key (Bisa Dilihat & Diganti Kapan Saja)
            </h2>
            <p className="text-xs text-amber-800/60 mt-1">
              Klik <strong>👁️ Lihat</strong> untuk menampilkan key asli secara transparan, atau <strong>📋 Tempel</strong> untuk mengganti key langsung dari clipboard Anda.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Simpan Semua Perubahan</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden dummy inputs to absorb aggressive browser password manager autofill */}
        <div className="hidden" aria-hidden="true">
          <input type="text" name="km_dummy_email_sink" tabIndex={-1} autoComplete="off" />
          <input type="password" name="km_dummy_pass_sink" tabIndex={-1} autoComplete="off" />
        </div>

        {/* ────────────────── 1. OPENAI GPT / xKiro ROW ────────────────── */}
        <div className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
          activeModel === "gpt" ? "bg-amber-50/30 border-amber-300 shadow-sm" : "bg-slate-50/60 border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2.5 bg-blue-100 rounded-xl">🧠</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-amber-950">OpenAI GPT & xKiro Gateway API Key</h3>
                  {activeModel === "gpt" && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      ★ ENGINE AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dapatkan di xKiro Gateway (<a href="https://api.xkiro.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">api.xkiro.com</a>) atau OpenAI (<a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">platform.openai.com</a>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {providersInfo?.gpt.source === "database" && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  ✓ Tersimpan di Database
                </span>
              )}
              {openaiKeyDirty && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                  ● Ada Perubahan
                </span>
              )}
            </div>
          </div>

          {/* Warning autofill */}
          {isAutofillEmail(openaiKey) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between">
              <span>⚠️ <strong>Autofill Terdeteksi:</strong> Kolom ini terisi ({openaiKey}). Klik tombol bersihkan di kanan lalu masukkan API Key asli.</span>
              <button
                type="button"
                onClick={() => { setOpenaiKey(""); setOpenaiKeyDirty(true); }}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold"
              >
                Bersihkan Kolom
              </button>
            </div>
          )}

          {/* Baris Input API Key & Kontrol Aksi (Lihat, Salin, Tempel, Ganti) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔑</span> Kunci API:
                {showOpenai ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    👁️ Mode Terlihat (Plain Text)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    🔒 Disamarkan (••••••••)
                  </span>
                )}
              </span>

              {/* Tombol Cepat Aksi Key */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title={showOpenai ? "Sembunyikan Key" : "Tampilkan Key Asli"}
                >
                  <span>{showOpenai ? "🔒 Tutup" : "👁️ Lihat Key"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyKey(openaiKey, "OpenAI / xKiro")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title="Salin Key ke Clipboard"
                >
                  <span>📋 Salin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteKey(setOpenaiKey, setOpenaiKeyDirty, "OpenAI / xKiro")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center gap-1"
                  title="Tempel dari Clipboard"
                >
                  <span>📋 Tempel</span>
                </button>
                {openaiKey && (
                  <button
                    type="button"
                    onClick={() => { setOpenaiKey(""); setOpenaiKeyDirty(true); }}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    title="Kosongkan kolom untuk ganti key baru"
                  >
                    ✕ Ganti
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  style={!showOpenai ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
                  name="km_openai_token_custom_field"
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    setOpenaiKeyDirty(true);
                  }}
                  placeholder="Masukkan API Key (sk-xt-... dari xKiro atau sk-proj-... dari OpenAI)"
                  className={`w-full rounded-xl px-4 py-3 text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    showOpenai ? "bg-white text-slate-900 border-amber-400 font-semibold shadow-inner" : "bg-white text-slate-700 border-gray-300"
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={openaiModel}
                  onChange={(e) => {
                    setOpenaiModel(e.target.value);
                    setOpenaiKeyDirty(true);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                >
                  <option value="mistralai/mistral-large-2512">Mistral Large 3 (xKiro Rekomendasi)</option>
                  <option value="cohere/command-r-plus-08-2024">Cohere Command R+ (xKiro Penalaran)</option>
                  <option value="openai/gpt-5.6-luna">GPT-5.6 Luna (xKiro Berbayar/Saldo)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (OpenAI Resmi)</option>
                  <option value="gpt-4o">GPT-4o (OpenAI Unggulan)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>

                <button
                  type="button"
                  disabled={openaiTest.testing || !openaiKey}
                  onClick={() => handleTestConnection("gpt")}
                  className="whitespace-nowrap px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
                  title="Uji koneksi API langsung"
                >
                  {openaiTest.testing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>⚡ Tes</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hasil Pengujian Langsung */}
          {openaiTest.message && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              openaiTest.success ? "bg-emerald-50 border border-emerald-300 text-emerald-900" : "bg-rose-50 border border-rose-300 text-rose-900"
            }`}>
              <span>{openaiTest.success ? "✅" : "❌"}</span>
              <span>{openaiTest.message} {openaiTest.latencyMs ? `(${openaiTest.latencyMs} ms)` : ""}</span>
            </div>
          )}
        </div>

        {/* ────────────────── 2. GOOGLE GEMINI ROW ────────────────── */}
        <div className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
          activeModel === "gemini" ? "bg-amber-50/30 border-amber-300 shadow-sm" : "bg-slate-50/60 border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2.5 bg-amber-100 rounded-xl">✨</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-amber-950">Google Gemini API Key</h3>
                  {activeModel === "gemini" && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      ★ ENGINE AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dapatkan di Google AI Studio (<a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-amber-800 underline font-semibold">aistudio.google.com</a>)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {providersInfo?.gemini.source === "database" && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  ✓ Tersimpan di Database
                </span>
              )}
              {geminiKeyDirty && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                  ● Ada Perubahan
                </span>
              )}
            </div>
          </div>

          {/* Warning autofill */}
          {isAutofillEmail(geminiKey) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between">
              <span>⚠️ <strong>Autofill Terdeteksi:</strong> Kolom ini terisi ({geminiKey}). Klik tombol bersihkan di kanan lalu masukkan API Key asli.</span>
              <button
                type="button"
                onClick={() => { setGeminiKey(""); setGeminiKeyDirty(true); }}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold"
              >
                Bersihkan Kolom
              </button>
            </div>
          )}

          {/* Baris Input API Key & Kontrol Aksi (Lihat, Salin, Tempel, Ganti) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔑</span> Kunci API:
                {showGemini ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    👁️ Mode Terlihat (Plain Text)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    🔒 Disamarkan (••••••••)
                  </span>
                )}
              </span>

              {/* Tombol Cepat Aksi Key */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title={showGemini ? "Sembunyikan Key" : "Tampilkan Key Asli"}
                >
                  <span>{showGemini ? "🔒 Tutup" : "👁️ Lihat Key"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyKey(geminiKey, "Google Gemini")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title="Salin Key ke Clipboard"
                >
                  <span>📋 Salin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteKey(setGeminiKey, setGeminiKeyDirty, "Google Gemini")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors flex items-center gap-1"
                  title="Tempel dari Clipboard"
                >
                  <span>📋 Tempel</span>
                </button>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={() => { setGeminiKey(""); setGeminiKeyDirty(true); }}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    title="Kosongkan kolom untuk ganti key baru"
                  >
                    ✕ Ganti
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  style={!showGemini ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
                  name="km_gemini_token_custom_field"
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    setGeminiKeyDirty(true);
                  }}
                  placeholder="Masukkan API Key Google Gemini (AIzaSy...)"
                  className={`w-full rounded-xl px-4 py-3 text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    showGemini ? "bg-white text-slate-900 border-amber-400 font-semibold shadow-inner" : "bg-white text-slate-700 border-gray-300"
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={geminiModel}
                  onChange={(e) => {
                    setGeminiModel(e.target.value);
                    setGeminiKeyDirty(true);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Paling Cepat)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Penalaran Penuh)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Terbaru)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>

                <button
                  type="button"
                  disabled={geminiTest.testing || !geminiKey}
                  onClick={() => handleTestConnection("gemini")}
                  className="whitespace-nowrap px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
                  title="Uji koneksi API langsung"
                >
                  {geminiTest.testing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>⚡ Tes</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hasil Pengujian Langsung */}
          {geminiTest.message && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              geminiTest.success ? "bg-emerald-50 border border-emerald-300 text-emerald-900" : "bg-rose-50 border border-rose-300 text-rose-900"
            }`}>
              <span>{geminiTest.success ? "✅" : "❌"}</span>
              <span>{geminiTest.message} {geminiTest.latencyMs ? `(${geminiTest.latencyMs} ms)` : ""}</span>
            </div>
          )}
        </div>

        {/* ────────────────── 3. DEEPSEEK AI ROW ────────────────── */}
        <div className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
          activeModel === "deepseek" ? "bg-amber-50/30 border-amber-300 shadow-sm" : "bg-slate-50/60 border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2.5 bg-indigo-100 rounded-xl">⚡</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-amber-950">DeepSeek AI API Key</h3>
                  {activeModel === "deepseek" && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      ★ ENGINE AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dapatkan di DeepSeek Platform atau Nous Research API
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {providersInfo?.deepseek.source === "database" && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  ✓ Tersimpan di Database
                </span>
              )}
              {deepseekKeyDirty && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                  ● Ada Perubahan
                </span>
              )}
            </div>
          </div>

          {/* Warning autofill */}
          {isAutofillEmail(deepseekKey) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between">
              <span>⚠️ <strong>Autofill Terdeteksi:</strong> Kolom ini terisi ({deepseekKey}). Klik tombol bersihkan di kanan lalu masukkan API Key asli.</span>
              <button
                type="button"
                onClick={() => { setDeepseekKey(""); setDeepseekKeyDirty(true); }}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold"
              >
                Bersihkan Kolom
              </button>
            </div>
          )}

          {/* Baris Input API Key & Kontrol Aksi (Lihat, Salin, Tempel, Ganti) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔑</span> Kunci API:
                {showDeepseek ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    👁️ Mode Terlihat (Plain Text)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    🔒 Disamarkan (••••••••)
                  </span>
                )}
              </span>

              {/* Tombol Cepat Aksi Key */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowDeepseek(!showDeepseek)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title={showDeepseek ? "Sembunyikan Key" : "Tampilkan Key Asli"}
                >
                  <span>{showDeepseek ? "🔒 Tutup" : "👁️ Lihat Key"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyKey(deepseekKey, "DeepSeek")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title="Salin Key ke Clipboard"
                >
                  <span>📋 Salin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteKey(setDeepseekKey, setDeepseekKeyDirty, "DeepSeek")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 transition-colors flex items-center gap-1"
                  title="Tempel dari Clipboard"
                >
                  <span>📋 Tempel</span>
                </button>
                {deepseekKey && (
                  <button
                    type="button"
                    onClick={() => { setDeepseekKey(""); setDeepseekKeyDirty(true); }}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    title="Kosongkan kolom untuk ganti key baru"
                  >
                    ✕ Ganti
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  style={!showDeepseek ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
                  name="km_deepseek_token_custom_field"
                  autoComplete="off"
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={deepseekKey}
                  onChange={(e) => {
                    setDeepseekKey(e.target.value);
                    setDeepseekKeyDirty(true);
                  }}
                  placeholder="Masukkan DeepSeek / Nous API Key (sk-... atau sk-nous-...)"
                  className={`w-full rounded-xl px-4 py-3 text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                    showDeepseek ? "bg-white text-slate-900 border-amber-400 font-semibold shadow-inner" : "bg-white text-slate-700 border-gray-300"
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={deepseekModel}
                  onChange={(e) => {
                    setDeepseekModel(e.target.value);
                    setDeepseekKeyDirty(true);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                >
                  <option value="deepseek-chat">DeepSeek V3 (Chat)</option>
                  <option value="deepseek-reasoner">DeepSeek R1 (Penalaran Mendalam)</option>
                  <option value="deepseek/deepseek-v4.1-flash-1017">Nous DeepSeek Flash</option>
                </select>

                <button
                  type="button"
                  disabled={deepseekTest.testing || !deepseekKey}
                  onClick={() => handleTestConnection("deepseek")}
                  className="whitespace-nowrap px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
                  title="Uji koneksi API langsung"
                >
                  {deepseekTest.testing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>⚡ Tes</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hasil Pengujian Langsung */}
          {deepseekTest.message && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              deepseekTest.success ? "bg-emerald-50 border border-emerald-300 text-emerald-900" : "bg-rose-50 border border-rose-300 text-rose-900"
            }`}>
              <span>{deepseekTest.success ? "✅" : "❌"}</span>
              <span>{deepseekTest.message} {deepseekTest.latencyMs ? `(${deepseekTest.latencyMs} ms)` : ""}</span>
            </div>
          )}
        </div>

        {/* ────────────────── 4. WHATSAPP GATEWAY ROW ────────────────── */}
        <div className="p-6 rounded-2xl border-2 border-green-200 bg-green-50/30 transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2.5 bg-green-100 rounded-xl">📲</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-amber-950">WhatsApp Gateway API Token (Fonnte Auto-Send)</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-600 text-white">
                    Direct WA Gateway
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dapatkan token di Fonnte (<a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-green-700 underline font-semibold">fonnte.com</a>). Struk checkout kasir/pelanggan & kode OTP akan otomatis terkirim langsung ke nomor WhatsApp tanpa membuka browser.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {whatsappSource === "database" && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  ✓ Tersimpan di Database
                </span>
              )}
              {whatsappSource === "env" && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                  ✓ Dari Environment (.env)
                </span>
              )}
              {whatsappTokenDirty && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                  ● Ada Perubahan
                </span>
              )}
            </div>
          </div>

          {/* Baris Input Token WhatsApp & Kontrol Aksi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-bold flex items-center gap-1.5">
                <span>🔑</span> Token WhatsApp:
                {showWhatsappToken ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    👁️ Mode Terlihat (Plain Text)
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    🔒 Disamarkan (••••••••)
                  </span>
                )}
              </span>

              {/* Tombol Cepat Aksi Key */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowWhatsappToken(!showWhatsappToken)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title={showWhatsappToken ? "Sembunyikan Token" : "Tampilkan Token Asli"}
                >
                  <span>{showWhatsappToken ? "🔒 Tutup" : "👁️ Lihat Token"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyKey(whatsappToken, "WhatsApp Gateway")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1"
                  title="Salin Token"
                >
                  <span>📋 Salin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePasteKey(setWhatsappToken, setWhatsappTokenDirty, "WhatsApp Gateway")}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-green-300 bg-green-50 hover:bg-green-100 text-green-800 transition-colors flex items-center gap-1"
                  title="Tempel dari Clipboard"
                >
                  <span>📋 Tempel</span>
                </button>
                {whatsappToken && (
                  <button
                    type="button"
                    onClick={() => { setWhatsappToken(""); setWhatsappTokenDirty(true); }}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                    title="Kosongkan kolom untuk ganti token baru"
                  >
                    ✕ Ganti
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                style={!showWhatsappToken ? ({ WebkitTextSecurity: "disc" } as React.CSSProperties) : undefined}
                name="km_wa_gateway_token_field"
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={whatsappToken}
                onChange={(e) => {
                  setWhatsappToken(e.target.value);
                  setWhatsappTokenDirty(true);
                }}
                placeholder="Masukkan Token API WhatsApp Fonnte (Contoh: xK_91823...)"
                className={`w-full rounded-xl px-4 py-3 text-sm font-mono border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                  showWhatsappToken ? "bg-white text-slate-900 border-green-400 font-semibold shadow-inner" : "bg-white text-slate-700 border-green-200"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Tombol Simpan Perubahan Utama */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span>💡</span>
            <span>Perubahan API Key dan Model langsung tersimpan permanen ke database MySQL Laragon.</span>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Simpan Perubahan Model & API Key</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 3: Registry & Rekomendasi Skill AI Barista (Lengkap & Terstruktur) */}
      <div className="bg-white rounded-3xl border border-amber-100/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <h2 className="text-xl font-bold text-amber-950">
                3. Daftar Skill & Kemampuan AI Barista Kopi Mahasiswa
              </h2>
            </div>
            <p className="text-xs text-amber-800/60 mt-1">
              Seluruh keahlian cerdas yang tertanam di sistem chatbot kedai. Skill bertanda [PENTING] adalah kapabilitas inti operasional bisnis.
            </p>
          </div>

          {/* Filter Tab Kategori Skill */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSkillFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                skillFilter === "all" ? "bg-white text-amber-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Semua ({AI_SKILLS.length})
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter("important")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                skillFilter === "important" ? "bg-white text-amber-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Wajib & Penting (5)
            </button>
            <button
              type="button"
              onClick={() => setSkillFilter("recommended")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                skillFilter === "recommended" ? "bg-white text-amber-950 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Rekomendasi (3)
            </button>
          </div>
        </div>

        {/* Grid Kartu Skill */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-5 rounded-2xl bg-stone-50/60 border border-stone-200/80 hover:bg-amber-50/30 hover:border-amber-300 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-stone-200/60">
                      {skill.icon}
                    </span>
                    <h3 className="font-bold text-amber-950 text-sm group-hover:text-amber-800 transition-colors">
                      {skill.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${skill.badgeColor}`}>
                    {skill.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pl-1">
                  {skill.desc}
                </p>
              </div>

              {/* Sample Prompt Box */}
              <div className="pt-2 border-t border-stone-200/60">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span className="font-semibold">Contoh Pertanyaan ke AI:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(skill.samplePrompt);
                      addToast("info", "Contoh Disalin! 📋", `"${skill.samplePrompt}" siap ditempel di chatbot.`);
                    }}
                    className="text-amber-700 hover:text-amber-900 font-bold hover:underline"
                  >
                    Salin Contoh
                  </button>
                </div>
                <div className="p-2 rounded-xl bg-white border border-stone-200 text-xs text-amber-900 font-mono italic">
                  &quot;{skill.samplePrompt}&quot;
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Save Notification Bar when changes exist */}
      {isAnyDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-amber-950/95 text-white border-2 border-amber-400 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-6 backdrop-blur-md animate-in slide-in-from-bottom-3 max-w-lg w-full">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div className="text-xs font-semibold">
              <p className="font-bold text-amber-200">Ada Perubahan yang Belum Disimpan</p>
              <p className="text-[11px] opacity-80">Klik tombol simpan agar perubahan aktif ke chatbot.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all whitespace-nowrap disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "💾 Simpan Sekarang"}
          </button>
        </div>
      )}
    </div>
  );
}
