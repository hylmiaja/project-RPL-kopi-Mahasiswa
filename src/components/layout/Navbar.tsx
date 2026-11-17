"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { RoleBadge } from "@/components/ui/Badge";
import { getInitials } from "@/lib/utils";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants";
import { Role } from "@/lib/constants";
import NotificationCenter from "@/components/layout/NotificationCenter";

const NAV_LINKS = [
  { href: "/",          label: "Beranda"   },
  { href: "/menu",      label: "Katalog"   },
  { href: "/about",     label: "Tentang"   },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname        = usePathname();
  const { data: session, status } = useSession();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardPath = session?.user?.role
    ? ROLE_DASHBOARD_PATHS[session.user.role as Role]
    : "/dashboard";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              KM
            </div>
            <span className="font-display font-bold text-slate-900 text-lg tracking-tight">
              Kopi Mahasiswa
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-24 h-9 rounded-md bg-slate-100 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <NotificationCenter inline={true} />
                <Link href={dashboardPath}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-slate-700 text-[10px] font-bold">
                        {getInitials(session.user?.name ?? "U")}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900 leading-none">
                        {session.user?.name?.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-md hover:bg-red-50"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2">
                    Masuk
                  </button>
                </Link>
                <Link href="/register">
                  <button className="btn-primary py-2 px-4">Daftar</button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 bg-white shadow-lg absolute left-0 right-0 top-16 px-4">
            <div className="flex flex-col gap-1 mt-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                {session ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(session.user?.name ?? "U")}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900 leading-tight">
                            {session.user?.name}
                          </span>
                          <span className="text-[11px] text-slate-500">{session.user?.email}</span>
                        </div>
                      </div>
                      <NotificationCenter inline={true} />
                    </div>
                    <Link href={dashboardPath} onClick={() => setMenuOpen(false)}>
                      <button className="btn-secondary w-full">Dashboard</button>
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-red-600 font-medium py-3 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      <button className="btn-secondary w-full mb-2">Masuk</button>
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}>
                      <button className="btn-primary w-full">Daftar</button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
