'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Coffee,
  Bike,
  AlertTriangle,
  TrendingUp,
  X,
  ChevronRight,
  Bell,
  Sparkles,
  ExternalLink,
  Package,
} from 'lucide-react';

export type NotificationType =
  | 'PAYMENT_SUCCESS'
  | 'ORDER_PENDING'
  | 'ORDER_PROCESSING'
  | 'ORDER_DELIVERING'
  | 'ORDER_COMPLETED'
  | 'REPORT_SUBMITTED'
  | 'STOCK_ALERT'
  | 'NEW_ORDER_ALERT';

export interface TopNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp?: string;
  orderCode?: string;
  roleTarget?: 'OWNER' | 'ADMIN' | 'PETUGAS_STOK' | 'PELANGGAN' | 'ALL';
  actionLabel?: string;
  actionUrl?: string;
  onActionClick?: () => void;
}

export function triggerTopNotification(notification: Omit<TopNotification, 'id'>) {
  if (typeof window !== 'undefined') {
    const detail: TopNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    window.dispatchEvent(new CustomEvent('kopi:top_notification', { detail }));
  }
}

export default function TopNotificationBar() {
  const [activeNotification, setActiveNotification] = useState<TopNotification | null>(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const DURATION_MS = 6500;

  const dismiss = () => {
    setActiveNotification(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const showNotification = (notif: TopNotification) => {
    // Clear previous timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setActiveNotification(notif);
    setProgress(100);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0 && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 40);

    timerRef.current = setTimeout(() => {
      dismiss();
    }, DURATION_MS);
  };

  useEffect(() => {
    const handleEvent = (e: any) => {
      if (e.detail) {
        showNotification(e.detail);
      }
    };

    window.addEventListener('kopi:top_notification', handleEvent);

    // Deteksi jika baru saja ada pesanan dibuat di tab/window
    const handleOrderPlaced = (e: any) => {
      const order = e.detail;
      const code = order?.orderCode || 'ORD-KOP1';
      const total = order?.total ? `Rp ${order.total.toLocaleString('id-ID')}` : '';

      // Tampilkan notifikasi Pembayaran Berhasil
      showNotification({
        id: `pay-${Date.now()}`,
        type: 'PAYMENT_SUCCESS',
        title: 'Pembayaran Berhasil Diterima!',
        message: `Pesanan #${code} ${total ? `senilai ${total}` : ''} telah lunas.`,
        orderCode: code,
        actionLabel: 'Kirim Struk WA',
        actionUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `*☕ STRUK PEMBAYARAN KOPI MAHASISWA*\nPesanan #${code} telah berhasil dibayar.`
        )}`,
      });

      // Rangkaian simulasi status pesanan: Menunggu -> Sedang Disiapkan -> Sedang Diantar
      setTimeout(() => {
        showNotification({
          id: `pending-${Date.now()}`,
          type: 'ORDER_PENDING',
          title: 'Pesanan Menunggu Barista',
          message: `Pesanan #${code} masuk ke antrean barista kedai.`,
          orderCode: code,
        });
      }, 7000);

      setTimeout(() => {
        showNotification({
          id: `proc-${Date.now()}`,
          type: 'ORDER_PROCESSING',
          title: 'Pesanan Sedang Disiapkan Barista',
          message: `Kopi pilihan Anda di pesanan #${code} sedang diseduh dan diracik!`,
          orderCode: code,
        });
      }, 14500);

      setTimeout(() => {
        showNotification({
          id: `deliv-${Date.now()}`,
          type: 'ORDER_DELIVERING',
          title: 'Pesanan Sudah di Pengantar / Siap Diambil!',
          message: `Pesanan #${code} telah selesai dan siap diantar ke meja atau diambil di pickup counter! 🛵☕`,
          orderCode: code,
          actionLabel: 'Ambil Sekarang',
        });
      }, 22000);
    };

    window.addEventListener('kopi:order_placed', handleOrderPlaced);

    return () => {
      window.removeEventListener('kopi:top_notification', handleEvent);
      window.removeEventListener('kopi:order_placed', handleOrderPlaced);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  if (!activeNotification) return null;

  // Konfigurasi visual berdasarkan tipe notifikasi
  const config = (() => {
    switch (activeNotification.type) {
      case 'PAYMENT_SUCCESS':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />,
          badgeText: 'Pembayaran Berhasil',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          bgGradient: 'from-emerald-50/95 to-white',
          borderClass: 'border-emerald-300 shadow-emerald-500/10',
          progressColor: 'bg-emerald-500',
        };
      case 'ORDER_PENDING':
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 animate-pulse" />,
          badgeText: 'Menunggu Konfirmasi',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          bgGradient: 'from-amber-50/95 to-white',
          borderClass: 'border-amber-300 shadow-amber-500/10',
          progressColor: 'bg-amber-500',
        };
      case 'ORDER_PROCESSING':
        return {
          icon: <Coffee className="w-5 h-5 text-blue-600 animate-pulse" />,
          badgeText: 'Sedang Disiapkan Barista',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          bgGradient: 'from-blue-50/95 to-white',
          borderClass: 'border-blue-300 shadow-blue-500/10',
          progressColor: 'bg-blue-500',
        };
      case 'ORDER_DELIVERING':
        return {
          icon: <Bike className="w-5 h-5 text-purple-600 animate-bounce" />,
          badgeText: 'Sudah di Pengantar / Siap Ambil',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          bgGradient: 'from-purple-50/95 to-white',
          borderClass: 'border-purple-300 shadow-purple-500/15',
          progressColor: 'bg-purple-500',
        };
      case 'REPORT_SUBMITTED':
        return {
          icon: <TrendingUp className="w-5 h-5 text-amber-700 animate-pulse" />,
          badgeText: 'Laporan Diajukan / Siap Kirim',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          bgGradient: 'from-amber-100/95 to-white',
          borderClass: 'border-amber-400 shadow-amber-600/15',
          progressColor: 'bg-amber-600',
        };
      case 'STOCK_ALERT':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />,
          badgeText: 'Peringatan Stok Gudang',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          bgGradient: 'from-rose-50/95 to-white',
          borderClass: 'border-rose-300 shadow-rose-500/15',
          progressColor: 'bg-rose-500',
        };
      case 'NEW_ORDER_ALERT':
        return {
          icon: <Bell className="w-5 h-5 text-indigo-600 animate-pulse" />,
          badgeText: 'Pesanan Baru Masuk',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          bgGradient: 'from-indigo-50/95 to-white',
          borderClass: 'border-indigo-300 shadow-indigo-500/10',
          progressColor: 'bg-indigo-500',
        };
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-amber-600" />,
          badgeText: 'Notifikasi Kopi Mahasiswa',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          bgGradient: 'from-amber-50/95 to-white',
          borderClass: 'border-amber-300 shadow-amber-500/10',
          progressColor: 'bg-amber-500',
        };
    }
  })();

  const handleAction = () => {
    if (activeNotification.actionUrl) {
      window.open(activeNotification.actionUrl, '_blank', 'noopener,noreferrer');
    }
    if (activeNotification.onActionClick) {
      activeNotification.onActionClick();
    }
    dismiss();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '560px',
        width: 'calc(100vw - 32px)',
      }}
      className="animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div
        className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-r ${config.bgGradient} border ${config.borderClass} rounded-2xl shadow-2xl p-4 transition-all`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Icon Box */}
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 flex-shrink-0 mt-0.5">
            {config.icon}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10.5px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
              >
                {config.badgeText}
              </span>
              {activeNotification.orderCode && (
                <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  #{activeNotification.orderCode}
                </span>
              )}
            </div>

            <h4 className="text-[13.5px] font-bold text-slate-900 leading-snug">
              {activeNotification.title}
            </h4>
            <p className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
              {activeNotification.message}
            </p>

            {/* Tombol Aksi jika ada */}
            {activeNotification.actionLabel && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900 text-white hover:bg-amber-800 text-[11px] font-bold shadow-sm transition-all"
                >
                  <span>{activeNotification.actionLabel}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors flex-shrink-0"
            title="Tutup Notifikasi"
          >
            <X size={16} />
          </button>
        </div>

        {/* Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 overflow-hidden">
          <div
            className={`h-full ${config.progressColor} transition-all ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
