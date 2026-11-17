export enum Role {
  ADMIN = "ADMIN",
  OWNER = "OWNER",
  KASIR = "KASIR",
  PELANGGAN = "PELANGGAN",
  PETUGAS_STOK = "PETUGAS_STOK"
}

/**
 * Label display untuk tiap role
 */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:        "Admin Kopi",
  OWNER:        "Owner Kopi",
  KASIR:        "Kasir Kopi",
  PELANGGAN:    "Pelanggan",
  PETUGAS_STOK: "Petugas Stok",
};

/**
 * Warna badge untuk tiap role
 */
export const ROLE_COLORS: Record<Role, string> = {
  ADMIN:        "bg-gray-800 text-white border-gray-900",
  OWNER:        "bg-gray-700 text-white border-gray-800",
  KASIR:        "bg-gray-200 text-gray-800 border-gray-300",
  PELANGGAN:    "bg-white text-gray-800 border-gray-300",
  PETUGAS_STOK: "bg-gray-100 text-gray-700 border-gray-200",
};

/**
 * Path dashboard berdasarkan role
 */
export const ROLE_DASHBOARD_PATHS: Record<Role, string> = {
  ADMIN:        "/dashboard/admin",
  OWNER:        "/dashboard/owner",
  KASIR:        "/dashboard/kasir",
  PELANGGAN:    "/dashboard/pelanggan",
  PETUGAS_STOK: "/dashboard/stok",
};

/**
 * Route yang dapat diakses setiap role
 */
export const ROLE_ACCESSIBLE_PATHS: Record<Role, string[]> = {
  ADMIN:        ["/dashboard/admin"],
  OWNER:        ["/dashboard/owner"],
  KASIR:        ["/dashboard/kasir"],
  PELANGGAN:    ["/dashboard/pelanggan"],
  PETUGAS_STOK: ["/dashboard/stok"],
};
