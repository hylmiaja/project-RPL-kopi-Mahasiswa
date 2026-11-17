"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Clock,
  Coffee,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { triggerTopNotification, TopNotification, NotificationType } from "./TopNotificationBar";

export interface StoredNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderCode?: string;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: number;
  read: boolean;
}

export interface NotificationCenterProps {
  inline?: boolean;
}

const INITIAL_NOTIFICATIONS: StoredNotification[] = [
  {
    id: "notif-init-1",
    type: "PAYMENT_SUCCESS",
    title: "Pembayaran Berhasil! (Lunas)",
    message: "Pesanan #ORD-2045 sebesar Rp 48.000 telah terverifikasi via QRIS. Struk siap dikirim ke WhatsApp.",
    orderCode: "ORD-2045",
    actionLabel: "Kirim WhatsApp",
    actionUrl: "https://wa.me/?text=Halo%2C%20struk%20pesanan%20kopi%20ORD-2045%20sudah%20lunas.",
    createdAt: Date.now() - 1000 * 60 * 3, // 3 menit lalu
    read: false,
  },
  {
    id: "notif-init-2",
    type: "ORDER_DELIVERING",
    title: "Pesanan Sudah di Pengantar!",
    message: "Barista telah menyelesaikan seduhan, pesanan siap diambil di meja pick-up atau diantar kurir. 🛵☕",
    orderCode: "ORD-2045",
    actionLabel: "Lacak Pesanan",
    createdAt: Date.now() - 1000 * 60 * 15, // 15 menit lalu
    read: false,
  },
  {
    id: "notif-init-3",
    type: "REPORT_SUBMITTED",
    title: "Laporan Omset Diajukan ke Owner",
    message: "Ringkasan penjualan harian berhasil diajukan untuk ditinjau oleh Owner & Administrator.",
    actionLabel: "Lihat Laporan",
    createdAt: Date.now() - 1000 * 60 * 45, // 45 menit lalu
    read: true,
  },
];

export default function NotificationCenter({ inline = false }: NotificationCenterProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "ORDERS" | "REPORTS">("ALL");
  const [showSimPanel, setShowSimPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Muat notifikasi dari localStorage atau initial data
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kopi_notifications_history");
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        setNotifications(INITIAL_NOTIFICATIONS);
        localStorage.setItem("kopi_notifications_history", JSON.stringify(INITIAL_NOTIFICATIONS));
      }
    } catch {
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  }, []);

  // Simpan ke localStorage saat berubah
  const saveNotifications = (newList: StoredNotification[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem("kopi_notifications_history", JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Dengarkan custom event dari seluruh aplikasi
  useEffect(() => {
    const handleTopNotif = (e: CustomEvent<TopNotification>) => {
      const payload = e.detail;
      const newNotif: StoredNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        orderCode: payload.orderCode,
        actionLabel: payload.actionLabel,
        actionUrl: payload.actionUrl,
        createdAt: Date.now(),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev.filter((n) => n.id !== newNotif.id)].slice(0, 30);
        try {
          localStorage.setItem("kopi_notifications_history", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    };

    window.addEventListener("kopi:top_notification" as any, handleTopNotif);
    return () => {
      window.removeEventListener("kopi:top_notification" as any, handleTopNotif);
    };
  }, []);

  // Klik di luar panel untuk menutup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const markItemAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  // Trigger simulasi notifikasi
  const handleSimulate = (payload: Omit<TopNotification, "id">) => {
    triggerTopNotification(payload);
  };

  // Filter tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "ORDERS") {
      return ["PAYMENT_SUCCESS", "ORDER_PENDING", "ORDER_PROCESSING", "ORDER_DELIVERING"].includes(n.type);
    }
    if (activeTab === "REPORTS") {
      return ["REPORT_SUBMITTED", "STOCK_ALERT"].includes(n.type);
    }
    return true;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "PAYMENT_SUCCESS":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "ORDER_PENDING":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "ORDER_PROCESSING":
        return <Coffee className="w-4 h-4 text-blue-600" />;
      case "ORDER_DELIVERING":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "REPORT_SUBMITTED":
        return <FileSpreadsheet className="w-4 h-4 text-orange-600" />;
      case "STOCK_ALERT":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getBadgeStyle = (type: NotificationType) => {
    switch (type) {
      case "PAYMENT_SUCCESS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ORDER_PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "ORDER_PROCESSING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ORDER_DELIVERING":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "REPORT_SUBMITTED":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "STOCK_ALERT":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  // Notifikasi hanya keluar/tampil saat pengguna sudah masuk akun
  if (status !== "authenticated" || !session) {
    return null;
  }

  // Jika floating (bukan inline di Navbar), hanya tampilkan di halaman dashboard atau admin
  if (!inline && !pathname?.startsWith("/dashboard") && !pathname?.startsWith("/admin")) {
    return null;
  }

  const containerClass = inline
    ? "relative flex items-center shrink-0"
    : "fixed top-3.5 right-6 z-50";

  const buttonClass = inline
    ? `relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 border ${
        isOpen
          ? "bg-amber-600 text-white shadow-amber-200 shadow-sm"
          : "bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50/80 border-slate-200"
      }`
    : `relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all duration-300 shadow-md ${
        isOpen
          ? "bg-amber-600 text-white shadow-amber-200 shadow-lg scale-105"
          : "bg-white/95 text-slate-700 hover:text-amber-800 hover:bg-amber-50/80 border border-slate-200/90 backdrop-blur-md hover:shadow-lg"
      }`;

  const dropdownClass = inline
    ? "absolute right-0 top-full mt-2 w-[360px] sm:w-[420px] max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50"
    : "absolute right-0 mt-3 w-[360px] sm:w-[420px] max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/90 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50";

  return (
    <div ref={panelRef} className={containerClass}>
      {/* Tombol Ikon Notifikasi Luar Chatbot */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-label="Pusat Notifikasi"
        className={buttonClass}
      >
        <Bell className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${unreadCount > 0 ? "animate-bounce" : ""}`} />

        {/* Badge Angka Notifikasi Belum Dibaca */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-600 rounded-full shadow-md border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Panel Notifikasi Dropdown */}
      {isOpen && (
        <div className={dropdownClass}>
          {/* Header Panel */}
          <div className="p-4 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-amber-200">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                  Pusat Notifikasi
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-amber-200/80">Status Pesanan & Laporan Sistem</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Tandai semua dibaca"
                  className="p-1.5 hover:bg-white/15 rounded-lg text-amber-100 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  title="Bersihkan riwayat"
                  className="p-1.5 hover:bg-white/15 rounded-lg text-amber-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg text-amber-100 transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-3 pt-2 bg-slate-50 border-b border-slate-100 gap-1 text-xs shrink-0">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === "ALL"
                  ? "border-amber-600 text-amber-800 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("ORDERS")}
              className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === "ORDERS"
                  ? "border-amber-600 text-amber-800 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Pesanan & Kurir
            </button>
            <button
              onClick={() => setActiveTab("REPORTS")}
              className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                activeTab === "REPORTS"
                  ? "border-amber-600 text-amber-800 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Laporan & Stok
            </button>
          </div>

          {/* List Notifikasi */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Tidak ada notifikasi di kategori ini</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markItemAsRead(notif.id)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex gap-3 ${
                    notif.read ? "bg-white hover:bg-slate-50" : "bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-amber-500"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                      {getIconForType(notif.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(
                          notif.type
                        )}`}
                      >
                        {notif.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <h4
                      className={`text-xs mb-1 line-clamp-1 ${
                        notif.read ? "font-semibold text-slate-700" : "font-bold text-slate-900"
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 mb-2">
                      {notif.message}
                    </p>

                    {/* Tombol aksi cepat */}
                    {notif.actionLabel && (
                      <div className="flex items-center gap-2">
                        {notif.actionUrl ? (
                          <a
                            href={notif.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all"
                          >
                            <span>{notif.actionLabel}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerTopNotification(notif);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all"
                          >
                            <span>{notif.actionLabel}</span>
                          </button>
                        )}
                        {notif.orderCode && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {notif.orderCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bagian Bawah: Uji Coba Cepat Notifikasi Web */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setShowSimPanel(!showSimPanel)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-amber-800 py-1"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulasi & Tes Notifikasi Web</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showSimPanel ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSimPanel && (
              <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5 animate-in fade-in duration-150">
                <button
                  onClick={() =>
                    handleSimulate({
                      type: "PAYMENT_SUCCESS",
                      title: "Pembayaran Berhasil! (Lunas)",
                      message: "Pesanan #ORD-2045 senilai Rp 55.000 telah lunas via QRIS.",
                      orderCode: "ORD-2045",
                      actionLabel: "Kirim WhatsApp",
                    })
                  }
                  className="p-1.5 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-left transition-colors"
                >
                  ✅ 1. Berhasil Bayar
                </button>

                <button
                  onClick={() =>
                    handleSimulate({
                      type: "ORDER_PENDING",
                      title: "Pesanan Menunggu Barista",
                      message: "Pesanan #ORD-2045 sedang menunggu konfirmasi racikan barista.",
                      orderCode: "ORD-2045",
                    })
                  }
                  className="p-1.5 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-left transition-colors"
                >
                  ⏳ 2. Menunggu Barista
                </button>

                <button
                  onClick={() =>
                    handleSimulate({
                      type: "ORDER_PROCESSING",
                      title: "Pesanan Sedang Disiapkan",
                      message: "Barista sedang menyeduh espresso & steaming susu pesanan Anda.",
                      orderCode: "ORD-2045",
                    })
                  }
                  className="p-1.5 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 text-left transition-colors"
                >
                  ☕ 3. Sedang Disiapkan
                </button>

                <button
                  onClick={() =>
                    handleSimulate({
                      type: "ORDER_DELIVERING",
                      title: "Sudah di Pengantar / Siap Ambil!",
                      message: "Pesanan #ORD-2045 siap diantar atau diambil di meja kasir! 🛵☕",
                      orderCode: "ORD-2045",
                      actionLabel: "Ambil Sekarang",
                    })
                  }
                  className="p-1.5 text-[10px] font-bold rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 text-left transition-colors"
                >
                  🛵 4. Sudah di Pengantar
                </button>

                <button
                  onClick={() =>
                    handleSimulate({
                      type: "REPORT_SUBMITTED",
                      title: "Laporan Omset Diajukan ke Owner!",
                      message: "Laporan omset penjualan real-time siap dikirim ke WA/Email Owner & Admin.",
                      actionLabel: "Kirim WA Owner",
                    })
                  }
                  className="p-1.5 text-[10px] font-bold rounded-lg bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 text-left transition-colors"
                >
                  📊 5. Laporan Owner/Admin
                </button>

                <button
                  onClick={() =>
                    handleSimulate({
                      type: "STOCK_ALERT",
                      title: "Laporan Stok Diajukan ke Petugas!",
                      message: "Pengajuan restock bahan baku kritis siap dikirim ke Petugas Stok & Supplier.",
                      actionLabel: "Kirim WA Stok",
                    })
                  }
                  className="p-1.5 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 text-left transition-colors"
                >
                  ⚠️ 6. Laporan Stok Gudang
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
