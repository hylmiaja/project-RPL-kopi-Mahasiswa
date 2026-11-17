"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     data.name,
          email:    data.email,
          password: data.password,
          phone:    data.phone,
          role:     data.role,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Gagal memproses pendaftaran.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.");
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Registrasi Berhasil</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Kredensial Anda telah disimpan. Mengalihkan ke halaman akses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Pendaftaran Pengguna Baru</h1>
        <p className="text-slate-500 text-sm">Lengkapi data untuk membuat kredensial akses</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
          <input
            type="text"
            placeholder="Sesuai identitas resmi"
            className="input-professional"
            {...register("name")}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat Email</label>
          <input
            type="email"
            placeholder="nama@perusahaan.com"
            className="input-professional"
            {...register("email")}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon (Opsional)</label>
          <input
            type="tel"
            placeholder="08xx-xxxx-xxxx"
            className="input-professional"
            {...register("phone")}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Tingkat Akses (Role)</label>
          <select
            className="input-professional cursor-pointer bg-white"
            {...register("role")}
          >
            <option value="PELANGGAN">Customer Portal</option>
            <option value="KASIR">Cashier System</option>
            <option value="PETUGAS_STOK">Inventory Manager</option>
            <option value="ADMIN">Administrator</option>
            <option value="OWNER">Business Owner</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi</label>
            <input
              type="password"
              placeholder="Min. 8 karakter"
              className="input-professional"
              {...register("password")}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Konfirmasi</label>
            <input
              type="password"
              placeholder="Ulangi kata sandi"
              className="input-professional"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full mt-4 flex justify-center items-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : "Proses Registrasi"}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm text-slate-500 pt-4 border-t border-slate-100">
        Sudah memiliki kredensial?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Masuk ke Sistem
        </Link>
      </p>
    </div>
  );
}
