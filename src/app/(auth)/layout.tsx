import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Akses Sistem - Kopi Mahasiswa",
  description: "Portal masuk untuk staf dan pelanggan Kopi Mahasiswa.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── KIRI: Konten Auth ─────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 bg-white border-r border-slate-200">
        <div className="w-full max-w-sm relative z-10">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              KM
            </div>
            <span className="font-display font-bold text-slate-900 text-lg tracking-tight">
              Kopi Mahasiswa
            </span>
          </Link>

          {/* Form Content */}
          <div className="bg-white rounded-xl">
            {children}
          </div>

          <p className="mt-12 text-center text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Kopi Mahasiswa Inc.
          </p>
        </div>
      </div>

      {/* ── KANAN: Corporate Branding ──────────────────────────────────────── */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-900 flex-col justify-between p-16">
        
        {/* Abstract Background Pattern (SaaS Style) */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10">
          {/* Top subtle branding */}
          <div className="text-white/40 text-sm font-medium tracking-widest uppercase mb-16">
            Enterprise Grade System
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Standardisasi operasional untuk efisiensi maksimal.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-md">
            Platform kami memproses lebih dari 10,000+ transaksi harian dengan tingkat reliabilitas 99.9%. Bergabung bersama kami mengelola bisnis dengan data yang presisi.
          </p>
          
          <div className="flex gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 backdrop-blur">
              <div className="text-white font-bold text-xl mb-1">99.9%</div>
              <div className="text-slate-400 text-xs font-medium">Uptime SLA</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 backdrop-blur">
              <div className="text-white font-bold text-xl mb-1">E2E</div>
              <div className="text-slate-400 text-xs font-medium">Enkripsi Data</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 backdrop-blur">
              <div className="text-white font-bold text-xl mb-1">24/7</div>
              <div className="text-slate-400 text-xs font-medium">Dukungan Teknis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
