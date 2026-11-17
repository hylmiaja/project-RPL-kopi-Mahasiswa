import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Validate input using Zod schema (includes mandatory phone and normalization)
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors.map(e => e.message).join(", ") }, { status: 400 });
    }
    const { name, email, password, phone, role } = parsed.data;

    // Dynamic import agar bcrypt tidak di-bundle di edge
    const bcrypt = (await import("bcryptjs")).default;
    const { prisma } = await import("@/lib/prisma");

    // Cek duplikasi email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    // Cek duplikasi nomor WA (phone) – harus unik
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: "Nomor WhatsApp sudah terdaftar" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role || "PELANGGAN",
      },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    return NextResponse.json({ message: "Akun berhasil dibuat", user }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
