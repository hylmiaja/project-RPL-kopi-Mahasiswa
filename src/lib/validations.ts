import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nama wajib diisi")
      .min(2, "Nama minimal 2 karakter"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    role: z.string().optional(),
    phone: z
      .string()
      .min(1, "Nomor WhatsApp wajib diisi")
      .refine(
        (val) => /^[0-9+\-\s]{8,15}$/.test(val),
        "Format nomor telepon tidak valid"
      )
      .transform((val) => {
        // Hapus spasi dan tanda hubung
        let cleaned = val.replace(/[\s\-]/g, "");
        // Normalisasi: jika dimulai dengan 0, ganti dengan +62 (Indonesia)
        if (cleaned.startsWith("0")) {
          cleaned = "+62" + cleaned.slice(1);
        } else if (!cleaned.startsWith("+")) {
          // Asumsi default Indonesia jika tidak ada kode negara
          cleaned = "+62" + cleaned;
        }
        return cleaned;
      }),
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .min(8, "Password minimal 8 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password harus mengandung huruf besar, huruf kecil, dan angka"
      ),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginInput    = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
