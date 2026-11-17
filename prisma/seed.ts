// prisma/seed.ts
// Jalankan dengan: npx ts-node prisma/seed.ts
// atau: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_ACCOUNTS = [
  { name: "Admin Kopi",   email: "admin@kopimahasiswa.com",     role: "ADMIN"        },
  { name: "Owner Kopi",   email: "owner@kopimahasiswa.com",     role: "OWNER"        },
  { name: "Kasir Kopi",   email: "kasir@kopimahasiswa.com",     role: "KASIR"        },
  { name: "Kasir Dua",    email: "kasir2@kopimahasiswa.com",    role: "KASIR"        },
  { name: "Petugas Stok", email: "stok@kopimahasiswa.com",      role: "PETUGAS_STOK" },
  { name: "Budi Santoso", email: "pelanggan@kopimahasiswa.com", role: "PELANGGAN"    },
];

const DEMO_PASSWORD = "password123";

async function main() {
  console.log("🌱 Seeding demo accounts...\n");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const acc of DEMO_ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (existing) {
      console.log(`  ⚠️  Sudah ada: ${acc.email} (${acc.role})`);
      continue;
    }

    await prisma.user.create({
      data: {
        name:     acc.name,
        email:    acc.email,
        password: hashedPassword,
        role:     acc.role,
        isActive: true,
      },
    });

    console.log(`  ✅ Dibuat: ${acc.name} <${acc.email}> — ${acc.role}`);
  }

  console.log("\n✨ Seeding selesai!");
  console.log(`📌 Password semua akun demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
