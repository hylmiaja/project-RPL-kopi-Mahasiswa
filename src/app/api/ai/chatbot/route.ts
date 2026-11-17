import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ─────────────────────────────────────────
// Struktur Data Penuh Database (Full Database Access)
// ─────────────────────────────────────────

interface FullDatabaseData {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
  }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    description: string | null;
    active: boolean;
    category?: { name: string; slug: string } | null;
    recipes?: Array<{
      quantity: number;
      ingredient: { name: string; unit: string; costPerUnit: number };
    }>;
  }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  ingredients: Array<{
    id: string;
    name: string;
    unit: string;
    stock: number;
    minStock: number;
    costPerUnit: number;
    averageCost: number;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    contactInfo: string | null;
    address: string | null;
  }>;
  orders: Array<{
    id: string;
    code: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    user?: { name: string; email: string } | null;
    kasir?: { name: string } | null;
    items?: Array<{
      quantity: number;
      subtotal: number;
      product?: { name: string } | null;
    }>;
    payment?: {
      method: string;
      amountPaid: number;
    } | null;
  }>;
  promotions: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    active: boolean;
  }>;
  schedules: Array<{
    id: string;
    hari: string;
    jamBuka: string;
    jamTutup: string;
    shiftKasir: string | null;
  }>;
  events: Array<{
    id: string;
    title: string;
    date: Date;
    time: string;
    capacity: number;
    price: number;
  }>;
  bookings: Array<{
    id: string;
    seats: number;
    totalAmount: number;
    status: string;
    event?: { title: string } | null;
    user?: { name: string } | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    product?: { name: string } | null;
    user?: { name: string } | null;
  }>;
  rewards: Array<{
    id: string;
    userId?: string;
    poin: number;
    user?: { name: string; email: string } | null;
  }>;
  purchaseOrders: Array<{
    id: string;
    code: string;
    status: string;
    createdAt?: Date;
    supplier?: { name: string } | null;
    items?: Array<{
      quantity: number;
      totalCost: number;
      unitCost?: number;
      ingredient?: { name: string; unit?: string } | null;
    }>;
  }>;
  stockMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    description: string | null;
    createdAt: Date;
    ingredient?: { name: string; unit: string } | null;
  }>;
  metrics: {
    totalUsers: number;
    totalPelanggan: number;
    activePelanggan: number;
    inactivePelanggan: number;
    totalKasir: number;
    totalPetugasStok: number;
    totalAdmin: number;
    totalOwner: number;
    totalProducts: number;
    totalIngredients: number;
    totalSuppliers: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    totalEvents: number;
    totalPromotions: number;
    totalPurchaseOrders: number;
  };
  orderInfo?: any;
  searchedOrderCode?: string | null;
}

// ─────────────────────────────────────────
// Ambil Seluruh Data Database (Full Database Loader)
// ─────────────────────────────────────────

async function fetchFullDatabaseSnapshot(userQuery: string): Promise<FullDatabaseData> {
  try {
    const [
      users,
      products,
      categories,
      ingredients,
      suppliers,
      orders,
      promotions,
      schedules,
      events,
      bookings,
      reviews,
      rewards,
      purchaseOrders,
      stockMovements,
      revenueAggregate,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        include: {
          category: { select: { name: true, slug: true } },
          recipes: {
            include: {
              ingredient: { select: { name: true, unit: true, costPerUnit: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
      prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.order.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          kasir: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
          payment: { select: { method: true, amountPaid: true } },
        },
      }),
      prisma.promotion.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.schedule.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.event.findMany({
        take: 10,
        orderBy: { date: 'asc' },
      }),
      prisma.booking.findMany({
        take: 10,
        include: {
          event: { select: { title: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.review.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.reward.findMany({
        take: 30,
        select: {
          id: true,
          userId: true,
          poin: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.purchaseOrder.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { name: true } },
          items: {
            include: {
              ingredient: { select: { name: true, unit: true } },
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          ingredient: { select: { name: true, unit: true } },
        },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: 'CANCELLED' } },
      }),
    ]);

    // Deteksi pencarian kode pesanan spesifik
    let orderInfo = null;
    let searchedOrderCode: string | null = null;
    const orderMatch =
      userQuery.match(/ORD-[A-Za-z0-9]+/i) || userQuery.match(/\b(ORD[0-9]+)\b/i);
    if (orderMatch) {
      searchedOrderCode = orderMatch[0].toUpperCase();
      orderInfo = orders.find(
        (o) =>
          o.code.toUpperCase() === searchedOrderCode ||
          o.id.toUpperCase() === searchedOrderCode
      );
      if (!orderInfo) {
        orderInfo = await prisma.order.findFirst({
          where: {
            OR: [
              { code: { equals: searchedOrderCode } },
              { id: { equals: searchedOrderCode } },
            ],
          },
          include: {
            user: { select: { name: true, email: true } },
            kasir: { select: { name: true } },
            items: { include: { product: { select: { name: true } } } },
            payment: true,
          },
        });
      }
    }

    const totalPelanggan = users.filter((u) => u.role === 'PELANGGAN').length;
    const activePelanggan = users.filter((u) => u.role === 'PELANGGAN' && u.isActive).length;
    const inactivePelanggan = totalPelanggan - activePelanggan;

    const metrics = {
      totalUsers: users.length,
      totalPelanggan,
      activePelanggan,
      inactivePelanggan,
      totalKasir: users.filter((u) => u.role === 'KASIR').length,
      totalPetugasStok: users.filter((u) => u.role === 'PETUGAS_STOK').length,
      totalAdmin: users.filter((u) => u.role === 'ADMIN').length,
      totalOwner: users.filter((u) => u.role === 'OWNER').length,
      totalProducts: products.length,
      totalIngredients: ingredients.length,
      totalSuppliers: suppliers.length,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
      completedOrders: orders.filter((o) =>
        ['COMPLETED', 'PAID', 'SELESAI', 'SUCCESS'].includes(o.status)
      ).length,
      totalRevenue: revenueAggregate._sum.totalAmount || 0,
      totalEvents: events.length,
      totalPromotions: promotions.filter((p) => p.active).length,
      totalPurchaseOrders: purchaseOrders.length,
    };

    return {
      users,
      products,
      categories,
      ingredients,
      suppliers,
      orders,
      promotions,
      schedules,
      events,
      bookings,
      reviews,
      rewards,
      purchaseOrders,
      stockMovements,
      metrics,
      orderInfo,
      searchedOrderCode,
    };
  } catch (error) {
    console.error('Error fetching full database snapshot:', error);
    return {
      users: [],
      products: [],
      categories: [],
      ingredients: [],
      suppliers: [],
      orders: [],
      promotions: [],
      schedules: [],
      events: [],
      bookings: [],
      reviews: [],
      rewards: [],
      purchaseOrders: [],
      stockMovements: [],
      metrics: {
        totalUsers: 0,
        totalPelanggan: 0,
        activePelanggan: 0,
        inactivePelanggan: 0,
        totalKasir: 0,
        totalPetugasStok: 0,
        totalAdmin: 0,
        totalOwner: 0,
        totalProducts: 0,
        totalIngredients: 0,
        totalSuppliers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        totalEvents: 0,
        totalPromotions: 0,
        totalPurchaseOrders: 0,
      },
    };
  }
}

// ─────────────────────────────────────────
// Respon Cerdas & Format Laporan WhatsApp / Email (Full Database Engine)
// ─────────────────────────────────────────

export interface ActionButton {
  type: 'whatsapp' | 'email';
  label: string;
  url: string;
  target?: string;
  text?: string;
  subject?: string;
}

export interface BaristaResponse {
  reply: string;
  actions?: ActionButton[];
}

function cleanPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  }
  return clean;
}

function getStaffContacts(users: FullDatabaseData['users']) {
  const owner = users.find((u) => u.role === 'OWNER') || {
    id: 'owner',
    name: 'Owner Kopi',
    email: 'owner@kopimahasiswa.com',
    phone: '082222222222',
    role: 'OWNER',
    isActive: true,
    createdAt: new Date(),
  };
  const admin = users.find((u) => u.role === 'ADMIN') || {
    id: 'admin',
    name: 'Admin Kopi',
    email: 'admin@kopimahasiswa.com',
    phone: '081111111111',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(),
  };
  const stok = users.find((u) => u.role === 'PETUGAS_STOK') || {
    id: 'stok',
    name: 'Petugas Stok',
    email: 'stok@kopimahasiswa.com',
    phone: '084444444444',
    role: 'PETUGAS_STOK',
    isActive: true,
    createdAt: new Date(),
  };
  const kasir = users.find((u) => u.role === 'KASIR') || {
    id: 'kasir',
    name: 'Kasir Kopi',
    email: 'kasir@kopimahasiswa.com',
    phone: '083333333333',
    role: 'KASIR',
    isActive: true,
    createdAt: new Date(),
  };
  return { owner, admin, stok, kasir };
}

// ─────────────────────────────────────────
// Deteksi Perintah Eksplisit Laporan WhatsApp / Email
// ─────────────────────────────────────────
/**
 * Memeriksa apakah user secara EKSPLISIT memerintahkan chatbot untuk:
 * - Mengirim laporan ke WhatsApp / Email
 * - Meminta tombol kirim / bagikan laporan
 * 
 * ATURAN: Jika user hanya bertanya informasi (misal: "siapa saja pelanggan", "berapa omset",
 * "stok susu", "daftar akun", "total pesanan"), fungsi ini mengembalikan false,
 * sehingga tombol aksi WhatsApp/Email TIDAK AKAN MUNCUL sama sekali.
 */
function isExplicitReportCommand(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase().trim();

  // 1. Frasa perintah langsung mengirim / membagikan laporan
  const explicitPhrases = [
    'kirim laporan',
    'kirimkan laporan',
    'kirim rekap',
    'kirimkan rekap',
    'kirim ke wa',
    'kirim ke whatsapp',
    'kirim ke email',
    'kirim wa',
    'kirim email',
    'bagikan laporan',
    'share laporan',
    'forward laporan',
    'teruskan laporan',
    'laporkan ke wa',
    'laporkan ke whatsapp',
    'laporkan ke email',
    'laporkan ke admin',
    'laporkan ke owner',
    'laporkan ke kasir',
    'laporkan ke petugas stok',
    'buatkan tombol',
    'minta tombol',
    'tampilkan tombol',
    'tombol kirim',
    'tombol wa',
    'tombol whatsapp',
    'tombol email',
    'tombol laporan',
    'kirim struk',
    'kirimkan struk',
    'kirim nota',
    'kirimkan nota',
    'kirim invoice',
    'kirimkan invoice',
  ];

  if (explicitPhrases.some((phrase) => q.includes(phrase))) {
    return true;
  }

  // 2. Kombinasi kata kerja aksi kirim + target media / jenis laporan
  const actionVerbs = ['kirim', 'kirimkan', 'share', 'bagikan', 'forward', 'teruskan', 'ekspor', 'export'];
  const mediaTargets = ['wa', 'whatsapp', 'email', 'owner', 'admin', 'petugas stok'];
  const reportNouns = ['laporan', 'rekap', 'struk', 'nota', 'invoice', 'tombol'];

  const hasVerb = actionVerbs.some((v) => q.includes(v));
  const hasMedia = mediaTargets.some((m) => q.includes(m));
  const hasReportNoun = reportNouns.some((r) => q.includes(r));

  return hasVerb && (hasMedia || hasReportNoun);
}

// ─────────────────────────────────────────
// Generator Laporan Eksekutif (Owner & Admin)
// ─────────────────────────────────────────
function buildSalesReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isExplicitReport: boolean = false
): BaristaResponse {
  const { owner, admin } = getStaffContacts(db.users);
  const m = db.metrics;
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const avg = m.totalOrders > 0 ? Math.round(m.totalRevenue / m.totalOrders) : 0;

  const recentOrdersStr = db.orders
    .slice(0, 5)
    .map(
      (o) =>
        `• ${o.code} (${o.user?.name || 'Walk-in'}): Rp ${o.totalAmount.toLocaleString(
          'id-ID'
        )} [${o.status}]`
    )
    .join('\n');

  const waText = `*📊 LAPORAN PENJUALAN & OMSET - KOPI MAHASISWA* ☕
📅 *Waktu Cetak:* ${dateStr}, ${timeStr} WIB
👤 *Pembuat Laporan:* ${userName || userRole} (${userRole})
🎯 *Target:* Owner & Admin Manajemen

*💰 RINGKASAN FINANSIAL REAL-TIME:*
• Total Omset: *Rp ${m.totalRevenue.toLocaleString('id-ID')}*
• Total Pesanan: *${m.totalOrders} transaksi*
• Pesanan Selesai/Lunas: *${m.completedOrders} order*
• Pesanan Pending: *${m.pendingOrders} order*
• Rata-rata per Pesanan: *Rp ${avg.toLocaleString('id-ID')}*

*👥 METRIK PELANGGAN:*
• Total Pelanggan: *${m.totalPelanggan} orang* (🟢 ${m.activePelanggan} aktif | 🔴 ${m.inactivePelanggan} nonaktif)

*📋 5 TRANSAKSI TERAKHIR:*
${recentOrdersStr || 'Belum ada transaksi'}

---
_Laporan otomatis langsung dari AI Barista Kopi Mahasiswa_`;

  const ownerPhone = cleanPhoneForWhatsApp(owner.phone);
  const adminPhone = cleanPhoneForWhatsApp(admin.phone);

  const actions: ActionButton[] = isExplicitReport
    ? [
        {
          type: 'whatsapp',
          label: '📲 Kirim ke WhatsApp Owner',
          target: owner.phone || '082222222222',
          url: `https://api.whatsapp.com/send?phone=${ownerPhone}&text=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'email',
          label: '📧 Kirim ke Email Owner',
          target: owner.email,
          subject: `[LAPORAN OMSET] Ringkasan Penjualan Kopi Mahasiswa - ${dateStr}`,
          url: `mailto:${encodeURIComponent(owner.email)}?subject=${encodeURIComponent(
            `[LAPORAN OMSET] Ringkasan Penjualan Kopi Mahasiswa - ${dateStr}`
          )}&body=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'whatsapp',
          label: '📲 Kirim ke WhatsApp Admin',
          target: admin.phone || '081111111111',
          url: `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(waText)}`,
          text: waText,
        },
      ]
    : [];

  let reply = `📊 Laporan Penjualan & Omset Eksekutif\n\n`;
  reply += `📅 Tanggal: ${dateStr} (${timeStr} WIB)\n`;
  reply += `👤 Pembuat: ${userName || userRole} (${userRole})\n\n`;
  reply += `💰 Ringkasan Finansial Real-Time:\n`;
  reply += `• Total Omset Terkumpul: Rp ${m.totalRevenue.toLocaleString('id-ID')}\n`;
  reply += `• Total Transaksi: ${m.totalOrders} order (Selesai: ${m.completedOrders} | Pending: ${m.pendingOrders})\n`;
  reply += `• Rata-rata Transaksi: Rp ${avg.toLocaleString('id-ID')}\n`;
  reply += `• Pelanggan Terdaftar: ${m.totalPelanggan} orang (${m.activePelanggan} aktif)\n\n`;
  if (actions.length > 0) {
    reply += `📲 Laporan telah diformat profesional untuk WhatsApp & Email!\n`;
    reply += `Klik salah satu tombol aksi di bawah untuk langsung meneruskan laporan ini ke Owner (${owner.phone || owner.email}) atau Admin (${admin.phone || admin.email}):`;
  }

  return { reply: reply.trim(), actions };
}

// ─────────────────────────────────────────
// Generator Laporan Stok & Bahan Baku (Petugas Stok & Gudang)
// ─────────────────────────────────────────
function buildStockReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isExplicitReport: boolean = false
): BaristaResponse {
  const { stok, owner } = getStaffContacts(db.users);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const criticalItems = db.ingredients.filter((i) => i.stock <= i.minStock);
  const warningItems = db.ingredients.filter(
    (i) => i.stock > i.minStock && i.stock <= i.minStock * 1.5
  );
  const safeItems = db.ingredients.filter((i) => i.stock > i.minStock * 1.5);

  const criticalStr =
    criticalItems.length > 0
      ? criticalItems
          .map(
            (i) =>
              `• 🔴 ${i.name}: Sisa ${i.stock} ${i.unit} (Batas Min: ${i.minStock} ${i.unit}) -> PERLU RESTOCK SEGERA!`
          )
          .join('\n')
      : '• ✅ Tidak ada bahan baku dalam kondisi kritis.';

  const warningStr =
    warningItems.length > 0
      ? warningItems
          .map(
            (i) =>
              `• 🟡 ${i.name}: Sisa ${i.stock} ${i.unit} (Batas Min: ${i.minStock} ${i.unit}) -> Mulai Menipis`
          )
          .join('\n')
      : '• ✅ Tidak ada bahan baku yang menipis.';

  const supplierListStr = db.suppliers
    .slice(0, 4)
    .map((s) => `• 🏢 ${s.name} (📞 ${s.contactInfo || '-'})`)
    .join('\n');

  const waText = `*⚠️ LAPORAN INVENTARIS & STOK BAHAN BAKU - KOPI MAHASISWA* 📦
📅 *Waktu Cetak:* ${dateStr}, ${timeStr} WIB
👤 *Pembuat Laporan:* ${userName || userRole} (${userRole})
🎯 *Target:* Petugas Stok Gudang & Owner

*🚨 STATUS BAHAN BAKU KRITIS (PERLU RESTOCK):*
${criticalStr}

*⚠️ BAHAN BAKU MULAI MENIPIS:*
${warningStr}

*📊 TOTAL INVENTARIS GUDANG:*
• Total Item: *${db.ingredients.length} bahan baku*
• Kondisi Kritis: *${criticalItems.length} item*
• Kondisi Menipis: *${warningItems.length} item*
• Kondisi Aman: *${safeItems.length} item*

*🏢 REKOMENDASI KONTAK SUPPLIER / PEMASOK:*
${supplierListStr || 'Belum ada supplier'}

---
_Penting: Segera lakukan Purchase Order (PO) untuk bahan baku bertanda KRITIS._
_Laporan otomatis langsung dari AI Barista Kopi Mahasiswa_`;

  const stokPhone = cleanPhoneForWhatsApp(stok.phone);
  const ownerPhone = cleanPhoneForWhatsApp(owner.phone);

  const actions: ActionButton[] = isExplicitReport
    ? [
        {
          type: 'whatsapp',
          label: '📲 Kirim ke WhatsApp Petugas Stok',
          target: stok.phone || '084444444444',
          url: `https://api.whatsapp.com/send?phone=${stokPhone}&text=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'email',
          label: '📧 Kirim ke Email Petugas Stok',
          target: stok.email,
          subject: `[PERINGATAN STOK] Laporan Bahan Baku Menipis Kopi Mahasiswa - ${dateStr}`,
          url: `mailto:${encodeURIComponent(stok.email)}?subject=${encodeURIComponent(
            `[PERINGATAN STOK] Laporan Bahan Baku Menipis Kopi Mahasiswa - ${dateStr}`
          )}&body=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'whatsapp',
          label: '📲 Lapor Stok ke WhatsApp Owner',
          target: owner.phone || '082222222222',
          url: `https://api.whatsapp.com/send?phone=${ownerPhone}&text=${encodeURIComponent(waText)}`,
          text: waText,
        },
      ]
    : [];

  let reply = `📦 Laporan Bahan Baku & Stok Kritis\n\n`;
  reply += `📅 Tanggal: ${dateStr} (${timeStr} WIB)\n\n`;
  reply += `🚨 Status Bahan Baku Kritis (Perlu Restock Segera):\n${criticalStr}\n\n`;
  reply += `🟡 Status Bahan Baku Menipis:\n${warningStr}\n\n`;
  reply += `📊 Ringkasan Inventaris Gudang:\n`;
  reply += `• Total Bahan: ${db.ingredients.length} item (🔴 Kritis: ${criticalItems.length}, 🟡 Menipis: ${warningItems.length}, 🟢 Aman: ${safeItems.length})\n\n`;
  if (actions.length > 0) {
    reply += `📲 Laporan siap dikirimkan langsung ke Petugas Stok (${stok.phone || stok.email}) atau Owner! Klik tombol aksi di bawah:`;
  }

  return { reply: reply.trim(), actions };
}

// ─────────────────────────────────────────
// Generator Notifikasi Pembelian & Struk (Pelanggan & Kasir)
// ─────────────────────────────────────────
function buildOrderNotification(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  searchedOrderCode?: string | null,
  isExplicitReport: boolean = false
): BaristaResponse {
  const { kasir, admin } = getStaffContacts(db.users);
  const order = db.orderInfo || db.orders[0];

  if (!order) {
    const sampleCode = searchedOrderCode || 'ORD-1042';
    const customerName = userName || 'Pelanggan Kopi';
    const customerEmail = 'pelanggan@kopimahasiswa.com';
    const orderDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const waText = `*☕ STRUK & NOTIFIKASI PEMBELIAN - KOPI MAHASISWA* 🧾\n🆔 *Kode Pesanan:* #${sampleCode}\n👤 *Nama Pelanggan:* ${customerName}\n📅 *Waktu Pesanan:* ${orderDate} WIB\n\n*📋 RINCIAN MENU:*\n• 2x Signature Latte (Rp 48.000)\n• 1x Cold Brew Original (Rp 20.000)\n\n*💰 TOTAL PEMBAYARAN:* *Rp 68.000*\n💳 *Status Pembayaran:* ✅ Lunas via QRIS\n⏳ *Status Pesanan:* ☕ Sedang Disiapkan Barista\n\n📍 _Tunjukkan notifikasi ini kepada kasir/barista saat pengambilan._\n_Terima kasih telah memesan di Kopi Mahasiswa! Nikmati harimu!_ ✨☕`;

    const kasirPhone = cleanPhoneForWhatsApp(kasir.phone);

    const actions: ActionButton[] = isExplicitReport
      ? [
          {
            type: 'whatsapp',
            label: '📲 Kirim Struk ke WhatsApp Pelanggan',
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`,
            text: waText,
          },
          {
            type: 'email',
            label: '📧 Kirim Bukti ke Email Pelanggan',
            target: customerEmail,
            subject: `[BUKTI PESANAN] Kopi Mahasiswa #${sampleCode}`,
            url: `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(
              `[BUKTI PESANAN] Kopi Mahasiswa #${sampleCode}`
            )}&body=${encodeURIComponent(waText)}`,
            text: waText,
          },
          {
            type: 'whatsapp',
            label: '🔔 Teruskan Alert ke Kasir',
            target: kasir.phone || '083333333333',
            url: `https://api.whatsapp.com/send?phone=${kasirPhone}&text=${encodeURIComponent(
              `🔔 *NOTIFIKASI PESANAN BARU MASUK*\n\n${waText}`
            )}`,
            text: waText,
          },
        ]
      : [];

    let reply = `🧾 Notifikasi Pembelian & Struk Digital #${sampleCode}\n\n`;
    reply += `👤 Pelanggan: ${customerName}\n`;
    reply += `📅 Waktu: ${orderDate} WIB\n`;
    reply += `📋 Rincian Pesanan:\n• 2x Signature Latte (Rp 48.000)\n• 1x Cold Brew Original (Rp 20.000)\n\n`;
    reply += `💰 Total Pembayaran: Rp 68.000\n`;
    reply += `💳 Status Bayar: Lunas via QRIS\n`;
    reply += `⏳ Status Pesanan: Sedang Disiapkan Barista\n\n`;
    if (actions.length > 0) {
      reply += `📲 Struk notifikasi siap dikirim via WhatsApp atau Email! Silakan gunakan tombol di bawah:`;
    }

    return { reply: reply.trim(), actions };
  }

  const customerName = order.user?.name || userName || 'Pelanggan Kopi';
  const customerEmail = order.user?.email || 'pelanggan@kopimahasiswa.com';
  const orderDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemList =
    (order.items || [])
      .map(
        (it: any) =>
          `• ${it.quantity}x ${it.product?.name || 'Item Kopi'} (Rp ${(
            it.subtotal || 0
          ).toLocaleString('id-ID')})`
      )
      .join('\n') || '• 1x Menu Pilihan Kopi Mahasiswa';

  const paymentStatus = order.payment
    ? `✅ Lunas via ${order.payment.method}`
    : '⏳ Menunggu Pembayaran';

  const waText = `*☕ STRUK & NOTIFIKASI PEMBELIAN - KOPI MAHASISWA* 🧾
🆔 *Kode Pesanan:* #${order.code}
👤 *Nama Pelanggan:* ${customerName}
📅 *Waktu Pesanan:* ${orderDate} WIB

*📋 RINCIAN MENU:*
${itemList}

*💰 TOTAL PEMBAYARAN:* *Rp ${order.totalAmount.toLocaleString('id-ID')}*
💳 *Status Pembayaran:* ${paymentStatus}
⏳ *Status Pesanan:* ${order.status}
🧑‍🍳 *Kasir:* ${order.kasir?.name || 'Sistem Kasir Online'}

📍 _Tunjukkan notifikasi ini kepada kasir/barista saat pengambilan pesanan._
_Terima kasih telah memesan di Kopi Mahasiswa! Nikmati hari dan kopimu!_ ✨☕`;

  const kasirPhone = cleanPhoneForWhatsApp(kasir.phone);

  const actions: ActionButton[] = isExplicitReport
    ? [
        {
          type: 'whatsapp',
          label: '📲 Kirim Struk ke WhatsApp Pelanggan',
          url: `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'email',
          label: '📧 Kirim Bukti ke Email Pelanggan',
          target: customerEmail,
          subject: `[BUKTI PESANAN] Kopi Mahasiswa #${order.code}`,
          url: `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(
            `[BUKTI PESANAN] Kopi Mahasiswa #${order.code}`
          )}&body=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'whatsapp',
          label: '🔔 Teruskan Alert ke Kasir',
          target: kasir.phone || '083333333333',
          url: `https://api.whatsapp.com/send?phone=${kasirPhone}&text=${encodeURIComponent(
            `🔔 *NOTIFIKASI PESANAN BARU MASUK*\n\n${waText}`
          )}`,
          text: waText,
        },
      ]
    : [];

  let reply = `🧾 **Notifikasi Pembelian & Struk Digital #${order.code}**\n\n`;
  reply += `👤 **Pelanggan:** ${customerName}\n`;
  reply += `📅 **Waktu:** ${orderDate} WIB\n`;
  reply += `📋 **Rincian Pesanan:**\n${itemList}\n\n`;
  reply += `💰 **Total Pembayaran:** **Rp ${order.totalAmount.toLocaleString('id-ID')}**\n`;
  reply += `💳 **Status Bayar:** ${paymentStatus}\n`;
  reply += `⏳ **Status Pesanan:** **${order.status}**\n\n`;
  if (actions.length > 0) {
    reply += `📲 **Struk notifikasi siap dikirim via WhatsApp atau Email!** Silakan gunakan tombol di bawah:`;
  }

  return { reply: reply.trim(), actions };
}

// ─────────────────────────────────────────
// Generator Laporan Rekap Pengguna (Admin)
// ─────────────────────────────────────────
function buildUserReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isExplicitReport: boolean = false
): BaristaResponse {
  const { admin } = getStaffContacts(db.users);
  const m = db.metrics;
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const waText = `*👥 LAPORAN PENGGUNA & PELANGGAN - KOPI MAHASISWA* 📋
📅 *Waktu Cetak:* ${dateStr}
👤 *Penanya:* ${userName || userRole} (${userRole})
🎯 *Target:* Admin Manajemen Sistem

*📊 REKAPITULASI PENGGUNA:*
• Total Seluruh Akun: *${m.totalUsers} pengguna*
• Total Pelanggan: *${m.totalPelanggan} orang* (🟢 ${m.activePelanggan} Aktif | 🔴 ${m.inactivePelanggan} Nonaktif)
• Kasir: *${m.totalKasir} staf*
• Petugas Stok: *${m.totalPetugasStok} staf*
• Admin: *${m.totalAdmin} staf*
• Owner: *${m.totalOwner} orang*

---
_Laporan otomatis langsung dari AI Barista Kopi Mahasiswa_`;

  const adminPhone = cleanPhoneForWhatsApp(admin.phone);

  const actions: ActionButton[] = isExplicitReport
    ? [
        {
          type: 'whatsapp',
          label: '📲 Kirim Laporan ke WhatsApp Admin',
          target: admin.phone || '081111111111',
          url: `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodeURIComponent(waText)}`,
          text: waText,
        },
        {
          type: 'email',
          label: '📧 Kirim Laporan ke Email Admin',
          target: admin.email,
          subject: `[LAPORAN PENGGUNA] Rekap Akun & Pelanggan Kopi Mahasiswa - ${dateStr}`,
          url: `mailto:${encodeURIComponent(admin.email)}?subject=${encodeURIComponent(
            `[LAPORAN PENGGUNA] Rekap Akun & Pelanggan Kopi Mahasiswa - ${dateStr}`
          )}&body=${encodeURIComponent(waText)}`,
          text: waText,
        },
      ]
    : [];

  let reply = `👥 Laporan Rekapitulasi Pengguna & Pelanggan\n\n`;
  reply += `Berdasarkan database real-time:\n`;
  reply += `• Total Pengguna: ${m.totalUsers} akun\n`;
  reply += `• Pelanggan: ${m.totalPelanggan} orang (🟢 ${m.activePelanggan} Aktif, 🔴 ${m.inactivePelanggan} Nonaktif)\n`;
  reply += `• Staf Operasional: ${m.totalKasir} Kasir, ${m.totalPetugasStok} Petugas Stok, ${m.totalAdmin} Admin, ${m.totalOwner} Owner\n\n`;
  if (actions.length > 0) {
    reply += `Klik tombol aksi di bawah untuk mengirimkan rekap ini ke WhatsApp atau Email Admin:`;
  }

  return { reply: reply.trim(), actions };
}

// ─────────────────────────────────────────
// Respon Cerdas dengan Akses Penuh Database (Full Database Engine)
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// Topik Yang Diperbolehkan (Kopi Mahasiswa Only)
// ─────────────────────────────────────────
const KOPI_TOPIC_KEYWORDS = [
  // Produk & Menu (Product Catalog)
  'kopi', 'menu', 'harga', 'latte', 'cappuccino', 'espresso', 'americano',
  'cold brew', 'matcha', 'cokelat', 'minuman', 'makanan', 'snack', 'produk',
  'katalog', 'daftar harga', 'varian', 'terlaris',
  'product catalog', 'pruduct catalog', 'katalog produk', 'katalog menu', 'daftar produk', 'semua produk',
  // Pesanan & Transaksi (Order History)
  'pesanan', 'order', 'beli', 'pembelian', 'transaksi', 'bayar', 'pembayaran',
  'struk', 'nota', 'invoice', 'qris', 'cash', 'tunai', 'total', 'kembalian',
  'order history', 'history order', 'riwayat order', 'riwayat pesanan', 'history pesanan', 'rekap pesanan',
  // Pelanggan & Akun (User Management)
  'pelanggan', 'akun', 'reward', 'poin', 'riwayat', 'status pesanan',
  'user manajemen', 'manajemen user', 'user management', 'manajemen pengguna',
  'data user', 'daftar user', 'kelola user', 'kelola pengguna', 'rekap user',
  // Laporan & Finansial
  'laporan', 'omset', 'omzet', 'penjualan', 'pendapatan', 'keuangan', 'revenue',
  'profit', 'keuntungan', 'laba', 'grafik', 'tren',
  // Stok & Inventaris & Purchase Orders (PO) & Vendors
  'stok', 'bahan baku', 'inventaris', 'gudang', 'restock', 'kritis', 'menipis',
  'biji kopi', 'susu', 'gula', 'sirup', 'supplier', 'suppliers', 'pemasok',
  'vendor', 'vendors', 'po', 'purchase order', 'purchase orders', 'pengadaan', 'po gudang', 'p.o', 'po-',
  // Operasional
  'jam buka', 'jadwal', 'operasional', 'shift', 'kasir', 'barista',
  'meja', 'tempat duduk', 'booking', 'reservasi', 'event', 'acara',
  // Promo & Reward
  'promo', 'diskon', 'voucher', 'kupon', 'reward', 'poin',
  // Sistem & Notifikasi
  'notifikasi', 'whatsapp', 'wa', 'email', 'kirim', 'laporan pengguna',
  'pengguna', 'user', 'admin', 'owner', 'petugas stok',
  // Ulasan
  'review', 'ulasan', 'rating', 'bintang',
  // Resep
  'resep', 'komposisi', 'takaran', 'cara buat',
  // Identitas Asisten & Profil Pengguna
  'siapa anda', 'siapa kamu', 'kamu siapa', 'anda siapa', 'siapakah kamu', 'siapakah anda',
  'siapa saya', 'siapa aku', 'saya siapa', 'aku siapa', 'siapakah saya', 'siapakah aku',
  'profil', 'profil saya', 'profile', 'akun saya', 'data saya', 'tentang saya', 'role saya', 'peran saya',
  'perkenalan', 'kenalan', 'siapa dirimu', 'siapa diriku', 'barista ai', 'ai barista', 'tentang anda', 'tentang kamu',
  // Database MySQL Laragon & Sistem
  'database', 'laragon', 'mysql', 'basis data', 'akses penuh', 'isi database', 'seluruh database',
  'ringkasan database', 'status database', 'cek database', 'tabel database', 'koneksi database',
  'struktur database', 'kopi_mahasiswa',
];

// Topik yang jelas di luar Kopi Mahasiswa
const OFF_TOPIC_KEYWORDS = [
  'politik', 'berita', 'sepak bola', 'film', 'musik', 'game', 'teknologi',
  'investasi', 'saham', 'kripto', 'bitcoin', 'cuaca', 'ramalan', 'zodiak',
  'bahasa pemrograman', 'coding', 'matematika', 'fisika', 'kimia', 'biologi',
  'sejarah', 'geografi', 'agama', 'hukum', 'kesehatan', 'obat', 'dokter',
  'gosip', 'artis', 'idol', 'anime', 'manga', 'drama',
];

// Kata sapaan/salam yang harus selalu diizinkan
const GREETING_KEYWORDS = [
  'halo', 'hai', 'hi', 'hey', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
  'hei', 'ola', 'assalamualaikum', 'permisi', 'pagi', 'siang', 'sore', 'malam'
];

function isBotIdentityQuery(q: string): boolean {
  const norm = q.toLowerCase().replace(/[?.,!_]/g, ' ').replace(/\s+/g, ' ').trim();

  const directPhrases = [
    'siapa anda', 'siapa kamu', 'kamu siapa', 'anda siapa',
    'siapakah anda', 'siapakah kamu', 'kamu ini siapa', 'anda ini siapa',
    'kamu itu siapa', 'anda itu siapa',
    'siapa dirimu', 'siapakah dirimu', 'tentang kamu', 'tentang anda',
    'siapa bot', 'bot siapa', 'kamu bot apa', 'kamu ai apa', 'siapa ai', 'siapakah ai',
    'nama kamu siapa', 'nama anda siapa', 'siapa nama kamu', 'siapa nama anda',
    'siapa namamu', 'namamu siapa',
    'perkenalkan dirimu', 'perkenalkan diri', 'kenalan', 'kamu siapa sih', 'anda siapa sih',
    'siapa sih kamu', 'siapa sih anda',
    'siapa yang buat kamu', 'siapa pembuatmu', 'apa tugas kamu', 'apa tugasmu',
    'fungsi kamu', 'kamu itu apa', 'apa fungsi kamu', 'kamu bisa apa', 'apa kemampuanmu',
  ];
  if (directPhrases.some((phrase) => norm.includes(phrase))) return true;

  const hasWho = norm.includes('siapa') || norm.includes('siapakah');
  const hasBotTarget =
    norm.includes('anda') ||
    norm.includes('kamu') ||
    norm.includes('bot') ||
    norm.includes('ai') ||
    norm.includes('barista') ||
    norm.includes('dirimu');
  const hasSelfUser =
    norm.includes('saya') ||
    norm.includes('aku') ||
    norm.includes('diriku') ||
    norm.includes('profilku');

  if (hasWho && hasBotTarget && !hasSelfUser) {
    return true;
  }

  return false;
}

function isUserIdentityQuery(q: string): boolean {
  if (q.includes('otp') || q.includes('verifikasi') || q.includes('kode wa')) return false;
  const norm = q.toLowerCase().replace(/[?.,!_]/g, ' ').replace(/\s+/g, ' ').trim();

  const directPhrases = [
    'siapa saya', 'siapa aku', 'saya siapa', 'aku siapa',
    'siapakah saya', 'siapakah aku', 'siapa diriku', 'siapakah diriku',
    'saya ini siapa', 'aku ini siapa',
    'profil saya', 'profile saya', 'profilku', 'profil ku',
    'tentang saya', 'data saya', 'data diriku', 'data diri saya',
    'akun saya', 'informasi saya', 'info akun saya', 'info profil',
    'role saya', 'peran saya', 'jabatan saya', 'status saya',
    'nama saya siapa', 'siapa nama saya', 'kamu kenal saya',
    'kenal saya', 'kenal aku', 'apakah kamu kenal saya',
  ];
  if (directPhrases.some((phrase) => norm.includes(phrase))) return true;

  const hasWho = norm.includes('siapa') || norm.includes('siapakah');
  const hasSelf =
    norm.includes('saya') ||
    norm.includes('aku') ||
    norm.includes('diriku') ||
    norm.includes('profilku');

  if (hasWho && hasSelf) {
    return true;
  }

  return false;
}

function isDatabaseQuery(q: string): boolean {
  const norm = q.toLowerCase();
  return (
    norm.includes('database') ||
    norm.includes('laragon') ||
    norm.includes('mysql') ||
    norm.includes('basis data') ||
    norm.includes('akses penuh') ||
    norm.includes('isi database') ||
    norm.includes('seluruh database') ||
    norm.includes('ringkasan database') ||
    norm.includes('status database') ||
    norm.includes('cek database') ||
    norm.includes('tabel database') ||
    norm.includes('koneksi database') ||
    norm.includes('struktur database') ||
    norm.includes('kopi_mahasiswa')
  );
}

function buildLaragonDatabaseResponse(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null
): BaristaResponse {
  const m = db.metrics;

  let reply = `🗄️ **Akses Penuh Database MySQL Laragon (Kopi Mahasiswa)**\n\n`;
  reply += `✅ **Ya, betul! Chatbot AI Barista memiliki akses penuh (Full Database Access) ke seluruh database Laragon secara langsung dan real-time.**\n\n`;

  reply += `🔌 **Status Koneksi Sistem:**\n`;
  reply += `• **Database Engine:** MySQL Server (Laragon)\n`;
  reply += `• **Host:** \`127.0.0.1:3306\` (Localhost)\n`;
  reply += `• **Nama Database:** \`kopi_mahasiswa\`\n`;
  reply += `• **User Default:** \`root\`\n`;
  reply += `• **ORM / Driver:** Prisma Client (Node.js)\n`;
  reply += `• **Status Koneksi:** 🟢 **Terhubung & Sinkron Real-Time**\n\n`;

  reply += `📋 **Cakupan 15 Tabel Database yang Diakses Chatbot:**\n`;
  reply += `1. 👥 **Akun & Pengguna (\`users\`, \`accounts\`, \`sessions\`):**\n`;
  reply += `   • **${m.totalUsers} total akun terdaftar** (${m.totalPelanggan} Pelanggan, ${m.totalKasir} Kasir, ${m.totalPetugasStok} Petugas Stok, ${m.totalAdmin} Admin, ${m.totalOwner} Owner).\n\n`;

  reply += `2. ☕ **Katalog & Resep Menu (\`Product\`, \`Category\`, \`ProductRecipe\`):**\n`;
  reply += `   • **${m.totalProducts} varian menu** dalam **${db.categories.length} kategori** (${db.categories.map((c) => c.name).join(', ')}).\n`;
  reply += `   • Terhubung ke resep takaran bahan baku untuk setiap varian kopi.\n\n`;

  reply += `3. 📦 **Gudang, Stok & Pemasok (\`Ingredient\`, \`Supplier\`, \`PurchaseOrder\`, \`StockMovement\`):**\n`;
  reply += `   • **${m.totalIngredients} item bahan baku** di gudang (${db.ingredients.map((i) => `${i.name}: ${i.stock} ${i.unit}`).join(', ')}).\n`;
  reply += `   • **${db.suppliers.length} supplier aktif** (${db.suppliers.map((s) => s.name).join(', ')}).\n`;
  reply += `   • Riwayat pengadaan PO & log mutasi stok gudang.\n\n`;

  reply += `4. 🧾 **Transaksi & Keuangan (\`Order\`, \`OrderItem\`, \`Payment\`):**\n`;
  reply += `   • **${m.totalOrders} total transaksi pesanan** (${m.completedOrders} lunas/selesai, ${m.pendingOrders} pending).\n`;
  reply += `   • **Total Omset Real-Time:** **Rp ${m.totalRevenue.toLocaleString('id-ID')}**.\n\n`;

  reply += `5. 🎁 **Loyalitas, Promo & Operasional (\`rewards\`, \`Review\`, \`Promotion\`, \`Event\`, \`Booking\`, \`schedules\`):**\n`;
  reply += `   • **${m.totalPromotions} promo aktif** & poin reward loyalitas pelanggan.\n`;
  reply += `   • **${db.schedules.length} jadwal operasional kedai** (${db.schedules.map((s) => `${s.hari} ${s.jamBuka}-${s.jamTutup}`).join(' | ')}).\n`;
  reply += `   • **${db.events.length} event** & **${db.reviews.length} ulasan** pelanggan.\n\n`;

  reply += `💡 **Anda dapat langsung menanyakan data spesifik dari tabel mana pun!**\n`;
  reply += `Misalnya: _"Berapa sisa stok susu?"_, _"Berapa total omset saat ini?"_, _"Daftar pengguna terdaftar"_, atau _"Kirim laporan penjualan ke WhatsApp Owner"_! ☕`;

  let actions: ActionButton[] = [];
  if (['ADMIN', 'OWNER'].includes(userRole)) {
    actions = buildSalesReport(db, userRole, userName).actions || [];
  }

  return { reply: reply.trim(), actions };
}

function buildBotIdentityResponse(userRole: string, userName: string | null): BaristaResponse {
  let roleFeatures = '';
  switch (userRole) {
    case 'OWNER':
      roleFeatures = `\n👑 **Khusus Peran Owner, saya dapat membantu Anda:**\n• 📊 Ringkasan laporan omset dan pendapatan kedai secara real-time\n• 📦 Pengawasan bahan baku kritis di gudang\n• 📲 Meneruskan laporan langsung ke WhatsApp atau Email Owner`;
      break;
    case 'ADMIN':
      roleFeatures = `\n🛡️ **Khusus Peran Admin, saya dapat membantu Anda:**\n• 👥 Rekapitulasi data pengguna & pelanggan terdaftar\n• 📊 Akses laporan penjualan dan transaksi keseluruhan\n• 🗄️ Status sinkronisasi dan integritas database sistem`;
      break;
    case 'PETUGAS_STOK':
      roleFeatures = `\n📦 **Khusus Peran Petugas Stok, saya dapat membantu Anda:**\n• 📦 Pengecekan sisa stok bahan baku dan inventaris gudang\n• 🚨 Peringatan dini bahan baku yang menipis atau perlu restock\n• 🏢 Rekomendasi kontak supplier dan pembuatan purchase order`;
      break;
    case 'KASIR':
      roleFeatures = `\n🧑‍💼 **Khusus Peran Kasir, saya dapat membantu Anda:**\n• 🧾 Monitoring antrian dan daftar pesanan harian\n• 📲 Pengiriman struk atau nota belanja ke WhatsApp pelanggan\n• 🕒 Informasi jadwal operasional dan pergantian shift kasir`;
      break;
    default: // PELANGGAN
      roleFeatures = `\n☕ **Fitur & Bantuan yang Bisa Saya Berikan:**\n• 📋 Rekomendasi menu minuman kopi, non-kopi, dan camilan favorit\n• 🏷️ Informasi promo aktif, diskon, dan voucher hemat mahasiswa\n• 🧾 Pengecekan status pesanan dan struk belanja Anda\n• 🕒 Jam buka kedai, fasilitas Wi-Fi/colokan, dan jadwal acara`;
      break;
  }

  const nameGreeting = userName && userName !== 'PELANGGAN' ? `Kak ${userName}` : 'Kak';

  const reply = `☕ **Halo ${nameGreeting}! Saya adalah AI Barista Kopi Mahasiswa** 🤖

Saya adalah asisten virtual pintar resmi dari **Kopi Mahasiswa**. Saya terhubung langsung ke database kedai kami secara real-time untuk mendampingi dan melayani Anda dengan ramah, cepat, dan akurat.
${roleFeatures}

Ada yang bisa saya bantu untuk Anda saat ini? Silakan ajukan pertanyaan Anda! 😊`;

  return { reply };
}

function buildUserIdentityResponse(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  userEmail: string | null = null,
  userId: string | null = null
): BaristaResponse {
  // 1. Cari data user di tabel users
  const matchedUser = db.users.find((u) => {
    if (userId && u.id === userId) return true;
    if (userEmail && u.email && u.email.toLowerCase() === userEmail.toLowerCase()) return true;
    if (userName && userName !== 'PELANGGAN' && u.name.toLowerCase() === userName.toLowerCase()) return true;
    return false;
  });

  // 2. Cari reward points user jika ada
  const matchedReward = db.rewards.find((r) => {
    if (matchedUser && (r as any).userId === matchedUser.id) return true;
    if (userEmail && r.user?.email && r.user.email.toLowerCase() === userEmail.toLowerCase()) return true;
    if (userName && r.user?.name && r.user.name.toLowerCase() === userName.toLowerCase()) return true;
    return false;
  });

  // 3. Cari pesanan user jika ada
  const userOrders = db.orders.filter((o) => {
    if (matchedUser && o.user?.email && o.user.email.toLowerCase() === matchedUser.email.toLowerCase()) return true;
    if (userEmail && o.user?.email && o.user.email.toLowerCase() === userEmail.toLowerCase()) return true;
    if (userName && userName !== 'PELANGGAN' && o.user?.name && o.user.name.toLowerCase() === userName.toLowerCase()) return true;
    return false;
  });

  const effectiveRole = matchedUser?.role || userRole || 'PELANGGAN';
  const displayName = matchedUser?.name || (userName && userName !== 'PELANGGAN' ? userName : null);
  const displayEmail = matchedUser?.email || userEmail || null;
  const displayPhone = matchedUser?.phone || null;
  const displayStatus = matchedUser?.isActive !== false ? '🟢 Aktif' : '🔴 Nonaktif';
  const joinDate = matchedUser?.createdAt
    ? new Date(matchedUser.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  let roleLabel = '';
  let roleExplanation = '';

  switch (effectiveRole) {
    case 'OWNER':
      roleLabel = '👑 OWNER (Pemilik Kedai)';
      roleExplanation = 'Sebagai Pemilik Kedai, Anda memiliki wewenang penuh untuk memantau ringkasan omset penjualan, evaluasi operasional, performa staf, serta menerima laporan eksekutif via WhatsApp dan Email.';
      break;
    case 'ADMIN':
      roleLabel = '🛡️ ADMINISTRATOR SISTEM';
      roleExplanation = 'Sebagai Admin, Anda berwenang mengelola data master pengguna (Kasir, Petugas Stok, Pelanggan), monitoring katalog produk, rekap transaksi, serta konfigurasi sistem Kopi Mahasiswa.';
      break;
    case 'PETUGAS_STOK':
      roleLabel = '📦 PETUGAS STOK & GUDANG';
      roleExplanation = 'Sebagai Petugas Stok, tugas utama Anda adalah memantau volume bahan baku di gudang, mendeteksi persediaan yang mulai menipis/kritis, dan membuat laporan restock ke supplier.';
      break;
    case 'KASIR':
      roleLabel = '🧑‍💼 KASIR & FRONT-OFFICE';
      roleExplanation = 'Sebagai Kasir, Anda bertugas memproses transaksi pembelian pelanggan, memantau antrian pesanan harian, dan mengirimkan struk digital ke WhatsApp pembeli.';
      break;
    default:
      roleLabel = '☕ PELANGGAN';
      roleExplanation = 'Sebagai Pelanggan setia Kopi Mahasiswa, Anda dapat menjelajahi menu kopi spesial, menikmati promo diskon, melacak status pesanan, dan mengumpulkan poin reward setiap transaksi.';
      break;
  }

  // Jika user belum login (tidak ada akun matched atau nama masih default)
  if (!matchedUser && (!displayName || displayName === 'PELANGGAN')) {
    let guestReply = `👤 **Status & Identitas Pengguna**\n\n`;
    guestReply += `• **Status Sesi:** Tamu / Pengunjung (Belum Login)\n`;
    guestReply += `• **Peran Akses:** ☕ **PELANGGAN**\n\n`;
    guestReply += `💡 Anda saat ini menjelajahi Kopi Mahasiswa sebagai pengunjung umum.\n`;
    guestReply += `Silakan **Login** dengan akun Anda untuk:\n`;
    guestReply += `• Melihat nama profil dan email terdaftar Anda\n`;
    guestReply += `• Melacak status pesanan dan riwayat belanja\n`;
    guestReply += `• Mengumpulkan dan menukarkan **Poin Reward** 🎁\n`;
    guestReply += `• Mendapatkan voucher diskon khusus member!\n\n`;
    guestReply += `Ada yang bisa saya bantu terkait menu kopi favorit atau jam buka kedai? ☕`;
    return { reply: guestReply };
  }

  let reply = `👤 **Identitas & Profil Akun Anda**\n\n`;
  reply += `• **Nama:** **${displayName}**\n`;
  reply += `• **Peran (Role):** **${roleLabel}**\n`;
  if (displayEmail) reply += `• **Email:** ${displayEmail}\n`;
  if (displayPhone) reply += `• **No. Telepon / WA:** ${displayPhone}\n`;
  if (joinDate) reply += `• **Bergabung Sejak:** ${joinDate}\n`;
  reply += `• **Status Akun:** ${displayStatus}\n`;

  if (matchedReward) {
    reply += `• **Poin Reward:** 🎁 **${matchedReward.poin} Poin**\n`;
  }

  if (userOrders.length > 0) {
    const latest = userOrders[0];
    const orderDate = new Date(latest.createdAt).toLocaleDateString('id-ID');
    reply += `• **Pesanan Terakhir:** ${latest.code} — Rp ${latest.totalAmount.toLocaleString('id-ID')} [${latest.status}] (${orderDate})\n`;
  }

  reply += `\n📌 **Wewenang & Hak Akses:**\n${roleExplanation}\n\n`;
  reply += `Apakah ada data atau bantuan lain yang Anda perlukan, Kak? ☕`;

  return { reply: reply.trim() };
}

// ─────────────────────────────────────────
// BUILDER: MODUL ADMIN & OPERASIONAL (PO, USER MGMT, CATALOG, ORDERS, VENDORS)
// ─────────────────────────────────────────

function isCountOnlyQuery(q: string): boolean {
  const norm = q.toLowerCase();
  const countKeywords = [
    'berapa', 'ada berapa', 'jumlah', 'total', 'hitung', 'banyaknya', 'jumlahnya'
  ];
  const listKeywords = [
    'siapa saja', 'siapa-siapa', 'siapakah', 'sebutkan', 'daftar', 'list', 'tampilkan',
    'rincian', 'nama-nama', 'detail', 'lihat daftar', 'mana saja', 'tabel', 'semua akun',
    'siapa nama', 'siapa kasir', 'siapa admin', 'siapa owner', 'siapa petugas', 'siapa pelanggan',
    'kontak', 'siapa saja staf', 'siapa saja karyawan'
  ];

  const hasCount = countKeywords.some((k) => norm.includes(k));
  const hasList = listKeywords.some((k) => norm.includes(k));

  if (hasList) return false;
  return hasCount;
}

function buildPurchaseOrderReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const poList = db.purchaseOrders;
  const totalPO = poList.length;
  const sentPO = poList.filter((p) => p.status === 'SENT').length;
  const draftPO = poList.filter((p) => p.status === 'DRAFT').length;
  const receivedPO = poList.filter((p) => p.status === 'RECEIVED').length;
  const cancelledPO = poList.filter((p) => p.status === 'CANCELLED').length;

  if (isCountOnly) {
    return {
      reply: `Berdasarkan database saat ini, terdapat total ${totalPO} transaksi Purchase Order (PO) pengadaan bahan baku (${receivedPO} diterima, ${sentPO} dikirim, ${draftPO} draft).`,
    };
  }

  let reply = `📦 **Data Purchase Order / PO Pengadaan Bahan Baku (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;

  reply += `• **Total Purchase Order (PO):** **${totalPO} transaksi pengadaan**\n`;
  reply += `  - 🚚 **Terkirim (SENT):** ${sentPO} PO\n`;
  reply += `  - 📥 **Diterima (RECEIVED):** ${receivedPO} PO\n`;
  reply += `  - 📝 **Draft (DRAFT):** ${draftPO} PO\n`;
  if (cancelledPO > 0) {
    reply += `  - ❌ **Dibatalkan (CANCELLED):** ${cancelledPO} PO\n`;
  }
  reply += `\n`;

  if (totalPO > 0) {
    reply += `📋 **Rincian Daftar Purchase Order Terkini:**\n`;
    poList.forEach((po, idx) => {
      const suppName = po.supplier?.name || 'Supplier Umum';
      const itemsDetail = (po.items || [])
        .map(
          (it) =>
            `${it.quantity} ${it.ingredient?.unit || 'unit'} ${it.ingredient?.name || 'Bahan Baku'} (Rp ${it.totalCost.toLocaleString('id-ID')})`
        )
        .join(', ');
      const totalCost = (po.items || []).reduce((sum, it) => sum + (it.totalCost || 0), 0);
      const dateStr = po.createdAt
        ? new Date(po.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '-';

      reply += `${idx + 1}. 🏷️ **Kode: ${po.code}** [Status: \`${po.status}\`]\n`;
      reply += `   • **Supplier / Vendor:** ${suppName}\n`;
      reply += `   • **Tanggal Buat:** ${dateStr}\n`;
      if (itemsDetail) {
        reply += `   • **Item Bahan Baku:** ${itemsDetail}\n`;
      }
      if (totalCost > 0) {
        reply += `   • **Estimasi Total Biaya:** Rp ${totalCost.toLocaleString('id-ID')}\n`;
      }
      reply += `\n`;
    });
  } else {
    reply += `_Saat ini belum ada data Purchase Order (PO) yang tersimpan di database._\n\n`;
  }

  reply += `💡 _Anda dapat membuat atau memperbarui PO pengadaan bahan baku di menu **Purchase Orders** (\`/dashboard/stok/purchase-order\`) atau melihat mitra di **Vendor Supplier** (\`/dashboard/admin/supplier\`)._`;

  const contacts = getStaffContacts(db.users);
  const waText = encodeURIComponent(reply);
  const actions: ActionButton[] = isExplicitReport
    ? [
        {
          type: 'whatsapp',
          label: '📲 Kirim Rekap PO ke WhatsApp',
          url: `https://wa.me/${contacts.owner.phone}?text=${waText}`,
          target: contacts.owner.phone || undefined,
          text: reply,
        },
        {
          type: 'email',
          label: '✉️ Kirim Rekap PO ke Email',
          url: `mailto:${contacts.owner.email}?subject=${encodeURIComponent('Rekapitulasi Purchase Order (PO) Kopi Mahasiswa')}&body=${waText}`,
          target: contacts.owner.email || undefined,
          subject: 'Rekapitulasi Purchase Order (PO) Kopi Mahasiswa',
          text: reply,
        },
      ]
    : [];

  return { reply: reply.trim(), actions };
}

function buildVendorsReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const suppliers = db.suppliers;
  if (isCountOnly) {
    return {
      reply: `Berdasarkan database saat ini, terdapat total ${suppliers.length} vendor supplier bahan baku terdaftar (${suppliers.map((s) => s.name).join(', ')}).`,
    };
  }

  let reply = `🚚 **Data Vendors & Supplier Bahan Baku (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
  reply += `• **Total Vendor Terdaftar:** **${suppliers.length} vendor supplier**\n\n`;

  if (suppliers.length > 0) {
    reply += `📋 **Daftar Vendor Mitra Kopi Mahasiswa:**\n`;
    suppliers.forEach((s, idx) => {
      const relatedPOs = db.purchaseOrders.filter(
        (po) => po.supplier?.name === s.name || (po as any).supplierId === s.id
      );
      reply += `${idx + 1}. 🏢 **${s.name}**\n`;
      reply += `   • 📞 **Kontak / No. Telp:** ${s.contactInfo || '-'}\n`;
      reply += `   • 📍 **Alamat:** ${s.address || '-'}\n`;
      reply += `   • 📦 **Riwayat PO Terkait:** ${relatedPOs.length} PO ${
        relatedPOs.length > 0 ? `(${relatedPOs.map((p) => p.code).join(', ')})` : ''
      }\n\n`;
    });
  } else {
    reply += `_Belum ada vendor/supplier yang tersimpan di database._\n\n`;
  }

  reply += `💡 _Kelola vendor atau tambah pemasok baru di menu **Vendor Supplier** (\`/dashboard/admin/supplier\`)._`;

  const contacts = getStaffContacts(db.users);
  const waText = encodeURIComponent(reply);
  const actions: ActionButton[] = isExplicitReport
    ? [
        {
          type: 'whatsapp',
          label: '📲 Kirim Data Vendor ke WhatsApp',
          url: `https://wa.me/${contacts.owner.phone}?text=${waText}`,
          target: contacts.owner.phone || undefined,
          text: reply,
        },
      ]
    : [];

  return { reply: reply.trim(), actions };
}

function buildUserManagementReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const m = db.metrics;
  if (isCountOnly) {
    return {
      reply: `Berdasarkan database saat ini, total pengguna terdaftar adalah ${m.totalUsers} akun (${m.totalOwner} Owner, ${m.totalAdmin} Admin, ${m.totalKasir} Kasir, ${m.totalPetugasStok} Petugas Stok, ${m.totalPelanggan} Pelanggan).`,
    };
  }

  let reply = `👥 **Data User Management / Manajemen Pengguna (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;

  reply += `• **Total Pengguna Terdaftar:** **${m.totalUsers} akun**\n`;
  reply += `  - 👑 **Owner:** ${m.totalOwner} orang\n`;
  reply += `  - 🛡️ **Admin:** ${m.totalAdmin} orang\n`;
  reply += `  - 🧑‍💼 **Kasir:** ${m.totalKasir} orang\n`;
  reply += `  - 📦 **Petugas Stok:** ${m.totalPetugasStok} orang\n`;
  reply += `  - ☕ **Pelanggan:** ${m.totalPelanggan} orang (🟢 ${m.activePelanggan} Aktif | 🔴 ${m.inactivePelanggan} Nonaktif)\n\n`;

  const grouped: Record<string, typeof db.users> = {
    ADMIN: [],
    OWNER: [],
    KASIR: [],
    PETUGAS_STOK: [],
    PELANGGAN: [],
  };

  for (const u of db.users) {
    if (!grouped[u.role]) grouped[u.role] = [];
    grouped[u.role].push(u);
  }

  reply += `📋 **Rincian Akun Berdasarkan Hak Akses:**\n`;
  for (const [role, uList] of Object.entries(grouped)) {
    if (uList.length === 0) continue;
    reply += `🏷️ **Peran: ${role} (${uList.length} orang)**\n`;
    for (const u of uList) {
      const phone = u.phone ? ` | HP: ${u.phone}` : '';
      reply += `  • **${u.name}** — ${u.email}${phone} (${u.isActive ? '🟢 Aktif' : '🔴 Nonaktif'})\n`;
    }
    reply += `\n`;
  }

  reply += `💡 _Anda dapat menambah pengguna baru, mengubah role, atau mengatur akun di menu **User Management** (\`/dashboard/admin/pengguna\`)._`;

  const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];

  return { reply: reply.trim(), actions };
}

function buildPetugasStokReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const stokList = db.users.filter((u) => u.role === 'PETUGAS_STOK');
  if (isCountOnly) {
    const nama = stokList.map((s) => s.name).join(', ') || 'Belum ada';
    return {
      reply: `Saat ini terdapat ${stokList.length} Petugas Stok di Kopi Mahasiswa (${nama}).`,
    };
  }

  const staffList = db.users.filter((u) => u.role !== 'PELANGGAN');
  const adminList = db.users.filter((u) => u.role === 'ADMIN');
  const ownerList = db.users.filter((u) => u.role === 'OWNER');
  const kasirList = db.users.filter((u) => u.role === 'KASIR');

  let reply = `📦 **Data Petugas Stok / Bagian Inventaris Kopi Mahasiswa**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
  reply += `• **Jumlah Petugas Stok:** **${stokList.length} orang**\n\n`;

  if (stokList.length > 0) {
    reply += `📋 **Daftar Akun Petugas Stok (Database Real-Time):**\n`;
    for (const s of stokList) {
      const phoneStr = s.phone ? ` | 📞 ${s.phone}` : '';
      const dateStr = new Date(s.createdAt).toLocaleDateString('id-ID');
      reply += `  • **${s.name}** [${s.role}] — ${s.email}${phoneStr}\n`;
      reply += `    Status: ${s.isActive ? '🟢 Aktif' : '🔴 Nonaktif'} | Terdaftar sejak: ${dateStr}\n`;
      reply += `    Tugas: Mengontrol stok bahan baku kopi, memantau batas kritis, dan penerimaan Purchase Order (PO).\n\n`;
    }
  } else {
    reply += `_Belum ada akun dengan peran Petugas Stok di database._\n\n`;
  }

  reply += `👔 **Rincian Seluruh Karyawan / Staf Kedai (${staffList.length} orang):**\n`;
  reply += `• 👑 **Owner:** ${ownerList.length} orang (${ownerList.map((o) => o.name).join(', ')})\n`;
  reply += `• 🛡️ **Admin:** ${adminList.length} orang (${adminList.map((a) => a.name).join(', ')})\n`;
  reply += `• 🧑‍💼 **Kasir:** ${kasirList.length} orang (${kasirList.map((k) => k.name).join(', ')})\n`;
  reply += `• 📦 **Petugas Stok:** ${stokList.length} orang (${stokList.map((s) => s.name).join(', ')})\n\n`;
  reply += `💡 _Untuk menambah atau mengelola akun staf, silakan akses menu **User Management** (\`/dashboard/admin/pengguna\`)._`;

  const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
  return { reply: reply.trim(), actions };
}

function buildStaffSummaryReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const staffList = db.users.filter((u) => u.role !== 'PELANGGAN');
  const kasirList = db.users.filter((u) => u.role === 'KASIR');
  const stokList = db.users.filter((u) => u.role === 'PETUGAS_STOK');
  const adminList = db.users.filter((u) => u.role === 'ADMIN');
  const ownerList = db.users.filter((u) => u.role === 'OWNER');

  if (isCountOnly) {
    return {
      reply: `Total staf operasional kedai saat ini berjumlah ${staffList.length} orang (${ownerList.length} Owner, ${adminList.length} Admin, ${kasirList.length} Kasir, dan ${stokList.length} Petugas Stok).`,
    };
  }

  let reply = `👔 **Data Karyawan & Staf Kopi Mahasiswa (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
  reply += `• **Total Seluruh Karyawan / Staf:** **${staffList.length} orang**\n\n`;
  reply += `📊 **Komposisi Staf Internal Kedai:**\n`;
  reply += `  - 👑 **Owner (Pemilik):** ${ownerList.length} orang\n`;
  reply += `  - 🛡️ **Administrator:** ${adminList.length} orang\n`;
  reply += `  - 🧑‍💼 **Kasir:** ${kasirList.length} orang\n`;
  reply += `  - 📦 **Petugas Stok / Gudang:** ${stokList.length} orang\n\n`;

  reply += `📋 **Daftar Lengkap Nama Staf Internal:**\n`;
  for (const s of staffList) {
    const phoneStr = s.phone ? ` | 📞 ${s.phone}` : '';
    reply += `  • **${s.name}** [${s.role}] — ${s.email}${phoneStr} (${s.isActive ? '🟢 Aktif' : '🔴 Nonaktif'})\n`;
  }
  reply += `\n💡 _Total seluruh pengguna sistem termasuk pelanggan adalah **${db.metrics.totalUsers} akun** (${db.metrics.totalPelanggan} Pelanggan)._`;

  const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
  return { reply: reply.trim(), actions };
}

function buildKasirReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const kasirList = db.users.filter((u) => u.role === 'KASIR');
  if (isCountOnly) {
    return {
      reply: `Saat ini terdapat ${kasirList.length} kasir terdaftar di Kopi Mahasiswa (${kasirList.map((k) => k.name).join(' dan ')}).`,
    };
  }

  let reply = `🧑‍💼 **Data Kasir Kopi Mahasiswa (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
  reply += `• **Total Kasir Terdaftar:** **${kasirList.length} orang**\n\n`;
  if (kasirList.length > 0) {
    reply += `📋 **Daftar Akun Kasir:**\n`;
    for (const k of kasirList) {
      const phoneStr = k.phone ? ` | 📞 ${k.phone}` : '';
      reply += `  • **${k.name}** (${k.email}${phoneStr}) — ${k.isActive ? '🟢 Aktif' : '🔴 Nonaktif'}\n`;
    }
  } else {
    reply += `_Belum ada akun kasir di database._\n`;
  }
  const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
  return { reply: reply.trim(), actions };
}

function buildAdminStaffReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const adminList = db.users.filter((u) => u.role === 'ADMIN');
  if (isCountOnly) {
    return {
      reply: `Saat ini terdapat ${adminList.length} administrator terdaftar di sistem kedai (${adminList.map((a) => a.name).join(', ')}).`,
    };
  }

  let reply = `🛡️ **Data Administrator Kopi Mahasiswa (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
  reply += `• **Total Admin Terdaftar:** **${adminList.length} orang**\n\n`;
  if (adminList.length > 0) {
    reply += `📋 **Daftar Akun Admin:**\n`;
    for (const a of adminList) {
      const phoneStr = a.phone ? ` | 📞 ${a.phone}` : '';
      reply += `  • **${a.name}** (${a.email}${phoneStr}) — ${a.isActive ? '🟢 Aktif' : '🔴 Nonaktif'}\n`;
    }
  } else {
    reply += `_Belum ada akun admin di database._\n`;
  }
  const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
  return { reply: reply.trim(), actions };
}

function buildOwnerStaffReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const ownerList = db.users.filter((u) => u.role === 'OWNER');
  if (isCountOnly) {
    return {
      reply: `Saat ini terdapat ${ownerList.length} Business Owner terdaftar di Kopi Mahasiswa (${ownerList.map((o) => o.name).join(', ')}).`,
    };
  }

  let reply = `👑 **Data Owner / Pemilik Kopi Mahasiswa (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
  reply += `• **Total Owner Terdaftar:** **${ownerList.length} orang**\n\n`;
  if (ownerList.length > 0) {
    reply += `📋 **Daftar Akun Owner:**\n`;
    for (const o of ownerList) {
      const phoneStr = o.phone ? ` | 📞 ${o.phone}` : '';
      reply += `  • **${o.name}** (${o.email}${phoneStr}) — ${o.isActive ? '🟢 Aktif' : '🔴 Nonaktif'}\n`;
    }
  } else {
    reply += `_Belum ada akun owner di database._\n`;
  }
  const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
  return { reply: reply.trim(), actions };
}

function buildProductCatalogReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false
): BaristaResponse {
  const m = db.metrics;
  if (isCountOnly) {
    return {
      reply: `Berdasarkan database saat ini, terdapat total ${m.totalProducts} varian menu aktif yang terbagi dalam ${db.categories.length} kategori (${db.categories.map((c) => c.name).join(', ')}).`,
    };
  }

  let reply = `☕ **Data Product Catalog / Katalog Menu (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;

  reply += `• **Total Produk:** **${m.totalProducts} varian menu**\n`;
  reply += `• **Total Kategori:** **${db.categories.length} kategori** (${db.categories.map((c) => c.name).join(', ')})\n`;
  const activeProducts = db.products.filter((p) => p.active).length;
  reply += `• **Status Produk:** 🟢 ${activeProducts} Aktif | 🔴 ${db.products.length - activeProducts} Nonaktif\n\n`;

  const grouped: Record<string, typeof db.products> = {};
  for (const p of db.products) {
    const cat = p.category?.name || 'Menu Lainnya';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  reply += `📋 **Daftar Produk per Kategori:**\n`;
  for (const [cat, items] of Object.entries(grouped)) {
    reply += `☕ **Kategori: ${cat} (${items.length} item)**\n`;
    for (const it of items) {
      const recipeCount = it.recipes ? it.recipes.length : 0;
      const recipeInfo = recipeCount > 0 ? ` | 🥣 ${recipeCount} bahan baku` : '';
      reply += `  • **${it.name}** — Rp ${it.price.toLocaleString('id-ID')}${recipeInfo} (${
        it.active ? '🟢 Aktif' : '🔴 Nonaktif'
      })\n`;
    }
    reply += `\n`;
  }

  reply += `💡 _Anda dapat mengedit harga, menambah varian baru, atau mengatur takaran resep di menu **Product Catalog** (\`/dashboard/admin/menu\`)._`;

  const actions: ActionButton[] = [];

  return { reply: reply.trim(), actions };
}

function buildOrderHistoryReport(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  isCountOnly: boolean = false,
  isExplicitReport: boolean = false
): BaristaResponse {
  const m = db.metrics;
  if (isCountOnly) {
    return {
      reply: `Berdasarkan database saat ini, terdapat total ${m.totalOrders} transaksi pesanan dengan akumulasi omset sebesar Rp ${m.totalRevenue.toLocaleString('id-ID')}.`,
    };
  }
  let reply = `🧾 **Data Order History / Riwayat Pesanan (Database Real-Time)**\n`;
  reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;

  reply += `• **Total Pesanan Masuk:** **${m.totalOrders} transaksi**\n`;
  reply += `• **Total Pendapatan / Omset:** **Rp ${m.totalRevenue.toLocaleString('id-ID')}**\n`;
  reply += `• **Pesanan Selesai / Lunas:** **${m.completedOrders} pesanan**\n`;
  reply += `• **Pesanan Pending / Menunggu:** **${m.pendingOrders} pesanan**\n\n`;

  if (db.orders.length > 0) {
    reply += `📋 **Riwayat Pesanan Terkini:**\n`;
    for (const o of db.orders.slice(0, 10)) {
      const cust = o.user?.name || 'Walk-in Customer';
      const kasir = o.kasir?.name ? ` | Kasir: ${o.kasir.name}` : '';
      const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const paymentStr = o.payment?.method ? ` [${o.payment.method}]` : '';
      const itemsList = (o.items || [])
        .map((it) => `${it.quantity}x ${it.product?.name || 'Item'}`)
        .join(', ');

      reply += `• 🏷️ **${o.code}** — ${cust} (Rp ${o.totalAmount.toLocaleString('id-ID')})${paymentStr}\n`;
      reply += `   Status: \`${o.status}\` | 📅 ${dateStr}${kasir}\n`;
      if (itemsList) {
        reply += `   Item: ${itemsList}\n`;
      }
      reply += `\n`;
    }
  } else {
    reply += `_Belum ada data pesanan yang tercatat di database._\n\n`;
  }

  reply += `💡 _Lihat rekapitulasi lengkap, filter status, atau cetak struk di menu **Order History** (\`/dashboard/admin/pesanan\`)._`;

  const actions = isExplicitReport ? (buildSalesReport(db, userRole, userName, true).actions || []) : [];

  return { reply: reply.trim(), actions };
}

function isGreeting(q: string): boolean {
  // Jangan anggap sebagai sapaan murni jika menanyakan identitas bot atau user
  if (isBotIdentityQuery(q) || isUserIdentityQuery(q)) return false;

  // Jika pertanyaan mengandung topik spesifik kedai, arahkan ke handler topik bukan sapaan generik
  const hasSpecificTopic = [
    'menu', 'kopi', 'harga', 'promo', 'stok', 'pesanan', 'order', 'struk', 'nota',
    'omset', 'laporan', 'bahan', 'supplier', 'jadwal', 'jam buka', 'event', 'review',
    'resep', 'pelanggan', 'pengguna', 'kasir', 'admin', 'owner'
  ].some((kw) => q.includes(kw));
  if (hasSpecificTopic) return false;

  const words = q.split(/\s+/);
  // Kalimat pendek (<= 3 kata) yang mengandung sapaan
  if (words.length <= 3 && GREETING_KEYWORDS.some((kw) => q.includes(kw))) return true;
  // Murni satu kata sapaan
  if (words.length === 1 && GREETING_KEYWORDS.includes(q)) return true;
  return false;
}

function isAdminTopicQuery(q: string): boolean {
  const norm = q.toLowerCase();
  // 1. Purchase Order (PO / Pengadaan)
  if (
    /\bpo\b/i.test(norm) ||
    norm.includes('purchase order') ||
    norm.includes('purchase orders') ||
    norm.includes('pengadaan') ||
    norm.includes('p.o') ||
    norm.includes('po-')
  ) {
    return true;
  }
  // 2. User Management & Data Karyawan / Staf
  if (
    norm.includes('user manajemen') ||
    norm.includes('manajemen user') ||
    norm.includes('user management') ||
    norm.includes('manajemen pengguna') ||
    norm.includes('data pengguna') ||
    norm.includes('daftar pengguna') ||
    norm.includes('data user') ||
    norm.includes('daftar user') ||
    norm.includes('kelola user') ||
    norm.includes('kelola pengguna') ||
    norm.includes('rekap user') ||
    norm.includes('petugas stok') ||
    norm.includes('staf stok') ||
    norm.includes('karyawan stok') ||
    norm.includes('bagian stok') ||
    norm.includes('karyawan') ||
    norm.includes('staf') ||
    norm.includes('staff') ||
    norm.includes('pegawai') ||
    norm.includes('petugas') ||
    norm.includes('admin') ||
    norm.includes('kasir') ||
    norm.includes('owner')
  ) {
    return true;
  }
  // 3. Product Catalog
  if (
    norm.includes('product catalog') ||
    norm.includes('pruduct catalog') ||
    norm.includes('katalog produk') ||
    norm.includes('katalog menu') ||
    norm.includes('daftar produk') ||
    norm.includes('semua produk') ||
    norm.includes('total produk')
  ) {
    return true;
  }
  // 4. Order History
  if (
    norm.includes('order history') ||
    norm.includes('history order') ||
    norm.includes('riwayat order') ||
    norm.includes('riwayat pesanan') ||
    norm.includes('history pesanan') ||
    norm.includes('rekap pesanan') ||
    norm.includes('daftar pesanan')
  ) {
    return true;
  }
  // 5. Vendors & Suppliers
  if (
    norm.includes('vendor') ||
    norm.includes('vendors') ||
    norm.includes('supplier') ||
    norm.includes('suppliers') ||
    norm.includes('pemasok') ||
    norm.includes('kulakan')
  ) {
    return true;
  }
  return false;
}

function isOffTopic(q: string, hasConversationHistory: boolean = false): boolean {
  // Sapaan selalu diizinkan
  if (isGreeting(q)) return false;
  // Pertanyaan identitas bot atau user selalu diizinkan
  if (isBotIdentityQuery(q) || isUserIdentityQuery(q)) return false;
  // Pertanyaan seputar database Laragon selalu diizinkan
  if (isDatabaseQuery(q)) return false;
  // Pertanyaan seputar modul Admin (PO, User Management, Product Catalog, Order History, Vendors) selalu diizinkan
  if (isAdminTopicQuery(q)) return false;
  // Kalimat sangat pendek (<= 3 kata) jangan diblokir
  if (q.split(/\s+/).length <= 3) return false;

  // Jika ada riwayat percakapan sebelumnya dan pertanyaan berupa kalimat lanjutan/klarifikasi, jangan blokir
  const isFollowUp =
    q.includes('kenapa') ||
    q.includes('mengapa') ||
    q.includes('bagaimana') ||
    q.includes('apa akibat') ||
    q.includes('apa sebab') ||
    q.includes('maksud') ||
    q.includes('jelaskan') ||
    q.includes('contoh') ||
    q.includes('lanjut') ||
    q.includes('kalau begitu');

  if (hasConversationHistory && isFollowUp) {
    return false;
  }

  const hasKopiKeyword = KOPI_TOPIC_KEYWORDS.some((kw) => q.includes(kw));
  if (hasKopiKeyword) return false;

  const hasOffTopicKeyword = OFF_TOPIC_KEYWORDS.some((kw) => q.includes(kw));
  if (hasOffTopicKeyword) return true;

  return false;
}

// ─────────────────────────────────────────
// RBAC: Cek apakah role boleh akses topik tertentu
// ─────────────────────────────────────────
function checkRoleAccess(q: string, userRole: string): string | null {
  // Admin dan Owner memiliki akses penuh ke seluruh fitur dan data sistem
  if (userRole === 'ADMIN' || userRole === 'OWNER') {
    return null;
  }

  const isLaporanPenjualan =
    q.includes('laporan penjualan') ||
    q.includes('laporan omset') ||
    q.includes('laporan keuangan') ||
    q.includes('omset') ||
    q.includes('omzet') ||
    q.includes('pendapatan') ||
    q.includes('revenue') ||
    q.includes('grafik penjualan') ||
    (q.includes('laporan') && (q.includes('penjualan') || q.includes('keuangan')));

  const isDataStok =
    q.includes('stok') ||
    q.includes('bahan baku') ||
    q.includes('inventaris') ||
    q.includes('gudang') ||
    q.includes('restock') ||
    /\bpo\b/i.test(q) ||
    q.includes('purchase order') ||
    q.includes('vendor') ||
    q.includes('supplier');

  const isDataPengguna =
    q.includes('data pengguna') ||
    q.includes('daftar pengguna') ||
    q.includes('laporan pengguna') ||
    q.includes('rekap pengguna') ||
    q.includes('user manajemen') ||
    q.includes('manajemen user') ||
    q.includes('manajemen pengguna');

  const isDataAdmin =
    q.includes('sistem') ||
    q.includes('konfigurasi') ||
    q.includes('pengaturan sistem') ||
    q.includes('manajemen role');

  // === PELANGGAN: hanya bisa akses menu, pesanan pribadi, reward, promo, jadwal ===
  if (userRole === 'PELANGGAN') {
    if (isLaporanPenjualan) {
      return '🔒 Maaf, laporan penjualan hanya bisa diakses oleh Admin, Owner, atau Kasir. Apakah ada yang bisa saya bantu terkait menu atau pesanan Anda? ☕';
    }
    if (isDataStok) {
      return '🔒 Informasi inventaris, PO pengadaan, dan vendor hanya tersedia untuk Admin, Owner, atau Petugas Stok. Saya bisa bantu info menu atau status pesanan Anda!';
    }
    if (isDataPengguna || isDataAdmin) {
      return '🔒 Informasi User Management dan pengaturan sistem hanya tersedia untuk Admin atau Owner. Ada yang bisa saya bantu seputar menu kopi Anda? ☕';
    }
  }

  // === KASIR: bisa akses transaksi, pesanan harian, laporan sederhana. Tidak bisa akses stok detail, PO, manajemen pengguna ===
  if (userRole === 'KASIR') {
    if (isDataPengguna || isDataAdmin) {
      return '🔒 Maaf, data manajemen pengguna dan pengaturan sistem hanya bisa diakses oleh Admin atau Owner.';
    }
    if (isDataStok) {
      return '🔒 Detail stok bahan baku dan PO supplier dikelola oleh Petugas Stok atau Admin. Saya bisa bantu info pesanan harian atau transaksi kasir!';
    }
  }

  // === PETUGAS STOK: hanya akses inventaris & bahan baku & PO, tidak bisa akses laporan keuangan atau data pengguna ===
  if (userRole === 'PETUGAS_STOK') {
    if (isLaporanPenjualan && !q.includes('stok')) {
      return '🔒 Laporan penjualan & keuangan hanya bisa diakses oleh Admin atau Owner. Saya bisa bantu cek status stok, vendor, dan Purchase Order (PO)!';
    }
    if (isDataPengguna || isDataAdmin) {
      return '🔒 Data User Management hanya bisa diakses oleh Admin. Saya siap bantu pengecekan stok bahan baku dan PO pengadaan!';
    }
  }

  return null; // Akses diizinkan
}

function generateFullDatabaseBaristaResponse(
  userQuery: string,
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  userEmail: string | null = null,
  userId: string | null = null
): BaristaResponse {
  const q = userQuery.toLowerCase().trim();
  const isExplicitReport = isExplicitReportCommand(q);
  const isAboutStaffNotIngredients =
    q.includes('petugas') ||
    q.includes('karyawan') ||
    q.includes('pegawai') ||
    q.includes('staf') ||
    q.includes('staff') ||
    q.includes('orang') ||
    q.includes('user') ||
    q.includes('pengguna') ||
    q.includes('admin') ||
    q.includes('kasir') ||
    q.includes('owner') ||
    q.includes('siapa');

  // ──── HANDLER IDENTITAS BOT & PENGGUNA (SIAPA ANDA / SIAPA SAYA) ────
  const askBot = isBotIdentityQuery(q);
  const askUser = isUserIdentityQuery(q);

  if (askBot && askUser) {
    const botRes = buildBotIdentityResponse(userRole, userName);
    const userRes = buildUserIdentityResponse(db, userRole, userName, userEmail, userId);
    return {
      reply: `${botRes.reply}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${userRes.reply}`,
    };
  }

  if (askBot) {
    return buildBotIdentityResponse(userRole, userName);
  }

  if (askUser) {
    return buildUserIdentityResponse(db, userRole, userName, userEmail, userId);
  }

  // ──── HANDLER DATABASE MYSQL LARAGON (AKSES PENUH) ────
  if (isDatabaseQuery(q)) {
    return buildLaragonDatabaseResponse(db, userRole, userName);
  }

  // ──── HANDLER SAPAAN ────
  if (isGreeting(q)) {
    const greetMap: Record<string, string> = {
      PELANGGAN: `Halo ${userName || 'Kak'}! ☕ Ada yang bisa saya bantu? Mau tanya menu, promo, atau cek pesanan?`,
      KASIR: `Halo ${userName || 'Kasir'}! 🧑‍💼 Siap bantu. Mau cek pesanan, struk, atau info lainnya?`,
      ADMIN: `Halo ${userName || 'Admin'}! 🛡️ Siap. Mau cek data pengguna, laporan, atau lainnya?`,
      OWNER: `Halo ${userName || 'Owner'}! 👑 Siap. Mau lihat laporan omset, stok, atau lainnya?`,
      PETUGAS_STOK: `Halo ${userName || 'Kak'}! 📦 Siap bantu cek stok bahan baku atau laporan inventaris.`,
    };
    return { reply: greetMap[userRole] || `Halo! ☕ Ada yang bisa saya bantu seputar Kopi Mahasiswa?` };
  }

  // ──── FILTER 1: TOPIK DI LUAR KOPI MAHASISWA ────
  if (isOffTopic(q)) {
    return { reply: `Maaf, saya hanya bisa membantu seputar Kopi Mahasiswa ☕` };
  }

  // ──── FILTER 2: RBAC — CEK HAK AKSES PER ROLE ────
  const accessDenied = checkRoleAccess(q, userRole);
  if (accessDenied) {
    return { reply: accessDenied };
  }

  // ──── MODUL OTOMATISASI: VERIFIKASI AKUN, OTP 6 DIGIT & WHATSAPP GATEWAY ────
  const isOtpOrAuthQuery =
    q.includes('otp') ||
    q.includes('verifikasi') ||
    q.includes('kode wa') ||
    q.includes('kirim otp') ||
    q.includes('whatsapp gateway') ||
    q.includes('verifikasi wa') ||
    (q.includes('daftar') && (q.includes('wa') || q.includes('whatsapp') || q.includes('otp'))) ||
    (q.includes('login') && (q.includes('wa') || q.includes('whatsapp') || q.includes('otp')));

  if (isOtpOrAuthQuery) {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentUser = db.users.find((u) => (userEmail && u.email === userEmail) || (userId && u.id === userId));
    const userPhone = currentUser?.phone || '081234567890';
    const cleanPhone = cleanPhoneForWhatsApp(userPhone);

    let reply = `🔐 **Verifikasi Akun & WhatsApp Gateway Kopi Mahasiswa**\n\n`;
    reply += `Sistem telah memicu pembuatan **Kode OTP 6 Digit** untuk verifikasi keamanan akun Anda.\n\n`;
    reply += `📲 **Kode OTP Anda:** **\`${randomOtp}\`**\n`;
    reply += `⏱️ _Masa berlaku kode: **5 menit**. Jangan berikan kode ini kepada siapa pun._\n\n`;
    reply += `Kode ini otomatis diproses oleh sistem backend WhatsApp Gateway untuk autentikasi login atau pendaftaran nomor **${userPhone}**.`;

    const waOtpUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `[KOPI MAHASISWA] Kode OTP verifikasi akun Anda adalah ${randomOtp}. Masukkan kode ini pada halaman verifikasi. Berlaku 5 menit.`
    )}`;

    const actions: ActionButton[] = [
      {
        type: 'whatsapp',
        label: `📲 Kirim Kode OTP via WhatsApp Gateway (${randomOtp})`,
        url: waOtpUrl,
        target: '_blank',
        text: `[KOPI MAHASISWA] Kode OTP verifikasi akun Anda: ${randomOtp}`,
      },
    ];

    return { reply: reply.trim(), actions };
  }

  // ──── MODUL PRIORITAS 1: PURCHASE ORDER (PO / PENGADAAN BAHAN BAKU) ────
  const isPOQuery =
    /\bpo\b/i.test(q) ||
    q.includes('purchase order') ||
    q.includes('purchase orders') ||
    q.includes('pengadaan') ||
    q.includes('po-') ||
    q.includes('p.o');

  if (isPOQuery) {
    return buildPurchaseOrderReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // ──── MODUL PRIORITAS 2: VENDORS / SUPPLIER BAHAN BAKU ────
  const isVendorQuery =
    q.includes('vendor') ||
    q.includes('vendors') ||
    q.includes('supplier') ||
    q.includes('suppliers') ||
    q.includes('pemasok') ||
    q.includes('kulakan');

  if (isVendorQuery) {
    return buildVendorsReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // ──── MODUL PRIORITAS 3: USER MANAGEMENT / MANAJEMEN PENGGUNA & STAF KARYAWAN ────

  // 3A. TANYA KHUSUS PETUGAS STOK / BAGIAN GUDANG
  const isPetugasStokQuery =
    q.includes('petugas stok') ||
    q.includes('staf stok') ||
    q.includes('staff stok') ||
    q.includes('karyawan stok') ||
    q.includes('pegawai stok') ||
    q.includes('admin stok') ||
    q.includes('petugas gudang') ||
    q.includes('staf gudang') ||
    q.includes('staff gudang') ||
    q.includes('bagian stok') ||
    q.includes('bagian gudang') ||
    (q.includes('stok') &&
      (q.includes('petugas') ||
        q.includes('karyawan') ||
        q.includes('pegawai') ||
        q.includes('staf') ||
        q.includes('staff') ||
        q.includes('orang') ||
        q.includes('siapa') ||
        q.includes('nama') ||
        q.includes('kontak') ||
        q.includes('nomor') ||
        q.includes('telepon') ||
        q.includes('hp') ||
        q.includes('wa')));

  if (isPetugasStokQuery) {
    return buildPetugasStokReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // 3B. TANYA KHUSUS TOTAL KARYAWAN / STAF / PEGAWAI INTERNAL
  const isStaffSummaryQuery =
    q.includes('total staf') ||
    q.includes('total staff') ||
    q.includes('berapa staf') ||
    q.includes('berapa staff') ||
    q.includes('jumlah staf') ||
    q.includes('jumlah staff') ||
    q.includes('ada berapa staf') ||
    q.includes('ada berapa staff') ||
    q.includes('staf ada berapa') ||
    q.includes('staff ada berapa') ||
    q.includes('daftar staf') ||
    q.includes('daftar staff') ||
    q.includes('siapa saja staf') ||
    q.includes('siapa saja staff') ||
    q.includes('total karyawan') ||
    q.includes('berapa karyawan') ||
    q.includes('jumlah karyawan') ||
    q.includes('ada berapa karyawan') ||
    q.includes('karyawan ada berapa') ||
    q.includes('daftar karyawan') ||
    q.includes('siapa saja karyawan') ||
    q.includes('karyawan disini') ||
    q.includes('staf disini') ||
    q.includes('staff disini') ||
    q.includes('karyawan atau staf') ||
    q.includes('karyawan ataaw staf') ||
    q.includes('karyawan dan staf') ||
    q.includes('staf atau karyawan') ||
    q.includes('staff atau karyawan') ||
    q.includes('jumlah pegawai') ||
    q.includes('total pegawai') ||
    q.includes('berapa pegawai') ||
    q.includes('ada berapa pegawai') ||
    q.includes('daftar pegawai') ||
    (q.includes('karyawan') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa') ||
        q.includes('list') ||
        q.includes('semua') ||
        q.includes('disini'))) ||
    (q.includes('staf') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa') ||
        q.includes('list') ||
        q.includes('semua') ||
        q.includes('disini'))) ||
    (q.includes('staff') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa') ||
        q.includes('list') ||
        q.includes('semua') ||
        q.includes('disini'))) ||
    (q.includes('pegawai') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa')));

  if (isStaffSummaryQuery) {
    return buildStaffSummaryReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // 3C. TANYA KHUSUS KASIR
  const isKasirStaffQuery =
    q.includes('total kasir') ||
    q.includes('berapa kasir') ||
    q.includes('jumlah kasir') ||
    q.includes('ada berapa kasir') ||
    q.includes('kasir ada berapa') ||
    q.includes('daftar kasir') ||
    q.includes('siapa kasir') ||
    q.includes('kontak kasir') ||
    (q.includes('kasir') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa') ||
        q.includes('kontak') ||
        q.includes('telepon')));

  if (isKasirStaffQuery) {
    return buildKasirReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // 3D. TANYA KHUSUS ADMIN
  const isAdminStaffQuery =
    q.includes('total admin') ||
    q.includes('berapa admin') ||
    q.includes('jumlah admin') ||
    q.includes('ada berapa admin') ||
    q.includes('admin ada berapa') ||
    q.includes('daftar admin') ||
    q.includes('siapa admin') ||
    q.includes('kontak admin') ||
    (q.includes('admin') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa') ||
        q.includes('kontak')));

  if (isAdminStaffQuery) {
    return buildAdminStaffReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // 3E. TANYA KHUSUS OWNER
  const isOwnerStaffQuery =
    q.includes('total owner') ||
    q.includes('berapa owner') ||
    q.includes('jumlah owner') ||
    q.includes('ada berapa owner') ||
    q.includes('owner ada berapa') ||
    q.includes('daftar owner') ||
    q.includes('siapa owner') ||
    q.includes('pemilik') ||
    q.includes('kontak owner') ||
    (q.includes('owner') &&
      (q.includes('berapa') ||
        q.includes('total') ||
        q.includes('jumlah') ||
        q.includes('ada') ||
        q.includes('siapa') ||
        q.includes('kontak')));

  if (isOwnerStaffQuery) {
    return buildOwnerStaffReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // 3F. TANYA USER MANAGEMENT / MANAJEMEN PENGGUNA SECARA UMUM
  const isUserMgmtQuery =
    q.includes('user manajemen') ||
    q.includes('manajemen user') ||
    q.includes('user management') ||
    q.includes('manajemen pengguna') ||
    q.includes('data user') ||
    q.includes('daftar user') ||
    q.includes('kelola user') ||
    q.includes('kelola pengguna') ||
    q.includes('rekap user') ||
    q.includes('data pengguna') ||
    q.includes('daftar pengguna') ||
    q.includes('berapa user') ||
    q.includes('total user') ||
    q.includes('jumlah user') ||
    q.includes('ada berapa user') ||
    q.includes('user ada berapa') ||
    q.includes('berapa pengguna') ||
    q.includes('total pengguna') ||
    q.includes('jumlah pengguna') ||
    q.includes('ada berapa pengguna') ||
    q.includes('pengguna ada berapa') ||
    q.includes('total akun') ||
    q.includes('daftar akun');

  if (isUserMgmtQuery) {
    return buildUserManagementReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // ──── MODUL PRIORITAS 4: PRODUCT CATALOG / KATALOG PRODUK ────
  const isCatalogQuery =
    q.includes('product catalog') ||
    q.includes('pruduct catalog') ||
    q.includes('katalog produk') ||
    q.includes('katalog menu') ||
    q.includes('daftar produk') ||
    q.includes('semua produk') ||
    q.includes('total produk') ||
    q.includes('jumlah produk');

  if (isCatalogQuery) {
    return buildProductCatalogReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // ──── MODUL PRIORITAS 5: ORDER HISTORY / RIWAYAT PESANAN ────
  const isOrderHistoryQuery =
    q.includes('order history') ||
    q.includes('history order') ||
    q.includes('riwayat order') ||
    q.includes('history pesanan') ||
    q.includes('rekap order');

  if (isOrderHistoryQuery) {
    return buildOrderHistoryReport(db, userRole, userName, isCountOnlyQuery(q));
  }

  // 0. DETEKSI PRIORITAS: PERMINTAAN LAPORAN LANGSUNG ATAU NOTIFIKASI PEMBELIAN (WHATSAPP / EMAIL)
  // ATURAN MUTLAK: Hanya aktif jika user secara EKSPLISIT memerintahkan kirim/laporkan!
  const isDirectReport = isExplicitReport;

  if (isDirectReport) {
    // 0A. Laporan Stok untuk Petugas Stok / Gudang
    if (
      !isAboutStaffNotIngredients &&
      (
        q.includes('stok') ||
        q.includes('bahan') ||
        q.includes('gudang') ||
        q.includes('kritis') ||
        q.includes('menipis') ||
        (userRole === 'PETUGAS_STOK' && !q.includes('omset') && !q.includes('pelanggan'))
      )
    ) {
      return buildStockReport(db, userRole, userName, true);
    }

    // 0B. Notifikasi Pembelian / Struk Belanja
    if (
      q.includes('beli') ||
      q.includes('pembelian') ||
      q.includes('struk') ||
      q.includes('nota') ||
      q.includes('invoice') ||
      q.includes('notifikasi beli') ||
      q.includes('pesanan saya') ||
      q.includes('notifikasi pesanan') ||
      (userRole === 'PELANGGAN' &&
        (q.includes('notifikasi') ||
          q.includes('whatsapp') ||
          q.includes('email') ||
          Boolean(q.match(/\bwa\b/))))
    ) {
      return buildOrderNotification(db, userRole, userName, db.searchedOrderCode, true);
    }

    // 0C. Laporan Penjualan & Omset untuk Owner / Admin / Kasir
    if (
      q.includes('omset') ||
      q.includes('omzet') ||
      q.includes('penjualan') ||
      q.includes('keuangan') ||
      q.includes('pendapatan') ||
      (q.includes('laporan') && (q.includes('kasir') || q.includes('transaksi') || q.includes('omset'))) ||
      (userRole === 'OWNER' && q.includes('laporan') && !q.includes('stok') && !q.includes('resep'))
    ) {
      return buildSalesReport(db, userRole, userName, true);
    }

    // 0D. Laporan Rekap Pengguna untuk Admin
    if (
      q.includes('pengguna') ||
      q.includes('user') ||
      (q.includes('pelanggan') && userRole !== 'PELANGGAN') ||
      (q.includes('laporan') && (q.includes('admin') || q.includes('staf') || q.includes('karyawan') || q.includes('user')))
    ) {
      return buildUserReport(db, userRole, userName, true);
    }

    // Fallback direct report berdasarkan peran jika kata kunci laporan eksplisit
    if (q.includes('laporan')) {
      if (userRole === 'OWNER') return buildSalesReport(db, userRole, userName, true);
      if (userRole === 'PETUGAS_STOK') return buildStockReport(db, userRole, userName, true);
      if (userRole === 'ADMIN') return buildSalesReport(db, userRole, userName, true);
      if (userRole === 'KASIR') return buildSalesReport(db, userRole, userName, true);
    }
  }

  // 1. TANYA TENTANG PELANGGAN ("Ada berapa pelanggan", "Berapa pelanggan", dll)
  if (
    q.includes('berapa pelanggan') ||
    q.includes('jumlah pelanggan') ||
    q.includes('total pelanggan') ||
    q.includes('ada berapa pelanggan') ||
    q.includes('data pelanggan') ||
    q.includes('daftar pelanggan') ||
    q.includes('customer') ||
    (q.includes('pelanggan') &&
      (q.includes('ada') ||
        q.includes('berapa') ||
        q.includes('total') ||
        q.includes('siapa') ||
        q.includes('banyak')))
  ) {
    const { totalPelanggan, activePelanggan, inactivePelanggan, totalUsers } = db.metrics;
    const pelangganList = db.users.filter((u) => u.role === 'PELANGGAN');

    if (isCountOnlyQuery(q)) {
      return {
        reply: `Berdasarkan database saat ini, terdapat total ${totalPelanggan} pelanggan terdaftar (${activePelanggan} aktif dan ${inactivePelanggan} nonaktif).`,
      };
    }

    let reply = `👥 **Data Pelanggan (Akses Penuh Database Kopi Mahasiswa)**\n`;
    reply += `👤 _Penanya: **${userName || userRole}** (${userRole})_\n\n`;
    reply += `Berdasarkan database MySQL saat ini, terdapat total **${totalPelanggan} pelanggan** terdaftar:\n`;
    reply += `• 🟢 **${activePelanggan} Pelanggan Aktif**\n`;
    reply += `• 🔴 **${inactivePelanggan} Pelanggan Nonaktif**\n\n`;

    if (pelangganList.length > 0) {
      reply += `📋 **Daftar Akun Pelanggan:**\n`;
      for (const p of pelangganList) {
        const phoneStr = p.phone ? ` | 📞 ${p.phone}` : '';
        const dateStr = new Date(p.createdAt).toLocaleDateString('id-ID');
        reply += `  • **${p.name}** (${p.email}${phoneStr}) — ${
          p.isActive ? '✅ Aktif' : '❌ Nonaktif'
        } (Daftar: ${dateStr})\n`;
      }
      reply += `\n`;
    } else {
      reply += `_Belum ada akun dengan peran Pelanggan di database._\n\n`;
    }

    reply += `📊 **Total Semua Pengguna:** **${totalUsers} orang** (${db.metrics.totalAdmin} Admin, ${db.metrics.totalOwner} Owner, ${db.metrics.totalKasir} Kasir, ${db.metrics.totalPetugasStok} Petugas Stok, ${totalPelanggan} Pelanggan).\n`;
    reply += `💡 Anda dapat menambah atau mengedit pelanggan langsung melalui menu **User Management**!`;
    const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
    return { reply, actions };
  }

  // 2. TANYA SEMUA PENGGUNA / USER / AKUN / STAF / KASIR / ADMIN
  if (
    q.includes('pengguna') ||
    q.includes('user') ||
    q.includes('akun') ||
    q.includes('kasir') ||
    q.includes('admin') ||
    q.includes('owner') ||
    q.includes('staf') ||
    q.includes('staff')
  ) {
    if (isCountOnlyQuery(q)) {
      return {
        reply: `Berdasarkan database saat ini, total pengguna terdaftar adalah ${db.users.length} akun (${db.metrics.totalOwner} Owner, ${db.metrics.totalAdmin} Admin, ${db.metrics.totalKasir} Kasir, ${db.metrics.totalPetugasStok} Petugas Stok, ${db.metrics.totalPelanggan} Pelanggan).`,
      };
    }

    let reply = `👥 **Daftar Seluruh Pengguna Sistem (Real-Time Database)**\n`;
    reply += `Total: **${db.users.length} akun** terdaftar di database:\n\n`;

    const grouped: Record<string, typeof db.users> = {};
    for (const u of db.users) {
      if (!grouped[u.role]) grouped[u.role] = [];
      grouped[u.role].push(u);
    }

    for (const [role, uList] of Object.entries(grouped)) {
      reply += `🏷️ **Peran: ${role} (${uList.length} orang)**\n`;
      for (const u of uList) {
        const phone = u.phone ? ` | HP: ${u.phone}` : '';
        reply += `  • **${u.name}** — ${u.email}${phone} (${
          u.isActive ? '🟢 Aktif' : '🔴 Nonaktif'
        })\n`;
      }
      reply += `\n`;
    }
    const actions = isExplicitReport ? (buildUserReport(db, userRole, userName, true).actions || []) : [];
    return { reply: reply.trim(), actions };
  }

  // 3. TANYA TENTANG RESEP / KOMPOSISI MENU KOPI
  if (
    q.includes('resep') ||
    q.includes('komposisi') ||
    q.includes('takaran') ||
    q.includes('cara buat') ||
    q.includes('bahan pembuatan')
  ) {
    // 3a. ATURAN KETAT: Jika menanyakan resep 1 menu spesifik, tampilkan HANYA menu tersebut!
    const matchedProduct = db.products.find((p) => q.includes(p.name.toLowerCase()));
    if (matchedProduct) {
      if (!matchedProduct.recipes || matchedProduct.recipes.length === 0) {
        return {
          reply: `☕ **${matchedProduct.name}**\nHarga: **Rp ${matchedProduct.price.toLocaleString('id-ID')}**\n_Belum ada rincian takaran gramasi bahan di database kedai._`,
        };
      }
      let reply = `☕ **Resep & Komposisi: ${matchedProduct.name}**\n`;
      reply += `• **Harga Jual:** Rp ${matchedProduct.price.toLocaleString('id-ID')}\n`;
      reply += `• **Takaran Bahan:**\n`;
      for (const r of matchedProduct.recipes) {
        reply += `  - **${r.ingredient.name}**: ${r.quantity} ${r.ingredient.unit}\n`;
      }
      return { reply: reply.trim() };
    }

    // Jika menanyakan resep produk spesifik yang tidak ada di database:
    const isAskingSpecificItem = !q.includes('semua') && !q.includes('daftar') && !q.includes('katalog') && !q.includes('seluruh');
    if (isAskingSpecificItem && (q.includes('resep') || q.includes('komposisi'))) {
      return {
        reply: `Maaf, data resep tersebut tidak tersedia di sistem kedai Kopi Mahasiswa. ☕`,
      };
    }

    let reply = `📖 **Data Resep & Komposisi Menu (Database Kopi Mahasiswa):**\n\n`;
    const productsWithRecipes = db.products.filter((p) => p.recipes && p.recipes.length > 0);

    if (productsWithRecipes.length === 0) {
      reply += `Belum ada resep yang dihubungkan ke produk di database.`;
    } else {
      for (const p of productsWithRecipes) {
        reply += `☕ **${p.name}** (Harga: Rp ${p.price.toLocaleString('id-ID')}):\n`;
        for (const r of p.recipes || []) {
          reply += `   - **${r.ingredient.name}**: ${r.quantity} ${r.ingredient.unit} (Modal: Rp ${r.ingredient.costPerUnit}/${r.ingredient.unit})\n`;
        }
        reply += `\n`;
      }
    }
    return { reply: reply.trim() };
  }

  // 4. TANYA TENTANG SUPPLIER / PEMASOK
  if (
    q.includes('supplier') ||
    q.includes('pemasok') ||
    q.includes('vendor') ||
    q.includes('kulakan')
  ) {
    let reply = `🚚 **Daftar Supplier & Pemasok Bahan Baku (Database):**\n\n`;
    if (db.suppliers.length === 0) {
      reply += `Belum ada data supplier yang tersimpan di database.`;
    } else {
      for (const s of db.suppliers) {
        reply += `• 🏢 **${s.name}**\n`;
        reply += `   📞 Kontak: ${s.contactInfo || '-'}\n`;
        reply += `   📍 Alamat: ${s.address || '-'}\n\n`;
      }
    }
    return { reply: reply.trim(), actions: isExplicitReport ? (buildStockReport(db, userRole, userName, true).actions || []) : [] };
  }

  // 5. TANYA TENTANG INVENTARIS, BAHAN BAKU & SISA STOK
  const isSOPOrHowTo =
    q.includes('sop') ||
    q.includes('bagaimana') ||
    q.includes('suhu') ||
    q.includes('frothing') ||
    q.includes('grinder') ||
    q.includes('kalibrasi');

  if (
    !isAboutStaffNotIngredients &&
    !isSOPOrHowTo &&
    (
      q.includes('stok') ||
      q.includes('bahan baku') ||
      q.includes('gudang') ||
      q.includes('sisa bahan') ||
      q.includes('inventaris') ||
      q.includes('inventory') ||
      q.includes('menipis') ||
      q.includes('kritis') ||
      q.includes('biji kopi') ||
      q.includes('susu') ||
      q.includes('gula') ||
      q.includes('sirup') ||
      q.includes('syrup')
    )
  ) {
    // 5a. ATURAN KETAT: Jika pengguna menanyakan stok 1 bahan spesifik, jawab HANYA bahan tersebut!
    const matchedIng = db.ingredients.find((i) => q.includes(i.name.toLowerCase()));
    if (matchedIng) {
      const isCritical = matchedIng.stock <= matchedIng.minStock;
      const isThin = matchedIng.stock <= matchedIng.minStock * 1.5;
      const statusIcon = isCritical ? '🔴 KRITIS (Restock Segera)' : isThin ? '🟡 MENIPIS' : '🟢 AMAN';

      let reply = `📦 **Stok Bahan Baku: ${matchedIng.name}**\n`;
      reply += `• **Sisa Stok:** **${matchedIng.stock} ${matchedIng.unit}**\n`;
      reply += `• **Batas Minimal:** ${matchedIng.minStock} ${matchedIng.unit}\n`;
      reply += `• **Status:** ${statusIcon}\n`;

      let actions: ActionButton[] = [];
      if (isCritical && isExplicitReport) {
        reply += `\n🚨 _Perhatian: Stok ${matchedIng.name} berada di bawah batas aman! Segera lakukan pengadaan._`;
        actions = buildStockReport(db, userRole, userName, true).actions || [];
      }
      return { reply: reply.trim(), actions };
    }

    // Jika menanyakan stok bahan yang tidak ada di database:
    const isAskingSpecificIng =
      !q.includes('semua') &&
      !q.includes('daftar') &&
      !q.includes('laporan') &&
      !q.includes('ringkasan') &&
      !q.includes('kritis') &&
      !q.includes('menipis');

    if (isAskingSpecificIng && (q.includes('stok') || q.includes('sisa'))) {
      const knownIngredients = db.ingredients.map((i) => i.name.toLowerCase());
      const mentionsAnyKnown = knownIngredients.some((name) => q.includes(name));
      if (!mentionsAnyKnown && (q.includes('stok ') || q.includes('sisa '))) {
        return {
          reply: `Maaf, data bahan baku tersebut tidak tersedia di sistem inventaris Kopi Mahasiswa. ☕\nBahan baku terdaftar: ${db.ingredients.map((i) => i.name).join(', ')}.`,
        };
      }
    }

    return buildStockReport(db, userRole, userName, isExplicitReport);
  }

  // 6. TANYA TENTANG OMSET, KEUANGAN, PENDAPATAN, TRANSAKSI
  if (
    q.includes('omset') ||
    q.includes('omzet') ||
    q.includes('pendapatan') ||
    q.includes('penjualan') ||
    q.includes('pemasukan') ||
    q.includes('keuntungan') ||
    q.includes('laba') ||
    q.includes('revenue') ||
    q.includes('profit')
  ) {
    if (isCountOnlyQuery(q)) {
      const avg = db.metrics.totalOrders > 0 ? Math.round(db.metrics.totalRevenue / db.metrics.totalOrders) : 0;
      return {
        reply: `Total omset Kopi Mahasiswa saat ini adalah **Rp ${db.metrics.totalRevenue.toLocaleString('id-ID')}** dari ${db.metrics.totalOrders} transaksi (rata-rata Rp ${avg.toLocaleString('id-ID')}/transaksi).`,
      };
    }
    return buildSalesReport(db, userRole, userName, isExplicitReport);
  }

  // 7. TANYA STATUS / REKAP PESANAN (ORDERS)
  if (
    q.includes('berapa pesanan') ||
    q.includes('total pesanan') ||
    q.includes('pesanan pending') ||
    q.includes('pesanan selesai') ||
    q.includes('antrian pesanan') ||
    q.includes('riwayat pesanan') ||
    q.includes('daftar pesanan') ||
    q.includes('rekap pesanan') ||
    q.includes('kelola pesanan') ||
    q.includes('status pesanan') ||
    q.includes('pesanan hari ini') ||
    (q.includes('pesanan') && (q.includes('berapa') || q.includes('ada') || q.includes('total') || q.includes('rekap') || q.includes('data') || q.includes('list') || q.includes('semua')))
  ) {
    // ATURAN MUTLAK: Jika hanya menanyakan JUMLAH/TOTAL pesanan, jawab angka saja!
    if (isCountOnlyQuery(q)) {
      return {
        reply: `Total pesanan masuk saat ini adalah **${db.metrics.totalOrders} pesanan** (${db.metrics.completedOrders} selesai, ${db.metrics.pendingOrders} pending).`,
      };
    }

    let reply = `🧾 **Rekapitulasi Pesanan (Database):**\n\n`;
    reply += `• Total Pesanan Masuk: **${db.metrics.totalOrders}**\n`;
    reply += `• Pesanan Pending: **${db.metrics.pendingOrders}**\n`;
    reply += `• Pesanan Selesai: **${db.metrics.completedOrders}**\n\n`;

    if (db.orders.length > 0) {
      reply += `📋 **Daftar Pesanan Terkini:**\n`;
      for (const o of db.orders.slice(0, 5)) {
        const cust = o.user?.name || 'Pelanggan Walk-in';
        const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID');
        reply += `  • **${o.code}** (${cust}) — Rp ${o.totalAmount.toLocaleString(
          'id-ID'
        )} [${o.status}] — ${dateStr}\n`;
      }
    }
    return {
      reply: reply.trim(),
      actions: isExplicitReport ? (buildOrderNotification(db, userRole, userName, db.searchedOrderCode, true).actions || []) : [],
    };
  }

  // 8. TANYA DETAIL PESANAN SPESIFIK (ORD-...)
  if (db.orderInfo) {
    return buildOrderNotification(db, userRole, userName, db.orderInfo.code, isExplicitReport);
  }
  if (db.searchedOrderCode) {
    return {
      reply: `🔍 Pesanan dengan kode **${db.searchedOrderCode}** tidak ditemukan di database. Pastikan kode pesanan sudah sesuai.`,
    };
  }

  // 9. TANYA TENTANG EVENT / ACARA & RESERVASI
  if (
    q.includes('event') ||
    q.includes('acara') ||
    q.includes('workshop') ||
    q.includes('booking') ||
    q.includes('reservasi')
  ) {
    if (isCountOnlyQuery(q)) {
      return {
        reply: `Saat ini terdapat ${db.events.length} event/acara yang terdaftar di database Kopi Mahasiswa.`,
      };
    }
    let reply = `🎉 **Data Event & Acara Kopi Mahasiswa (Database):**\n\n`;
    if (db.events.length === 0) {
      reply += `Saat ini belum ada event atau acara khusus yang dijadwalkan di database.`;
    } else {
      for (const ev of db.events) {
        const d = new Date(ev.date).toLocaleDateString('id-ID');
        reply += `• 🎪 **${ev.title}**\n   Tanggal: ${d} | Waktu: ${ev.time}\n   Kapasitas: ${
          ev.capacity
        } kursi | Tiket: Rp ${ev.price.toLocaleString('id-ID')}\n\n`;
      }
    }
    return { reply: reply.trim() };
  }

  // 10. TANYA TENTANG ULASAN / REVIEW / RATING
  if (
    q.includes('review') ||
    q.includes('ulasan') ||
    q.includes('rating') ||
    q.includes('bintang')
  ) {
    if (isCountOnlyQuery(q)) {
      return {
        reply: `Berdasarkan database saat ini, terdapat total ${db.reviews.length} ulasan/review dari pelanggan.`,
      };
    }
    let reply = `⭐ **Ulasan & Rating Produk Pelanggan (Database):**\n\n`;
    if (db.reviews.length === 0) {
      reply += `Belum ada ulasan yang masuk di database dari pelanggan.`;
    } else {
      for (const rev of db.reviews) {
        reply += `• **${rev.product?.name || 'Produk'}** — ${'⭐'.repeat(rev.rating)}\n   _\"${
          rev.comment || 'Sangat memuaskan!'
        }\"_ — oleh **${rev.user?.name || 'Pelanggan'}**\n\n`;
      }
    }
    return { reply: reply.trim() };
  }

  // 11. TANYA TENTANG PROMO AKTIF
  if (
    q.includes('promo') ||
    q.includes('diskon') ||
    q.includes('potongan') ||
    q.includes('voucher')
  ) {
    if (isCountOnlyQuery(q)) {
      const aktif = db.promotions.filter((p) => p.active).length;
      return {
        reply: `Berdasarkan database saat ini, terdapat ${db.promotions.length} promo terdaftar (${aktif} aktif).`,
      };
    }
    let reply = `🔥 **Promo Aktif di Kopi Mahasiswa (Database):**\n\n`;
    if (db.promotions.length === 0) {
      reply += `Saat ini belum ada promo aktif di database. Namun semua harga menu kami dijamin terjangkau untuk mahasiswa! ☕`;
    } else {
      for (const pr of db.promotions) {
        const val =
          pr.type === 'PERCENTAGE' ? `${pr.value}%` : `Rp ${pr.value.toLocaleString('id-ID')}`;
        reply += `• 🎉 **${pr.name}**\n   Diskon: **${val}**\n\n`;
      }
    }
    return { reply: reply.trim() };
  }

  // 12. TANYA TENTANG JAM OPERASIONAL / JADWAL
  if (
    q.includes('jam buka') ||
    q.includes('buka jam') ||
    q.includes('jadwal') ||
    q.includes('operasional') ||
    q.includes('tutup')
  ) {
    let reply = `🕒 **Jadwal Operasional Kopi Mahasiswa (Database):**\n\n`;
    if (db.schedules.length === 0) {
      reply += `• Setiap Hari (Senin - Minggu): 08:00 - 23:00 WIB`;
    } else {
      for (const s of db.schedules) {
        const shift = s.shiftKasir ? ` (Shift: ${s.shiftKasir})` : '';
        reply += `• **${s.hari}:** ${s.jamBuka} - ${s.jamTutup} WIB${shift}\n`;
      }
    }
    reply += `\nFasilitas: Wi-Fi kencang, banyak colokan, cocok buat nugas! 💻☕`;
    return { reply: reply.trim() };
  }

  // 13. TANYA TENTANG MENU & HARGA
  if (
    q.includes('menu') ||
    q.includes('daftar harga') ||
    q.includes('katalog') ||
    q.includes('kopi apa') ||
    q.includes('harga')
  ) {
    // 13a. ATURAN KETAT: Jika pengguna menanyakan 1 item produk spesifik, jawab HANYA produk tersebut!
    // DILARANG KERAS memuntahkan seluruh katalog jika ditanya 1 menu.
    const matchedProduct = db.products.find((p) => q.includes(p.name.toLowerCase()));
    if (matchedProduct) {
      let reply = `☕ **${matchedProduct.name}**\n`;
      reply += `• **Harga:** **Rp ${matchedProduct.price.toLocaleString('id-ID')}**\n`;
      reply += `• **Kategori:** ${matchedProduct.category?.name || 'Kopi'}\n`;
      reply += `• **Status:** ${matchedProduct.active ? '🟢 Tersedia' : '🔴 Sedang Kosong'}\n`;
      if (matchedProduct.description) {
        reply += `• **Keterangan:** _${matchedProduct.description}_\n`;
      }
      return { reply: reply.trim() };
    }

    // 13b. Jika menanyakan harga produk spesifik yang tidak ada di database kedai:
    // Contoh: "berapa harga Matcha Boba?", "harga es teh manis"
    const isAskingSpecificPrice =
      q.includes('harga') &&
      !q.includes('semua') &&
      !q.includes('daftar') &&
      !q.includes('katalog') &&
      !q.includes('menu') &&
      !q.includes('apa saja') &&
      !q.includes('kopi mahasiswa');

    if (isAskingSpecificPrice) {
      return {
        reply: `Maaf, data menu tersebut tidak tersedia di sistem kedai Kopi Mahasiswa. ☕\nSilakan tanyakan menu kopi kami yang tersedia seperti Espresso Classic, Vanilla Latte, Cold Brew Original, Caramel Frappuccino, dsb.`,
      };
    }

    // 13c. Jika hanya menanyakan total / jumlah menu:
    if (
      isCountOnlyQuery(q) &&
      (q.includes('menu') || q.includes('katalog') || q.includes('produk') || q.includes('varian') || q.includes('minuman') || q.includes('makanan'))
    ) {
      return {
        reply: `Berdasarkan database saat ini, terdapat total ${db.products.length} menu aktif yang terbagi dalam ${db.categories.length} kategori (${db.categories.map((c) => c.name).join(', ')}).`,
      };
    }

    let reply = `📋 **Daftar Menu Kopi Mahasiswa (Database Real-Time):**\n\n`;
    const grouped: Record<string, typeof db.products> = {};
    for (const p of db.products) {
      const cat = p.category?.name || 'Menu Lainnya';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }

    for (const [cat, items] of Object.entries(grouped)) {
      reply += `☕ **Kategori: ${cat}**\n`;
      for (const it of items) {
        reply += `  • **${it.name}** — Rp ${it.price.toLocaleString('id-ID')}\n`;
        if (it.description) {
          reply += `    _${it.description}_\n`;
        }
      }
      reply += `\n`;
    }
    return { reply: reply.trim() };
  }

  // 14. TANYA RINGKASAN SELURUH ISI DATABASE LARAGON
  if (
    isDatabaseQuery(q) ||
    q.includes('seluruh database') ||
    q.includes('isi database') ||
    q.includes('akses penuh') ||
    q.includes('ringkasan database') ||
    q.includes('cek database') ||
    q.includes('status database') ||
    q.includes('database apa saja')
  ) {
    return buildLaragonDatabaseResponse(db, userRole, userName);
  }

  // 15. Default Fallback — Singkat per Role
  let defaultReply = '';
  let fallbackActions: ActionButton[] = [];

  if (userRole === 'PELANGGAN') {
    defaultReply = `Saya bisa bantu info menu, harga, promo, status pesanan, atau jam buka. Mau tanya apa, Kak? ☕`;
    fallbackActions = [];
  } else if (userRole === 'KASIR') {
    defaultReply = `Mau cek pesanan, kirim struk, atau info menu? Silakan tanya! ☕`;
    fallbackActions = [];
  } else if (userRole === 'ADMIN') {
    defaultReply = `Mau cek data pengguna, laporan penjualan, atau info sistem? Silakan! 🛡️`;
    fallbackActions = [];
  } else if (userRole === 'OWNER') {
    defaultReply = `Mau lihat laporan omset, stok, atau menu terlaris? Silakan tanya! 👑`;
    fallbackActions = [];
  } else if (userRole === 'PETUGAS_STOK') {
    defaultReply = `Mau cek stok bahan baku, laporan inventaris, atau info supplier? Silakan! 📦`;
    fallbackActions = [];
  } else {
    defaultReply = `Ada yang bisa saya bantu seputar Kopi Mahasiswa? ☕`;
    fallbackActions = [];
  }

  return { reply: defaultReply, actions: fallbackActions };
}

// ─────────────────────────────────────────
// Pembuatan System Prompt Lengkap untuk Model AI Eksternal
// ─────────────────────────────────────────

function buildFullDatabaseSystemPrompt(
  db: FullDatabaseData,
  userRole: string,
  userName: string | null,
  userEmail: string | null = null
): string {
  const usersList = db.users
    .map(
      (u) =>
        `- ${u.name} | Role: ${u.role} | Email: ${u.email} | Telp: ${u.phone || '-'} | Status: ${
          u.isActive ? 'Aktif' : 'Nonaktif'
        } | Bergabung: ${new Date(u.createdAt).toLocaleDateString('id-ID')}`
    )
    .join('\n');

  const productsList = db.products
    .map((p) => {
      const rec = (p.recipes || [])
        .map((r) => `${r.ingredient.name} (${r.quantity} ${r.ingredient.unit})`)
        .join(', ');
      return `- ${p.name} (Kategori: ${p.category?.name || 'Umum'}): Rp ${p.price.toLocaleString(
        'id-ID'
      )} | Aktif: ${p.active ? 'Ya' : 'Tidak'} | Resep: [${rec || 'Tanpa resep'}]`;
    })
    .join('\n');

  const ingredientsList = db.ingredients
    .map(
      (i) => {
        const status = i.stock <= i.minStock ? '🔴 KRITIS' : i.stock <= i.minStock * 1.5 ? '🟡 MENIPIS' : '🟢 AMAN';
        return `- ${i.name}: Sisa ${i.stock} ${i.unit} | Min: ${i.minStock} ${i.unit} | Modal: Rp ${i.costPerUnit} | Status: ${status}`;
      }
    )
    .join('\n');

  const suppliersList = db.suppliers
    .map((s) => `- ${s.name}: Telp: ${s.contactInfo || '-'} | Alamat: ${s.address || '-'}`)
    .join('\n');

  const schedulesList = db.schedules
    .map((s) => `- ${s.hari}: ${s.jamBuka} - ${s.jamTutup} (Shift Kasir: ${s.shiftKasir || 'Normal'})`)
    .join('\n');

  const promotionsList = db.promotions
    .map((pr) => `- ${pr.name}: Diskon ${pr.value}${pr.type === 'PERCENTAGE' ? '%' : ' Rp'} | Aktif: ${pr.active ? 'Ya' : 'Tidak'}`)
    .join('\n');

  const ordersList = db.orders
    .slice(0, 15)
    .map((o) => {
      const tgl = new Date(o.createdAt).toLocaleDateString('id-ID');
      const items = (o.items || []).map((it) => `${it.quantity}x ${it.product?.name || '-'}`).join(', ');
      return `- [${o.code}] ${o.user?.name || 'Walk-in'} | Rp ${o.totalAmount.toLocaleString('id-ID')} | Status: ${o.status} | Kasir: ${o.kasir?.name || '-'} | ${tgl} | Item: ${items || '-'}`;
    })
    .join('\n');

  const eventsList = db.events
    .map((ev) => `- ${ev.title}: ${new Date(ev.date).toLocaleDateString('id-ID')} ${ev.time} | Kapasitas: ${ev.capacity} | Tiket: Rp ${ev.price.toLocaleString('id-ID')}`)
    .join('\n');

  const reviewsList = db.reviews
    .map((r) => `- ${r.product?.name || 'Produk'} ⭐${r.rating}/5 oleh ${r.user?.name || 'Pelanggan'}: "${r.comment || '-'}"`)
    .join('\n');

  const rewardsList = db.rewards
    .map((r) => `- ${r.user?.name || '-'} (${r.user?.email || '-'}): ${r.poin} poin`)
    .join('\n');

  const poList = db.purchaseOrders
    .map((po) => {
      const itemsDetail = (po.items || [])
        .map(
          (it) =>
            `${it.quantity} ${it.ingredient?.unit || 'unit'} ${it.ingredient?.name || 'Bahan'} (Rp ${it.totalCost.toLocaleString('id-ID')})`
        )
        .join(', ');
      const totalCost = (po.items || []).reduce((sum, it) => sum + (it.totalCost || 0), 0);
      const costStr = totalCost > 0 ? ` | Biaya: Rp ${totalCost.toLocaleString('id-ID')}` : '';
      return `- [${po.code}] Supplier: ${po.supplier?.name || '-'} | Status: ${po.status}${costStr} | Item: ${itemsDetail || '-'}`;
    })
    .join('\n');

  const stockMovList = db.stockMovements
    .slice(0, 10)
    .map((sm) => `- ${sm.type} | ${sm.ingredient?.name || '-'}: ${sm.quantity} ${sm.ingredient?.unit || ''} | ${sm.description || '-'} | ${new Date(sm.createdAt).toLocaleDateString('id-ID')}`)
    .join('\n');

  const m = db.metrics;

  const canAccessFinancial = ['ADMIN', 'OWNER', 'KASIR'].includes(userRole);
  const canAccessStock = ['ADMIN', 'OWNER', 'PETUGAS_STOK'].includes(userRole);
  const canAccessUsers = ['ADMIN', 'OWNER'].includes(userRole);
  const canAccessAllOrders = ['ADMIN', 'OWNER', 'KASIR'].includes(userRole);

  // Hitung menu terlaris dari orders
  const itemSales: Record<string, number> = {};
  for (const o of db.orders) {
    for (const it of o.items || []) {
      const name = it.product?.name || 'Menu';
      itemSales[name] = (itemSales[name] || 0) + it.quantity;
    }
  }
  const topMenu = Object.entries(itemSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${name} (${qty} porsi)`)
    .join(', ');

  return `Kamu adalah **AI Barista & Asisten Admin resmi** untuk kedai **Kopi Mahasiswa** yang cerdas, ramah, dan presisi.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ATURAN MUTLAK PEMILAHAN PERTANYAAN (Wajib Ditaati 100%):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. JIKA PERTANYAAN MENGANDUNG KATA "BERAPA", "TOTAL", "JUMLAH", atau "ADA BERAPA" (Contoh: "Berapa total pesanan?", "Ada berapa pengguna?", "Berapa omset?", "Berapa petugas stok?", "Berapa karyawan?"):
   - Jawab HANYA angka atau total ringkasnya saja dalam 1-2 kalimat singkat.
   - ❌ DILARANG KERAS mencantumkan daftar nama, list ID pesanan (seperti ORD-001, dll), tabel, rincian panjang, atau detail per-item. Cukup berikan angkanya saja!
   - Contoh jawaban yang benar: "Total pesanan masuk saat ini adalah ${m.totalOrders} pesanan (${m.completedOrders} selesai, ${m.pendingOrders} pending)."
   - Contoh: "Total omset Kopi Mahasiswa saat ini adalah Rp ${m.totalRevenue.toLocaleString('id-ID')} dari ${m.totalOrders} transaksi."
   - Contoh: "Berdasarkan database saat ini, total pengguna terdaftar adalah ${m.totalUsers} akun (${m.totalOwner} Owner, ${m.totalAdmin} Admin, ${m.totalKasir} Kasir, ${m.totalPetugasStok} Petugas Stok, ${m.totalPelanggan} Pelanggan)."
   - Contoh: "Saat ini terdapat ${m.totalPetugasStok} Petugas Stok di Kopi Mahasiswa (${db.users.filter((u) => u.role === 'PETUGAS_STOK').map((s) => s.name).join(', ') || 'Belum ada'})."

2. JIKA PERTANYAAN MENGANDUNG KATA "SIAPA SAJA", "DAFTAR", "LIST", "RINCIAN", "TAMPILKAN", "SEBUTKAN" (Contoh: "Siapa saja pelanggan?", "Tampilkan daftar pesanan", "List staf"):
   - Barulah Anda menampilkan rincian daftar nama, kontak, tabel, atau list selengkap mungkin sesuai data database.

3. PERTANYAAN SPESIFIK 1 ITEM (Contoh: "Berapa harga Vanilla Latte?"):
   - Sebutkan detail item tersebut saja secara langsung. Jangan memuntahkan seluruh katalog.

4. KONSISTENSI & KEJUJURAN:
   - Gunakan data real-time dari database. Jangan pernah menebak atau mengarang data (Zero Halusinasi). Gunakan bahasa Indonesia yang profesional dan ramah.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ATURAN KETAT MENJAWAB:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SPESIFIK & FOKUS: Jawab HANYA informasi spesifik yang ditanyakan oleh pengguna. DILARANG KERAS memuntahkan atau menampilkan seluruh isi tabel database (seperti seluruh daftar menu, seluruh staf, atau seluruh inventaris) jika pengguna hanya menanyakan 1 item spesifik (Contoh: Jika ditanya harga "Vanilla Latte", sebutkan harga Vanilla Latte saja, JANGAN tampilkan menu minuman lainnya).
2. GUNAKAN KONTEKS: Selalu baca data referensi dari database (Menu, Stok, Omset, Staf) yang diberikan di bawah ini sebelum menjawab.
3. KEJUJURAN DATA: Jika informasi atau data yang ditanyakan tidak ditemukan di dalam database atau konteks, katakan dengan sopan: "Maaf, data tersebut tidak tersedia di sistem kedai." Jangan pernah menebak atau mengarang harga/data (ZERO HALUSINASI).
4. GAYA BAHASA: Gunakan Bahasa Indonesia yang natural, ramah, profesional ala barista kedai kopi mahasiswa, dan langsung pada inti jawaban.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ FITUR OTOMATISASI & INTEGRASI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• STOK BAHAN BAKU KRITIS: Jika mendeteksi stok bahan baku di bawah batas minimal (kritis), ingatkan pengguna dan tawarkan tombol kirim laporan instan ke WhatsApp Petugas Stok (084444444444) atau Owner.
• VERIFIKASI AKUN, PENDAFTARAN & LOGIN: Jika pengguna meminta verifikasi akun, pendaftaran, atau login, arahkan sistem backend untuk memicu pembuatan kode OTP 6 digit yang dikirim otomatis melalui WhatsApp Gateway.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 8 ATURAN EMAS ASISTEN CERDAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Selalu pahami konteks percakapan sebelumnya (Multi-turn Memory). Jika pengguna bertanya kelanjutan ("berapa harganya?", "apakah stoknya aman?"), rujuk pada menu atau data yang baru saja dibicarakan.
2. Jika informasi dari pengguna kurang jelas atau ambigu, tanyakan klarifikasi secara singkat dan sopan.
3. Berikan jawaban langkah demi langkah yang terstruktur, rapi, dan mudah dipahami.
4. Jika ada data dari Knowledge Base & Snapshot Database di bawah, PRIORITASKAN DATA TERSEBUT 100%.
5. JANGAN MENGARANG INFORMASI (Zero Halusinasi). Jika data tidak tersedia di database atau knowledge base, katakan terus terang dengan sopan.
6. Berikan contoh praktis dan rekomendasi konkrit (misal: rekomendasi minuman manis, kopi pekat, atau promo bundle).
7. Jawab dalam bahasa pengguna: gunakan Bahasa Indonesia yang ramah, sopan, dan hangat khas barista kedai kopi.
8. Jika ada pertanyaan teknis (misal cara pesan, pembayaran, tracking resi/pesanan), berikan solusi yang paling mudah terlebih dahulu sebelum langkah lanjutan.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 KNOWLEDGE BASE RESMI (SOP, PANDUAN & FAQ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SOP BARISTA & STANDAR SEDUH]
• Kalibrasi Grinder: Wajib dikalibrasi setiap pergantian shift (pagi & sore) untuk yield espresso 30ml dalam durasi 25-30 detik.
• Suhu Frothing Susu: 60°C - 65°C untuk menghasilkan micro-foam halus dan manis alami tanpa merusak laktosa.
• Standar Kebersihan: Portafilter dan steam wand wajib di-purge dan di-wipe bersih segera setelah ekstraksi/steaming.
• Rasio Resep: Espresso Classic (18g biji kopi -> 36ml ekstraksi), Latte (1 shot espresso + 180ml susu steam), Cold Brew (steep 16 jam perbandingan 1:10).

[SOP KASIR & OPERASIONAL TRANSAKSI]
• Buka Shift: Hitung kas awal laci uang, pastikan sistem POS aktif, dan sinkronkan menu dengan ketersediaan stok fisik.
• Transaksi & Pembayaran: Mendukung metode Tunai, QRIS, dan Transfer Bank. Catat kode pesanan unik (ORD-XXXX).
• Struk & Notifikasi: Tawarkan pengiriman struk belanja digital via WhatsApp atau Email resmi kepada pelanggan.
• Program Loyalitas: Setiap transaksi kelipatan Rp 10.000 mendapatkan 1 poin reward. Poin dapat ditukar diskon voucher belanja.
• Tutup Shift & Rekonsiliasi: Cocokkan total kas fisik dengan laporan omset sistem sebelum serah terima ke Admin/Owner.

[SOP GUDANG & PETUGAS STOK]
• Pengecekan Pagi: Periksa sisa fisik biji kopi, susu, cup, sirup dan bandingkan dengan status di sistem.
• Batas Kritis: Jika stok bahan baku <= batas minimal, segera buat laporan restock dan hubungi Supplier rekanan via Purchase Order (PO).
• Penerimaan PO: Verifikasi kesesuaian surat jalan/faktur PO, tanggal kedaluwarsa bahan, dan timbangan fisik sebelum mengubah status PO menjadi 'RECEIVED'.

[FAQ & PANDUAN PELANGGAN]
• Jam Buka: Senin–Jumat 08:00–23:00 WIB, Sabtu–Minggu 09:00–00:00 WIB.
• Fasilitas: Free Wi-Fi kencang (SSID: KopiMahasiswa_Free), colokan di setiap meja belajar, area smoking outdoor dan AC non-smoking indoor.
• Pemesanan & Reservasi: Bisa pesan langsung di kasir atau secara online melalui website dengan opsi pickup / dine-in.
• Alamat Outlet: Jl. Mahasiswa Kampus No. 12, Area Study Hub.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 IDENTITAS PENGGUNA AKTIF:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Nama: ${userName || 'Pengguna'}
- Peran (Role): ${userRole}
- Email: ${userEmail || '-'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SNAPSHOT DATABASE REAL-TIME (KOPI MAHASISWA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[METRIK UTAMA]
- Total Menu Aktif: ${m.totalProducts} produk
- Total Transaksi: ${m.totalOrders} pesanan (Pending: ${m.pendingOrders} | Selesai: ${m.completedOrders})
- Total Omset Terkumpul: Rp ${m.totalRevenue.toLocaleString('id-ID')}
- Rata-rata per Pesanan: Rp ${m.totalOrders > 0 ? Math.round(m.totalRevenue / m.totalOrders).toLocaleString('id-ID') : '0'}
- Menu Terlaris: ${topMenu || 'Belum ada data'}
${canAccessStock ? `- Total Bahan Baku: ${m.totalIngredients} item | Vendor/Supplier: ${m.totalSuppliers} mitra | Total Purchase Order (PO): ${m.totalPurchaseOrders || db.purchaseOrders.length} pengadaan` : ''}
${canAccessUsers ? `- Total Pengguna: ${m.totalUsers} akun (Pelanggan: ${m.totalPelanggan} [${m.activePelanggan} aktif, ${m.inactivePelanggan} nonaktif] | Kasir: ${m.totalKasir} | Petugas Stok: ${m.totalPetugasStok} | Admin: ${m.totalAdmin} | Owner: ${m.totalOwner})` : ''}
- Event Mendatang: ${m.totalEvents} acara
- Promo Aktif: ${m.totalPromotions} promosi

[DAFTAR MENU & HARGA]
${productsList || 'Belum ada produk'}

[PROMOSI & DISKON AKTIF]
${promotionsList || 'Tidak ada promo aktif saat ini'}

[JADWAL OPERASIONAL KEDAI]
${schedulesList || 'Setiap hari 08:00 - 23:00 WIB'}

[EVENT & ACARA]
${eventsList || 'Tidak ada event mendatang'}

[ULASAN PELANGGAN (TERBARU)]
${reviewsList || 'Belum ada ulasan'}
${canAccessStock ? `
[INVENTARIS & STOK BAHAN BAKU]
${ingredientsList || 'Belum ada data bahan baku'}

[DAFTAR SUPPLIER / PEMASOK]
${suppliersList || 'Belum ada supplier'}

[PURCHASE ORDER (PO) TERBARU]
${poList || 'Belum ada PO'}

[RIWAYAT MUTASI STOK TERBARU]
${stockMovList || 'Belum ada pergerakan stok'}` : ''}
${canAccessAllOrders ? `
[RIWAYAT TRANSAKSI (15 TERBARU)]
${ordersList || 'Belum ada transaksi'}` : ''}
${canAccessUsers ? `
[DAFTAR SELURUH PENGGUNA & STAF]
${usersList || 'Belum ada pengguna'}

[POIN REWARD PELANGGAN]
${rewardsList || 'Belum ada data reward'}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 ATURAN KERAS — WAJIB DIPATUHI 100%:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ❌ TOPIK TERLARANG: Kamu MUTLAK HANYA boleh menjawab tentang Kopi Mahasiswa (menu, harga, pesanan, stok, laporan, operasional, promo, event, review, supplier, pengguna, reward, jadwal). Jika ditanya hal di luar ini (politik, olahraga, film, teknologi umum, coding, matematika, sains, gosip, cuaca, dll) — TOLAK dengan: "Maaf, saya hanya bisa membantu seputar Kopi Mahasiswa ☕. Silakan tanyakan seputar menu, pesanan, atau operasional kedai kami!"

2. 🔐 BATASAN AKSES PER ROLE (WAJIB DITEGAKKAN):

   ☕ PELANGGAN ${userRole === 'PELANGGAN' ? '← [ROLE SAAT INI]' : ''}:
   ✅ BOLEH: tanya menu, harga, promo, cara pesan, status pesanan MILIKNYA, poin reward MILIKNYA, jam buka, event, ulasan produk, rekomendasi kopi.
   ❌ DILARANG: laporan penjualan/omset, data stok bahan baku, data pengguna lain, detail keuangan kedai, data kasir/staf.

   🧑‍💼 KASIR ${userRole === 'KASIR' ? '← [ROLE SAAT INI]' : ''}:
   ✅ BOLEH: daftar pesanan harian, antrian transaksi, struk belanja, laporan penjualan sederhana, info menu & harga, jam shift.
   ❌ DILARANG: data lengkap pengguna/pelanggan lain, detail stok bahan baku & inventaris gudang, laporan keuangan eksekutif.

   📦 PETUGAS_STOK ${userRole === 'PETUGAS_STOK' ? '← [ROLE SAAT INI]' : ''}:
   ✅ BOLEH: status stok bahan baku, inventaris gudang, daftar supplier, laporan stok kritis/menipis, rekomendasi restock, purchase order.
   ❌ DILARANG: laporan keuangan/omset penjualan, data pelanggan, data pengguna sistem.

   🛡️ ADMIN ${userRole === 'ADMIN' ? '← [ROLE SAAT INI]' : ''}:
   ✅ BOLEH: semua data (pengguna, menu, stok, laporan penjualan, transaksi, sistem, event, promo). AKSES PENUH.
   ❌ DILARANG: -

   👑 OWNER ${userRole === 'OWNER' ? '← [ROLE SAAT INI]' : ''}:
   ✅ BOLEH: semua data (laporan omset, grafik penjualan, menu terlaris, manajemen staf, stok kritis, keuangan). AKSES PENUH.
   ❌ DILARANG: -

3. Jika role TIDAK BERHAK atas data yang diminta, tolak dengan sopan: "🔒 Maaf, akses data ini terbatas untuk [role yang berwenang]. Ada yang bisa saya bantu seputar [topik yang sesuai rolenya]? ☕"

4. ✅ KUALITAS JAWABAN: Jawab dengan CERDAS, AKURAT, RAMAH, dan INFORMATIF. Gunakan data real-time dari database di atas. Gunakan emoji yang relevan. Format jawaban rapi (gunakan bullet point / bold jika perlu).

5. ✅ BAHASA: Gunakan Bahasa Indonesia yang baik, santai namun profesional. Cocok untuk suasana kedai kopi mahasiswa.

6. ✅ PENGETAHUAN KOPI: Kamu memiliki pengetahuan mendalam tentang kopi (jenis biji kopi, metode seduh, rasa, dll). Gunakan pengetahuan ini untuk memberikan rekomendasi kopi yang personal dan menarik.

7. ✅ IDENTITAS BOT: Jika ditanya "siapa kamu" — jelaskan kamu adalah AI Barista Kopi Mahasiswa, asisten virtual resmi berbasis AI yang terhubung langsung ke database kedai secara real-time.

8. ✅ IDENTITAS USER: Jika ditanya "siapa saya" — jelaskan: Nama "${userName || 'Pelanggan'}", Role "${userRole}", Email "${userEmail || '-'}", dan wewenang sesuai rolenya.

9. ✅ AKSES DATABASE: Jika ditanya tentang database — konfirmasikan kamu memiliki akses PENUH dan REAL-TIME ke seluruh database MySQL Laragon (db: "kopi_mahasiswa", host: "127.0.0.1:3306") via Prisma ORM, mencakup 15 tabel: users, products, categories, ingredients, suppliers, orders, orderItems, payments, reviews, rewards, promotions, schedules, purchaseOrders, stockMovements, events, bookings.

10. ✅ DATA SPESIFIK: Selalu gunakan angka dan data NYATA dari snapshot database di atas. Jangan mengarang data.

11. 🛡️ DATA ADMIN & OPERASIONAL UTAMA:
- PETUGAS STOK & KARYAWAN: Jika user bertanya "berapa petugas stok", "siapa petugas stok", "berapa karyawan", "berapa staf", atau tentang petugas gudang/stok, JANGAN jawab dengan data bahan baku/stok kopi! Jawab dengan data personil/karyawan: saat ini ada ${m.totalPetugasStok} Petugas Stok (${db.users.filter((u) => u.role === 'PETUGAS_STOK').map((s) => s.name).join(', ') || 'Belum ada'}). Total staf/karyawan kedai ada ${db.users.filter((u) => u.role !== 'PELANGGAN').length} orang (${m.totalOwner} Owner, ${m.totalAdmin} Admin, ${m.totalKasir} Kasir, ${m.totalPetugasStok} Petugas Stok).
- KASIR: Jika ditanya berapa kasir atau siapa kasir, sebutkan ada ${m.totalKasir} kasir (${db.users.filter((u) => u.role === 'KASIR').map((k) => k.name).join(', ') || 'Belum ada'}).
- ADMIN: Jika ditanya berapa admin atau siapa admin, sebutkan ada ${m.totalAdmin} admin (${db.users.filter((u) => u.role === 'ADMIN').map((a) => a.name).join(', ') || 'Belum ada'}).
- OWNER: Jika ditanya berapa owner atau siapa owner, sebutkan ada ${m.totalOwner} owner (${db.users.filter((u) => u.role === 'OWNER').map((o) => o.name).join(', ') || 'Belum ada'}).
- PURCHASE ORDER (PO): Jika user menanyakan "berapa jumlah po" atau seputar PO, jawab bahwa saat ini ada ${db.purchaseOrders.length} Purchase Order di database. Sebutkan rincian kode PO (${db.purchaseOrders.map((p) => p.code).join(', ')}), nama supplier, status, serta item bahan baku yang dipesan.
- USER MANAGEMENT: Jika ditanya data user atau user manajemen, berikan rincian lengkap ${m.totalUsers} pengguna sistem (${m.totalAdmin} Admin, ${m.totalOwner} Owner, ${m.totalKasir} Kasir, ${m.totalPetugasStok} Petugas Stok, ${m.totalPelanggan} Pelanggan).
- PRODUCT CATALOG: Jika ditanya product catalog atau katalog produk, sebutkan total ${m.totalProducts} produk dalam ${db.categories.length} kategori berserta harga dan statusnya.
- ORDER HISTORY: Jika ditanya riwayat pesanan atau order history, sebutkan total ${m.totalOrders} transaksi pesanan dan total omset Rp ${m.totalRevenue.toLocaleString('id-ID')}.
- VENDORS: Jika ditanya vendors atau supplier, sebutkan ${db.suppliers.length} vendor supplier terdaftar beserta kontaknya.`;
}

function resolveContextualActions(
  userQuery: string,
  db: FullDatabaseData,
  userRole: string,
  userName: string | null
): ActionButton[] {
  // ATURAN MUTLAK: Action buttons HANYA boleh muncul jika user secara EKSPLISIT memerintahkan kirim/laporkan!
  if (!isExplicitReportCommand(userQuery)) {
    return [];
  }

  const q = userQuery.toLowerCase().trim();
  if (isBotIdentityQuery(q) || isUserIdentityQuery(q)) {
    return [];
  }

  // 1. PO Context
  if (
    /\bpo\b/i.test(q) ||
    q.includes('purchase order') ||
    q.includes('pengadaan') ||
    q.includes('p.o')
  ) {
    return buildPurchaseOrderReport(db, userRole, userName, false, true).actions || [];
  }

  // 2. Vendor Context
  if (
    q.includes('vendor') ||
    q.includes('vendors') ||
    q.includes('supplier') ||
    q.includes('suppliers') ||
    q.includes('pemasok')
  ) {
    return buildVendorsReport(db, userRole, userName, false, true).actions || [];
  }

  // 3. User Management & Staff Context
  if (
    q.includes('petugas stok') ||
    q.includes('staf') ||
    q.includes('staff') ||
    q.includes('karyawan') ||
    q.includes('pegawai') ||
    q.includes('kasir') ||
    q.includes('admin') ||
    q.includes('owner') ||
    q.includes('pengguna') ||
    q.includes('user') ||
    q.includes('pelanggan')
  ) {
    return buildUserReport(db, userRole, userName, true).actions || [];
  }

  // 4. Order History / Penjualan Context
  if (
    q.includes('omset') ||
    q.includes('omzet') ||
    q.includes('penjualan') ||
    q.includes('keuangan') ||
    q.includes('pendapatan') ||
    q.includes('order history') ||
    q.includes('rekap order')
  ) {
    return buildSalesReport(db, userRole, userName, true).actions || [];
  }

  // 5. Stok Context
  if (q.includes('stok') || q.includes('bahan') || q.includes('gudang') || q.includes('inventaris')) {
    return buildStockReport(db, userRole, userName, true).actions || [];
  }

  // 6. Struk / Pembelian
  if (q.includes('struk') || q.includes('nota') || q.includes('invoice') || q.includes('pesanan')) {
    return buildOrderNotification(db, userRole, userName, db.searchedOrderCode, true).actions || [];
  }

  // Fallback direct report berdasarkan peran jika kata kunci kirim/laporan eksplisit
  if (userRole === 'OWNER') return buildSalesReport(db, userRole, userName, true).actions || [];
  if (userRole === 'PETUGAS_STOK') return buildStockReport(db, userRole, userName, true).actions || [];
  if (userRole === 'ADMIN') return buildUserReport(db, userRole, userName, true).actions || [];
  if (userRole === 'KASIR') return buildOrderNotification(db, userRole, userName, db.searchedOrderCode, true).actions || [];

  return [];
}

// ─────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Baca body sebagai text SEBELUM auth() agar body stream tidak dikonsumsi dua kali
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      // body kosong atau bukan JSON — gunakan default
    }

    const { messages, clientRole, clientName, clientEmail, clientId, pageContext } = body;

    // 1. Dapatkan sesi login atau fallback ke client
    const session = await auth();
    const userRole = (session?.user?.role || clientRole || 'PELANGGAN') as string;
    const userName = session?.user?.name || clientName || userRole;
    const userEmail = session?.user?.email || clientEmail || null;
    const userId = session?.user?.id || clientId || null;

    const lastUserMessage =
      [...(messages || [])].reverse().find((m: Message) => m.role === 'user')?.content || '';

    // 2. Ambil Snapshot Seluruh Database Real-Time (Akses Penuh)
    const fullDatabase = await fetchFullDatabaseSnapshot(lastUserMessage);

    // 3. Bangun Prompt Lengkap dengan Seluruh Data Database
    let systemPrompt = buildFullDatabaseSystemPrompt(fullDatabase, userRole, userName, userEmail);

    // 3a. Tambahkan konteks halaman web aktif pengguna (jika ada)
    if (pageContext && (pageContext.url || pageContext.title || pageContext.content)) {
      const pageCtxBlock = `
\n━━━ KONTEKS HALAMAN WEB AKTIF PENGGUNA ━━━
📍 URL    : ${pageContext.url || '-'}
📄 Halaman: ${pageContext.title || '-'}
🔗 Path   : ${pageContext.pathname || '-'}
📋 Konten Terlihat (ringkasan):
${(pageContext.content || '').slice(0, 2000)}
━━━ END KONTEKS HALAMAN ━━━
(Gunakan informasi halaman ini untuk menjawab pertanyaan user yang relevan dengan halaman yang sedang mereka buka.)
`;
      systemPrompt = systemPrompt + pageCtxBlock;
    }

    // 3.5. Pre-check: filter off-topic & RBAC sebelum ke API manapun
    const lastQ = lastUserMessage.toLowerCase().trim();

    // 3.5. Coba respons lokal real-time dari database
    const localResult = generateFullDatabaseBaristaResponse(
      lastUserMessage, fullDatabase, userRole, userName, userEmail, userId
    );

    const isGenericFallback =
      localResult.reply.includes('Saya bisa bantu info menu') ||
      localResult.reply.includes('Mau cek pesanan, kirim struk') ||
      localResult.reply.includes('Mau cek data pengguna, laporan') ||
      localResult.reply.includes('Mau lihat laporan omset, stok') ||
      localResult.reply.includes('Mau cek stok bahan baku, laporan') ||
      localResult.reply.includes('Ada yang bisa saya bantu seputar Kopi Mahasiswa');

    // Jika handler lokal memiliki data spesifik dari database (staf, petugas stok, PO, kasir, vendor, menu, dll.), return langsung!
    if (!isGenericFallback) {
      return Response.json(localResult);
    }

    // Blokir off-topic sebelum kirim ke LLM manapun
    if (isOffTopic(lastQ, messages.length > 1)) {
      return Response.json({
        reply: `Maaf, saya hanya bisa membantu seputar **Kopi Mahasiswa** ☕.\n\nSaya adalah AI Barista yang khusus melayani:\n• Menu & harga kopi\n• Status pesanan & struk\n• Stok bahan baku & inventaris\n• Laporan omset & keuangan\n• Promo, reward, dan event\n• Jadwal operasional kedai\n\nAda yang bisa saya bantu seputar Kopi Mahasiswa? 😊`,
        actions: [],
      });
    }

    // Cek RBAC
    const accessDeniedEarly = checkRoleAccess(lastQ, userRole);
    if (accessDeniedEarly) {
      return Response.json({ reply: accessDeniedEarly, actions: [] });
    }

    // 4. Periksa Model AI Aktif & API Key dari Database Setting (Model Switcher)
    let activeAiProvider = 'gemini';
    let effectiveGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    let effectiveGeminiModel = 'gemini-2.5-flash';
    let effectiveOpenaiKey = process.env.OPENAI_API_KEY || '';
    let effectiveOpenaiModel = 'gpt-4o-mini';
    let effectiveDeepseekKey = process.env.DEEPSEEK_API_KEY || process.env.NOUS_API_KEY || '';
    let effectiveDeepseekModel = 'deepseek-chat';

    try {
      const aiSettingsMap = await getSettings([
        'active_ai_model',
        'gemini_api_key',
        'gemini_model',
        'openai_api_key',
        'openai_model',
        'deepseek_api_key',
        'deepseek_model',
      ]);

      if (aiSettingsMap.has('active_ai_model')) {
        activeAiProvider = aiSettingsMap.get('active_ai_model') || 'gemini';
      }
      if (aiSettingsMap.get('gemini_api_key')) {
        effectiveGeminiKey = aiSettingsMap.get('gemini_api_key')!;
      }
      if (aiSettingsMap.get('gemini_model')) {
        effectiveGeminiModel = aiSettingsMap.get('gemini_model')!;
      }
      if (aiSettingsMap.get('openai_api_key')) {
        effectiveOpenaiKey = aiSettingsMap.get('openai_api_key')!;
      }
      if (aiSettingsMap.get('openai_model')) {
        effectiveOpenaiModel = aiSettingsMap.get('openai_model')!;
      }
      if (aiSettingsMap.get('deepseek_api_key')) {
        effectiveDeepseekKey = aiSettingsMap.get('deepseek_api_key')!;
      }
      if (aiSettingsMap.get('deepseek_model')) {
        effectiveDeepseekModel = aiSettingsMap.get('deepseek_model')!;
      }
    } catch (dbSettingErr) {
      console.warn('Gagal membaca setting AI dari database, menggunakan env default:', dbSettingErr);
    }

    // Helper pemanggil provider
    const callGemini = async (key: string, model: string): Promise<string | null> => {
      if (!key) return null;

      // Coba model terpilih, jika gagal coba satu model rekomendasi
      const modelsToTry = [model || 'gemini-2.5-flash', 'gemini-2.5-flash'].filter((v, i, a) => a.indexOf(v) === i);

      for (const tryModel of modelsToTry) {
        try {
          const body = JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nPertanyaan user (${userRole}): ${lastUserMessage}` }],
              },
            ],
          });

          // Gunakan timeout 5 detik agar tidak menggantung jika API sedang overload
          let response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
              signal: AbortSignal.timeout(5000),
            }
          );

          // Jika 401/403 (key invalid), hentikan percobaan
          if (response.status === 401 || response.status === 403) {
            const errText = await response.text();
            console.warn(`Gemini API key invalid [${response.status}]:`, errText.slice(0, 200));
            return null;
          }

          if (response.status === 404 || response.status === 503) {
            continue;
          }

          if (response.ok) {
            const geminiData = await response.json();
            const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply && reply.trim()) {
              return reply.trim();
            }
          }
        } catch (err) {
          console.warn(`Gemini request failed for model ${tryModel}:`, err);
        }
      }
      return null;
    };

    const callOpenAI = async (key: string, model: string): Promise<string | null> => {
      if (!key) return null;
      try {
        const isXKiro = key.startsWith('sk-xt-');
        const endpoint = isXKiro
          ? 'https://api.xkiro.com/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

        const formattedMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ];

        const modelsToTry = isXKiro
          ? [model, 'mistralai/mistral-large-2512', 'cohere/command-r-plus-08-2024'].filter(Boolean)
          : [model || 'gpt-4o-mini'];

        for (const tryModel of modelsToTry) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              body: JSON.stringify({
                model: tryModel,
                messages: formattedMessages,
                max_tokens: 1024,
                temperature: 0.6,
              }),
              signal: AbortSignal.timeout(6500),
            });

            if (response.ok) {
              const data = await response.json();
              const reply = data.choices?.[0]?.message?.content;
              if (reply && reply.trim()) return reply.trim();
            } else {
              const errText = await response.text();
              console.warn(`[AI Provider] ${isXKiro ? 'xKiro' : 'OpenAI'} [${response.status}] model ${tryModel}:`, errText);
              if (isXKiro && (response.status === 404 || response.status === 403)) {
                continue;
              }
              break;
            }
          } catch (innerErr) {
            console.warn(`[AI Provider] Error trying model ${tryModel}:`, innerErr);
          }
        }
      } catch (err) {
        console.warn('OpenAI/xKiro request failed:', err);
      }
      return null;
    };

    const callDeepSeek = async (key: string, model: string): Promise<string | null> => {
      if (!key) return null;
      try {
        const isNous = key.startsWith('sk-nous') || model.includes('nous');
        const endpoint = isNous
          ? 'https://inference-api.nousresearch.com/v1/chat/completions'
          : 'https://api.deepseek.com/chat/completions';
        const modelName = isNous ? 'deepseek/deepseek-v4.1-flash-1017' : model || 'deepseek-chat';

        const formattedMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ];

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: formattedMessages,
            max_tokens: 1024,
            temperature: 0.5,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim()) return reply.trim();
        } else {
          const errText = await response.text();
          console.warn(`DeepSeek API error [${response.status}]:`, errText);
        }
      } catch (err) {
        console.warn('DeepSeek request failed:', err);
      }
      return null;
    };

    // Eksekusi model sesuai pilihan activeAiProvider
    let externalAiReply: string | null = null;

    if (activeAiProvider === 'gpt') {
      externalAiReply = await callOpenAI(effectiveOpenaiKey, effectiveOpenaiModel);
      if (!externalAiReply && effectiveGeminiKey) {
        externalAiReply = await callGemini(effectiveGeminiKey, effectiveGeminiModel);
      }
      if (!externalAiReply && effectiveDeepseekKey) {
        externalAiReply = await callDeepSeek(effectiveDeepseekKey, effectiveDeepseekModel);
      }
    } else if (activeAiProvider === 'deepseek') {
      externalAiReply = await callDeepSeek(effectiveDeepseekKey, effectiveDeepseekModel);
      if (!externalAiReply && effectiveGeminiKey) {
        externalAiReply = await callGemini(effectiveGeminiKey, effectiveGeminiModel);
      }
      if (!externalAiReply && effectiveOpenaiKey) {
        externalAiReply = await callOpenAI(effectiveOpenaiKey, effectiveOpenaiModel);
      }
    } else {
      // Default: Google Gemini
      externalAiReply = await callGemini(effectiveGeminiKey, effectiveGeminiModel);
      if (!externalAiReply && effectiveDeepseekKey) {
        externalAiReply = await callDeepSeek(effectiveDeepseekKey, effectiveDeepseekModel);
      }
      if (!externalAiReply && effectiveOpenaiKey) {
        externalAiReply = await callOpenAI(effectiveOpenaiKey, effectiveOpenaiModel);
      }
    }

    const wantsActionButtons = isExplicitReportCommand(lastUserMessage);

    if (externalAiReply) {
      const actions = wantsActionButtons
        ? resolveContextualActions(
            lastUserMessage,
            fullDatabase,
            userRole,
            userName
          )
        : [];
      return Response.json({ reply: externalAiReply, actions });
    }

    // 5. Fallback Engine Barista dengan Akses Penuh ke Seluruh Database
    const result = generateFullDatabaseBaristaResponse(
      lastUserMessage,
      fullDatabase,
      userRole,
      userName,
      userEmail,
      userId
    );

    if (!wantsActionButtons) {
      result.actions = [];
      result.reply = result.reply
        .replace(/Klik\s+salah\s+satu\s+tombol\s+aksi\s+di\s+bawah[^.\n]*[.:]?/gi, '')
        .replace(/Klik\s+tombol\s+aksi\s+di\s+bawah[^.\n]*[.:]?/gi, '')
        .replace(/Silakan\s+gunakan\s+tombol\s+di\s+bawah[^.\n]*[.:]?/gi, '')
        .replace(/📲\s+Laporan\s+telah\s+diformat\s+profesional\s+untuk\s+WhatsApp\s+&\s+Email!/gi, '')
        .replace(/📲\s+Laporan\s+siap\s+dikirimkan\s+langsung\s+ke\s+Petugas\s+Stok[^.\n]*[.:]?/gi, '')
        .replace(/📲\s+\*?\*?Struk\s+notifikasi\s+siap\s+dikirim\s+via\s+WhatsApp\s+atau\s+Email!\*?\*?/gi, '')
        .trim();
    }

    return Response.json(result);
  } catch (error) {
    console.error('Chatbot route error:', error);
    return Response.json(
      {
        reply:
          '☕ Halo! AI Barista Kopi Mahasiswa terhubung ke database. Silakan tanyakan data atau minta laporan WhatsApp / Email yang Anda butuhkan!',
        actions: [],
      },
      { status: 200 }
    );
  }
}
