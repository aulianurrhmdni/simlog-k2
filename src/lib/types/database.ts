// ============================================================
// DATABASE TYPES — Sistem Manajemen Inventory PT CAHAYA INDOMIE
// ============================================================

export type Produk = {
  id_produk: string
  nama_produk: string
  kategori: string
  satuan: string
  stok_minimum: number
  masa_kedaluwarsa: number | null
  created_at: string
}

export type Stok = {
  id_stok: string
  id_produk: string
  jumlah_stok: number
  lokasi_rak: string | null
  status_stok: string
  tanggal_update: string
  produk?: Produk
}

export type ParameterStok = {
  id_param: string
  id_produk: string
  batas_minimum: number
  hari_peringatan_expired: number
  aktif: boolean
}

export type Supplier = {
  id_supplier: string
  nama_supplier: string
  kontak: string | null
  alamat: string | null
}

export type BarangMasuk = {
  id_masuk: string
  id_produk: string
  id_supplier: string
  tanggal_masuk: string
  jumlah_masuk: number
  batch: string | null
  tanggal_expired: string | null
  status_penerimaan: string
  catatan: string | null
  dicatat_oleh: string
  approved_by: string | null
  produk?: Produk
  supplier?: Supplier
}

export type ReturBarang = {
  id_retur: string
  id_produk: string
  id_barang_keluar: string | null
  jenis_retur: 'DARI_PELANGGAN' | 'KE_SUPPLIER'
  tanggal_retur: string
  jumlah_retur: number
  alasan_retur: string | null
  status_retur: string
  dicatat_oleh: string | null
  approved_by_ic: string | null
  approved_by_mg: string | null
  catatan_ic: string | null
  catatan_mg: string | null
  produk?: Produk
  barang_keluar?: BarangKeluar
}

export type Pelanggan = {
  id_pelanggan: string
  nama_pelanggan: string
  alamat: string | null
  kontak: string | null
}

export type PermintaanBarang = {
  id_permintaan: string
  id_pelanggan: string
  tanggal_permintaan: string
  jumlah_permintaan: number
  status_permintaan: string
  pelanggan?: Pelanggan
}

export type BarangKeluar = {
  id_keluar: string
  id_produk: string
  id_permintaan: string | null
  tanggal_keluar: string
  jumlah_keluar: number
  tujuan: string | null
  status_pengeluaran: string
  catatan: string | null
  dicatat_oleh: string | null
  approved_by: string | null
  produk?: Produk
  permintaan_barang?: PermintaanBarang
}

export type MonitoringStok = {
  id_monitor: string
  id_produk: string
  waktu_monitor: string
  stok_aktual: number
  stok_minimum: number
  status: string
  produk?: Produk
}

export type AlertStok = {
  id_alert: string
  id_produk: string
  jenis_alert: string
  pesan: string | null
  waktu_alert: string
  status: string
  produk?: Produk
}

export type LaporanStok = {
  id_laporan: string
  jenis_laporan: string
  tanggal_laporan: string
  periode_awal: string | null
  periode_akhir: string | null
  dibuat_oleh: string
}

// Role types — 4 roles sesuai revisi.md
export type UserRole =
  | 'superadmin'
  | 'inventory_control'
  | 'warehouse_staff'
  | 'manager_gudang'

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  inventory_control: 'Inventory Control Staf',
  warehouse_staff: 'Staf Gudang',
  manager_gudang: 'Manajer Gudang',
}

// Status enums
export const STATUS_PENERIMAAN = ['PENDING', 'DITERIMA', 'DITOLAK'] as const
export const STATUS_PENGELUARAN = ['PENDING', 'DISETUJUI', 'DITOLAK', 'SELESAI'] as const
export const STATUS_RETUR = ['PENDING', 'APPROVED_IC', 'APPROVED_MG', 'REJECTED'] as const
export const JENIS_RETUR = ['DARI_PELANGGAN', 'KE_SUPPLIER'] as const
export const STATUS_PERMINTAAN = ['PENDING', 'DISETUJUI', 'DITOLAK'] as const
export const STATUS_ALERT = ['AKTIF', 'SELESAI', 'DIABAIKAN'] as const
export const JENIS_ALERT = ['STOK_MINIMUM', 'EXPIRED', 'MENDEKATI_EXPIRED'] as const
export const JENIS_LAPORAN = ['STOK', 'PERGERAKAN', 'EXPIRED', 'REORDER'] as const

// Produk khusus Indomie — satuan selalu "dus"
export const KATEGORI_PRODUK = ['Goreng', 'Kuah'] as const
export const SATUAN_PRODUK = ['dus'] as const
