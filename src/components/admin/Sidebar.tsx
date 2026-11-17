"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/admin", label: "📊 Overview", icon: "📊" },
    { href: "/dashboard/admin/pengguna", label: "👥 Manajemen Pengguna", icon: "👥" },
    { href: "/dashboard/admin/menu", label: "☕ Katalog Produk", icon: "☕" },
    { href: "/dashboard/admin/pesanan", label: "📦 Riwayat Pesanan", icon: "📦" },
    { href: "/dashboard/admin/promo", label: "🏷️ Promo & Campaign", icon: "🏷️" },
    { href: "/dashboard/admin/supplier", label: "🚚 Vendor Supplier", icon: "🚚" },
    { href: "/dashboard/admin/ai", label: "🤖 Pengaturan AI", icon: "🤖" },
  ];

  return (
    <aside className="w-64 flex-none bg-[#1A100B] border-r border-[#3D2619] flex flex-col min-h-screen text-amber-50">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#3D2619] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-base shadow-md">
          ☕
        </div>
        <div>
          <h2 className="font-bold text-white text-base tracking-tight leading-none">
            Kopi Mahasiswa
          </h2>
          <span className="text-[11px] text-amber-300 font-medium tracking-wide">
            Admin Panel
          </span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-5 py-4 border-b border-[#3D2619] bg-[#23150F]">
        <p className="text-xs text-amber-400 font-medium">Logged in as:</p>
        <p className="text-sm font-semibold text-white truncate">{user?.name || "Administrator"}</p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-800/60">
          {user?.role || "ADMIN"}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-amber-400/70 uppercase tracking-wider mb-2 px-3">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-amber-700/40 text-amber-200 border border-amber-600/50 shadow-sm"
                  : "text-amber-100/80 hover:bg-[#2C1910] hover:text-white"
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-[#3D2619]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-amber-300 bg-[#251610] hover:bg-[#351E14] border border-[#44271A] transition-colors"
        >
          🚪 Keluar
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

