'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Coffee,
  ShieldCheck,
  Share2,
  Mail,
  Bell,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { triggerTopNotification } from '@/components/layout/TopNotificationBar';

export interface ActionButton {
  type: 'whatsapp' | 'email';
  label: string;
  url: string;
  target?: string;
  text?: string;
  subject?: string;
}

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionButton[];
};

interface LatestOrder {
  orderCode: string;
  total: number;
  items?: Array<{ name: string; qty: number; price: number }>;
  orderType?: string;
  createdAt?: string;
}

// ─────────────────────────────────────────
// Helper: Render Teks Bersih Tanpa Bintang Markdown
// ─────────────────────────────────────────
function renderCleanContent(text: string, isUser: boolean) {
  if (isUser) {
    return <span>{text}</span>;
  }

  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '4px' }} />;
        }

        // Regex untuk mencari **bold** atau *italic* dan menghapus tanda bintangnya
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*|\*)(.*?)\1/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(trimmed)) !== null) {
          if (match.index > lastIndex) {
            const normalText = trimmed.substring(lastIndex, match.index).replace(/\*/g, '');
            if (normalText) parts.push(normalText);
          }
          const boldText = match[2].replace(/\*/g, '');
          parts.push(
            <strong key={`b-${match.index}`} style={{ fontWeight: 700, color: '#1e293b' }}>
              {boldText}
            </strong>
          );
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < trimmed.length) {
          const tail = trimmed.substring(lastIndex).replace(/\*/g, '');
          if (tail) parts.push(tail);
        }

        const renderedLine = parts.length > 0 ? parts : trimmed.replace(/\*/g, '');

        // Baris bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const cleanBulletText =
            parts.length > 0
              ? parts
              : trimmed.replace(/^[•\-]\s*/, '').replace(/\*/g, '');

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                paddingLeft: '4px',
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: '#b45309', fontWeight: 800, userSelect: 'none' }}>•</span>
              <div style={{ flex: 1 }}>{cleanBulletText}</div>
            </div>
          );
        }

        // Baris judul kategori / header section
        const isHeader =
          trimmed.startsWith('📦') ||
          trimmed.startsWith('📊') ||
          trimmed.startsWith('🚨') ||
          trimmed.startsWith('🟡') ||
          trimmed.startsWith('📅') ||
          trimmed.startsWith('👤') ||
          trimmed.startsWith('💰') ||
          trimmed.startsWith('🧾') ||
          trimmed.startsWith('👥') ||
          trimmed.endsWith(':');

        if (isHeader) {
          return (
            <div
              key={idx}
              style={{
                fontWeight: 700,
                color: '#0f172a',
                paddingTop: '3px',
                paddingBottom: '1px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{renderedLine}</span>
            </div>
          );
        }

        return (
          <p key={idx} style={{ margin: 0, color: '#334155', lineHeight: 1.5 }}>
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function FloatingChat() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'PELANGGAN';
  const isStaff = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'PETUGAS_STOK';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestOrder, setLatestOrder] = useState<LatestOrder | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Modal custom target send
  const [modalAction, setModalAction] = useState<ActionButton | null>(null);
  const [customContact, setCustomContact] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Periksa notifikasi pesanan dari localStorage & event listener
  useEffect(() => {
    const checkLatestOrder = () => {
      try {
        const raw = localStorage.getItem('kopi_latest_order');
        if (raw) {
          const parsed = JSON.parse(raw);
          setLatestOrder(parsed);
          setHasNewNotification(true);
        }
      } catch (e) {
        console.error('Error reading latest order:', e);
      }
    };

    checkLatestOrder();

    const handleNewOrder = (event: any) => {
      if (event.detail) {
        setLatestOrder(event.detail);
        setHasNewNotification(true);
      }
    };

    window.addEventListener('kopi:order_placed', handleNewOrder);
    return () => window.removeEventListener('kopi:order_placed', handleNewOrder);
  }, []);

  // Auto-scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fokus ke input setiap chat dibuka dan reset badge notifikasi
  useEffect(() => {
    if (isOpen) {
      setHasNewNotification(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Ekstrak konteks & isi teks halaman web saat ini secara real-time
      const pageContext = {
        url: typeof window !== 'undefined' ? window.location.href : '',
        pathname: typeof window !== 'undefined' ? window.location.pathname : '',
        title: typeof document !== 'undefined' ? document.title : '',
        content: (() => {
          if (typeof document === 'undefined') return '';
          const mainEl = document.querySelector('main') || document.body;
          if (!mainEl) return '';
          return (mainEl as HTMLElement).innerText?.replace(/\s+/g, ' ').trim().slice(0, 4000) || '';
        })(),
      };

      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          clientRole: userRole,
          clientName: session?.user?.name,
          clientEmail: session?.user?.email,
          clientId: (session?.user as any)?.id,
          pageContext,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Maaf, saya tidak bisa menjawab saat ini.',
        actions: data.actions || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notifikasi HANYA muncul jika user eksplisit minta laporan/stok/struk
      // DAN chatbot benar-benar mengembalikan action buttons (bukan sekedar chat)
      const qLower = text.toLowerCase();
      const hasActions = data.actions && data.actions.length > 0;
      const isExplicitReport =
        qLower.includes('laporan') ||
        qLower.includes('kirim') ||
        qLower.includes('struk') ||
        qLower.includes('nota') ||
        qLower.includes('whatsapp') ||
        qLower.includes('email');

      if (hasActions && isExplicitReport) {
        if (qLower.includes('stok') || qLower.includes('bahan') || qLower.includes('inventaris')) {
          triggerTopNotification({
            type: 'STOCK_ALERT',
            title: 'Laporan Stok Siap Dikirim',
            message: 'Laporan bahan baku siap dikirim via WhatsApp / Email.',
            actionLabel: 'Kirim WA',
            actionUrl: data.actions?.[0]?.url,
          });
        } else if (qLower.includes('struk') || qLower.includes('pesanan saya')) {
          triggerTopNotification({
            type: 'PAYMENT_SUCCESS',
            title: 'Struk Siap Dikirim',
            message: 'Struk pesanan siap dikirimkan ke WhatsApp.',
            actionLabel: 'Kirim WA',
            actionUrl: data.actions?.[0]?.url,
          });
        } else if (
          qLower.includes('laporan') &&
          (qLower.includes('omset') || qLower.includes('penjualan') || qLower.includes('keuangan'))
        ) {
          triggerTopNotification({
            type: 'REPORT_SUBMITTED',
            title: 'Laporan Penjualan Siap Dikirim',
            message: 'Laporan omset siap dikirim ke WhatsApp / Email Owner & Admin.',
            actionLabel: 'Kirim WA',
            actionUrl: data.actions?.[0]?.url,
          });
        }
      }
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '☕ Maaf, terjadi gangguan koneksi ke server. Silakan coba lagi.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Eksekusi aksi WhatsApp / Email
  const executeAction = async (action: ActionButton) => {
    try {
      fetch('/api/notifications/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: action.type === 'whatsapp' ? 'WHATSAPP' : 'EMAIL',
          recipientRole: userRole,
          recipientContact: action.target || '',
          title: action.subject || action.label,
          content: action.text || '',
        }),
      });
    } catch (e) {
      console.warn('Logging notification error:', e);
    }

    window.open(action.url, '_blank', 'noopener,noreferrer');
  };

  const openCustomModal = (action: ActionButton) => {
    setModalAction(action);
    setCustomContact(action.target || '');
    setSendSuccessMsg('');
  };

  const handleSendCustomModal = async () => {
    if (!modalAction) return;
    setIsSendingNotification(true);
    setSendSuccessMsg('');

    try {
      const res = await fetch('/api/notifications/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: modalAction.type === 'whatsapp' ? 'WHATSAPP' : 'EMAIL',
          recipientRole: userRole,
          recipientContact: customContact,
          title: modalAction.subject || modalAction.label,
          content: modalAction.text || '',
        }),
      });

      const data = await res.json();
      if (data.directUrl) {
        window.open(data.directUrl, '_blank', 'noopener,noreferrer');
      }

      setSendSuccessMsg(`Berhasil dikirim ke ${customContact || 'tujuan'}!`);
      setTimeout(() => {
        setModalAction(null);
        setSendSuccessMsg('');
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Gagal mengirimkan notifikasi. Silakan coba kembali.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Rekomendasi Pertanyaan Sesuai Peran (sesuai RBAC)
  const roleQuestions = (() => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { text: 'Siapa Anda & apa tugas Barista AI?', icon: '🤖' },
          { text: 'Siapa saya & hak akses akun Admin', icon: '👤' },
          { text: 'Kirim Laporan Omset ke WA Owner', icon: '📊' },
          { text: 'Ada berapa pelanggan terdaftar?', icon: '👥' },
        ];
      case 'OWNER':
        return [
          { text: 'Siapa Anda & apa tugas Barista AI?', icon: '🤖' },
          { text: 'Siapa saya & wewenang akun Owner', icon: '👑' },
          { text: 'Kirim Laporan Omset ke WhatsApp Owner', icon: '💰' },
          { text: 'Berapa total omset & pendapatan saat ini?', icon: '💵' },
        ];
      case 'KASIR':
        return [
          { text: 'Siapa Anda & apa tugas Barista AI?', icon: '🤖' },
          { text: 'Siapa saya & tugas peran Kasir', icon: '🧑‍💼' },
          { text: 'Daftar pesanan hari ini', icon: '🧾' },
          { text: 'Kirim struk ke WhatsApp pelanggan', icon: '📲' },
        ];
      case 'PETUGAS_STOK':
        return [
          { text: 'Siapa Anda & apa tugas Barista AI?', icon: '🤖' },
          { text: 'Siapa saya & tugas Petugas Stok', icon: '📦' },
          { text: 'Sisa stok bahan baku di gudang', icon: '📦' },
          { text: 'Kirim Laporan Stok Kritis ke WhatsApp', icon: '⚠️' },
        ];
      default: // PELANGGAN
        return [
          { text: 'Siapa Anda & apa tugas Barista AI?', icon: '🤖' },
          { text: 'Siapa saya & info akun saya', icon: '👤' },
          { text: 'Apa menu andalan & promo hari ini?', icon: '☕' },
          { text: 'Jam operasional & jadwal kedai', icon: '🕒' },
        ];
    }
  })();

  // Warna badge role
  const roleBadgeStyle = (() => {
    switch (userRole) {
      case 'ADMIN': return { bg: 'rgba(99,102,241,0.25)', label: '🛡️ ADMIN' };
      case 'OWNER': return { bg: 'rgba(234,179,8,0.3)', label: '👑 OWNER' };
      case 'KASIR': return { bg: 'rgba(59,130,246,0.25)', label: '🧑‍💼 KASIR' };
      case 'PETUGAS_STOK': return { bg: 'rgba(249,115,22,0.25)', label: '📦 STOK' };
      default: return { bg: 'rgba(168,85,247,0.25)', label: '☕ PELANGGAN' };
    }
  })();

  // Deskripsi peran di welcome screen
  const roleWelcomeDesc = (() => {
    switch (userRole) {
      case 'ADMIN': return 'Akses penuh data pengguna, laporan penjualan & sistem.';
      case 'OWNER': return 'Lihat laporan keuangan, omset & grafik penjualan real-time.';
      case 'KASIR': return 'Kelola pesanan harian, struk, & laporan transaksi.';
      case 'PETUGAS_STOK': return 'Pantau stok bahan baku, inventaris & supplier.';
      default: return 'Tanyakan menu, pesanan, promo, & jam buka kedai.';
    }
  })();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Jendela Chat */}
      {isOpen && (
        <div
          style={{
            marginBottom: '16px',
            width: '380px',
            height: '570px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #b45309, #d97706)',
              color: 'white',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  padding: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Coffee size={20} color="white" />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '15px',
                    lineHeight: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>AI Barista Assistant</span>
                  <span
                    style={{
                      fontSize: '9px',
                      background: roleBadgeStyle.bg,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontWeight: 800,
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <ShieldCheck size={11} /> {roleBadgeStyle.label}
                  </span>
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
                  {isLoading
                    ? '● Sedang menganalisis...'
                    : userRole === 'PETUGAS_STOK' || userRole === 'KASIR'
                    ? '● Siap Membantu Operasional'
                    : '● Siap Kirim Laporan via WA & Email'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {/* Tombol Reset Chat */}
              <button
                onClick={handleReset}
                title="Reset Chat"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Trash2 size={15} />
              </button>

              {/* Tombol Tutup */}
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Banner Notifikasi Pesanan Baru (Jika ada pembelian aktif) */}
          {latestOrder && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                borderBottom: '1px solid #a7f3d0',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔔</span>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', margin: 0 }}>
                    Pesanan #{latestOrder.orderCode} Siap Dikirim!
                  </p>
                  <p style={{ fontSize: '10px', color: '#047857', margin: 0 }}>
                    Total Rp {latestOrder.total?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSend(`Notifikasi pesanan saya #${latestOrder.orderCode} kirim ke WhatsApp`)
                }
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Kirim WA <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Area Percakapan */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              backgroundColor: '#f8fafc',
            }}
          >
            {/* Tampilan Awal / Welcome */}
            {messages.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '10px',
                  padding: '8px 4px',
                }}
              >
                <div
                  style={{
                    background: '#fef3c7',
                    borderRadius: '50%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Coffee size={36} color="#d97706" />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#78350f', margin: 0 }}>
                  Halo {session?.user?.name || 'Kawan Kopi'}! ☕
                </h4>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    lineHeight: 1.45,
                    maxWidth: '290px',
                    margin: 0,
                  }}
                >
                  Chatbot <strong>{roleBadgeStyle.label}</strong> — {roleWelcomeDesc}
                </p>

                {/* Quick Prompts */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    width: '100%',
                    maxWidth: '310px',
                    marginTop: '8px',
                  }}
                >
                  {roleQuestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.text)}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '8px 12px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: '#334155',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fffbeb';
                        e.currentTarget.style.borderColor = '#f59e0b';
                        e.currentTarget.style.color = '#92400e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      <span>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.text}</span>
                      <ChevronRight size={13} color="#94a3b8" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List Pesan */}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '8px',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: m.role === 'user' ? '#b45309' : '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                  }}
                >
                  {m.role === 'user' ? (
                    <User size={14} color="white" />
                  ) : (
                    <Bot size={14} color="white" />
                  )}
                </div>

                {/* Bubble Pesan (Bersih Tanpa Bintang) */}
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      padding: '11px 14px',
                      borderRadius:
                        m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: '12.5px',
                      lineHeight: 1.55,
                      background: m.role === 'user' ? '#b45309' : '#ffffff',
                      color: m.role === 'user' ? 'white' : '#1e293b',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderCleanContent(m.content, m.role === 'user')}
                  </div>

                  {/* Tombol Interaktif WhatsApp & Email Action */}
                  {m.actions && m.actions.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '4px',
                      }}
                    >
                      {m.actions.map((act, actIdx) => {
                        const isWA = act.type === 'whatsapp';
                        return (
                          <div
                            key={actIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <button
                              onClick={() => executeAction(act)}
                              style={{
                                flex: 1,
                                backgroundColor: isWA ? '#25D366' : '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '8px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: isWA
                                  ? '0 2px 6px rgba(37, 211, 102, 0.3)'
                                  : '0 2px 6px rgba(37, 99, 235, 0.3)',
                                transition: 'opacity 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                            >
                              {isWA ? <Smartphone size={14} /> : <Mail size={14} />}
                              <span>{act.label}</span>
                              <ExternalLink size={12} />
                            </button>

                            <button
                              onClick={() => openCustomModal(act)}
                              title="Kirim ke nomor/email khusus"
                              style={{
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '12px',
                                padding: '8px 9px',
                                cursor: 'pointer',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Share2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Animasi Loading */}
            {isLoading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={14} color="white" />
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Loader2
                    size={14}
                    color="#b45309"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Menghitung data & menyusun laporan...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Area Input Chat */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'white',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  userRole === 'PELANGGAN'
                    ? 'Tanya menu, harga, promo, atau status pesanan...'
                    : userRole === 'KASIR'
                    ? 'Tanya pesanan harian, struk, atau laporan transaksi...'
                    : userRole === 'PETUGAS_STOK'
                    ? 'Tanya stok bahan baku, inventaris, atau supplier...'
                    : 'Minta laporan, omset, stok, atau notifikasi...'
                }
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '12.5px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#f59e0b')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                style={{
                  flexShrink: 0,
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: inputText.trim() && !isLoading ? '#b45309' : '#cbd5e1',
                  border: 'none',
                  cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
              >
                <Send size={15} color="white" style={{ marginLeft: '2px' }} />
              </button>
            </div>
            <p
              style={{
                textAlign: 'center',
                fontSize: '10px',
                color: '#94a3b8',
                marginTop: '5px',
                marginBottom: 0,
              }}
            >
              {userRole === 'PELANGGAN'
                ? 'Tanya seputar menu, pesanan & promo Kopi Mahasiswa ☕'
                : userRole === 'KASIR'
                ? 'Kelola transaksi harian & kirim struk via WhatsApp'
                : userRole === 'PETUGAS_STOK'
                ? 'Pantau stok & kirim laporan inventaris via WA/Email'
                : 'Ketik &quot;Laporan WhatsApp&quot; atau &quot;Notifikasi Pesanan&quot; untuk respon langsung'}
            </p>
          </div>
        </div>
      )}

      {/* Modal Dialog Custom Contact Pengiriman Laporan */}
      {modalAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#78350f', margin: 0 }}>
                Kirim {modalAction.type === 'whatsapp' ? 'WhatsApp' : 'Email'} Langsung
              </h3>
              <button
                onClick={() => setModalAction(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4 }}>
              Pilih tujuan penerima laporan atau masukkan nomor/email khusus:
            </p>

            {/* Presets Penerima */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() =>
                  setCustomContact(
                    modalAction.type === 'whatsapp' ? '082222222222' : 'owner@kopimahasiswa.com'
                  )
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                👑 Owner: {modalAction.type === 'whatsapp' ? '082222222222' : 'owner@kopimahasiswa.com'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCustomContact(
                    modalAction.type === 'whatsapp' ? '081111111111' : 'admin@kopimahasiswa.com'
                  )
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                🛡️ Admin: {modalAction.type === 'whatsapp' ? '081111111111' : 'admin@kopimahasiswa.com'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCustomContact(
                    modalAction.type === 'whatsapp' ? '084444444444' : 'stok@kopimahasiswa.com'
                  )
                }
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                📦 Stok: {modalAction.type === 'whatsapp' ? '084444444444' : 'stok@kopimahasiswa.com'}
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '4px',
                }}
              >
                {modalAction.type === 'whatsapp' ? 'Nomor WhatsApp Tujuan' : 'Alamat Email Tujuan'}
              </label>
              <input
                type="text"
                value={customContact}
                onChange={(e) => setCustomContact(e.target.value)}
                placeholder={
                  modalAction.type === 'whatsapp' ? 'Contoh: 08123456789' : 'Contoh: staf@kopimahasiswa.com'
                }
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {sendSuccessMsg && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '10px',
                  color: '#065f46',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={14} color="#059669" />
                <span>{sendSuccessMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                style={{
                  flex: 1,
                  padding: '9px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendCustomModal}
                disabled={isSendingNotification}
                style={{
                  flex: 2,
                  padding: '9px',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: modalAction.type === 'whatsapp' ? '#25D366' : '#2563eb',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: isSendingNotification ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {isSendingNotification ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : modalAction.type === 'whatsapp' ? (
                  <Smartphone size={14} />
                ) : (
                  <Mail size={14} />
                )}
                <span>Kirim Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tombol Floating Bulat dengan Badge Notifikasi Pembelian */}
      <div style={{ position: 'relative' }}>
        {hasNewNotification && !isOpen && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.7)',
              zIndex: 10,
              animation: 'bounce 1s infinite',
            }}
          >
            1
          </span>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: isOpen ? '#1e293b' : 'linear-gradient(135deg, #b45309, #d97706)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(180, 83, 9, 0.45)',
            transition: 'all 0.3s ease',
            transform: isOpen ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isOpen ? 'scale(0.95)' : 'scale(1)';
          }}
          aria-label="AI Barista Chatbot Kopi Mahasiswa"
        >
          {isOpen ? (
            <X size={24} color="white" />
          ) : (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MessageCircle size={26} color="white" />
              {hasNewNotification && (
                <Bell
                  size={12}
                  color="#fef08a"
                  style={{ position: 'absolute', top: -3, right: -3 }}
                />
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
