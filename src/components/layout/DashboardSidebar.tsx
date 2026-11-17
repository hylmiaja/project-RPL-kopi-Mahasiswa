"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { Role } from "@/lib/constants";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

const ic = (d: string) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/dashboard/admin",           label: "Overview",          icon: ic("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6") },
    { href: "/dashboard/admin/pengguna",  label: "User Management",   icon: ic("M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z") },
    { href: "/dashboard/admin/menu",      label: "Product Catalog",   icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2") },
    { href: "/dashboard/admin/pesanan",   label: "Order History",     icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01") },
    { href: "/dashboard/admin/promo",     label: "Campaigns",         icon: ic("M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z") },
    { href: "/dashboard/admin/supplier",  label: "Vendors",           icon: ic("M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z") },
    { href: "/dashboard/admin/ai",        label: "🤖 Pengaturan AI",   icon: ic("M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z") },
  ],
  OWNER: [
    { href: "/dashboard/owner",            label: "Overview",            icon: ic("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6") },
    { href: "/dashboard/owner/laporan",    label: "Analytics & AI",      icon: ic("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z") },
    { href: "/dashboard/admin/ai",         label: "🤖 Pengaturan AI",    icon: ic("M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z") },
    { href: "/dashboard/owner/pengaturan", label: "System Settings",     icon: ic("M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z") },
  ],
  KASIR: [
    { href: "/dashboard/kasir",          label: "Overview",       icon: ic("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6") },
    { href: "/dashboard/kasir/pos",      label: "Point of Sale",  icon: ic("M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z") },
    { href: "/dashboard/kasir/pesanan",  label: "Active Orders",  icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01") },
  ],
  PELANGGAN: [
    { href: "/dashboard/pelanggan",           label: "Overview",        icon: ic("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6") },
    { href: "/dashboard/pelanggan/katalog",   label: "Browse Menu",     icon: ic("M4 6h16M4 10h16M4 14h16M4 18h16") },
    { href: "/dashboard/pelanggan/keranjang", label: "My Cart",         icon: ic("M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z") },
    { href: "/dashboard/pelanggan/pesanan",   label: "Order History",   icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2") },
  ],
  PETUGAS_STOK: [
    { href: "/dashboard/stok",                label: "Overview",          icon: ic("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6") },
    { href: "/dashboard/stok/bahan-baku",     label: "Inventory",         icon: ic("M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4") },
    { href: "/dashboard/stok/purchase-order", label: "Purchase Orders",   icon: ic("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z") },
    { href: "/dashboard/stok/penerimaan",     label: "Inbound Logistics", icon: ic("M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4") },
  ],
};

interface DashboardSidebarProps {
  user: { name: string; email: string; role: Role; image: string | null; };
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[user.role] ?? [];

  const roleLabels: Record<Role, string> = {
    ADMIN:        "Administrator",
    OWNER:        "Business Owner",
    KASIR:        "Cashier System",
    PELANGGAN:    "Customer Portal",
    PETUGAS_STOK: "Inventory Manager",
  };

  const roleColors: Record<Role, string> = {
    ADMIN:        "bg-slate-100 text-slate-700",
    OWNER:        "bg-blue-100 text-blue-700",
    KASIR:        "bg-emerald-100 text-emerald-700",
    PELANGGAN:    "bg-purple-100 text-purple-700",
    PETUGAS_STOK: "bg-amber-100 text-amber-700",
  };

  return (
    <aside className="w-[280px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-screen relative z-10 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          KM
        </div>
        <span className="font-display font-bold text-slate-900 text-lg tracking-tight truncate">
          Workspace
        </span>
      </div>

      {/* User Info */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <span className="text-slate-700 text-sm font-bold">
              {getInitials(user.name)}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-900 truncate leading-none mb-1.5">{user.name}</p>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${roleColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm nav-item",
                isActive 
                  ? "nav-active bg-blue-50 text-blue-700 font-medium" 
                  : "text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <span className={isActive ? "text-blue-600" : "text-slate-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
