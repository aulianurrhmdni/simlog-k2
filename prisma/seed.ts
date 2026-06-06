// ============================================================
// SEED — Sistem Manajemen Inventory PT CAHAYA INDOMIE
// ============================================================
// CATATAN ID:
// Semua ID dibuat mudah dibaca & sesuai object-nya, contoh:
//   produk1, produk2 ... | supplier1 | pelanggan1 | stok1 |
//   user1 | barangmasuk1 | barangkeluar1 | permintaan1 |
//   retur1 | alert1 | monitoring1 | parameter1
// (Schema tetap @default(uuid()); ID di sini hanya di-set eksplisit)
// ============================================================

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${DB_PATH}` })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🧹 Membersihkan database lama...')
  await prisma.alertStok.deleteMany()
  await prisma.monitoringStok.deleteMany()
  await prisma.laporanStok.deleteMany()
  await prisma.returBarang.deleteMany()
  await prisma.barangKeluar.deleteMany()
  await prisma.barangMasuk.deleteMany()
  await prisma.permintaanBarang.deleteMany()
  await prisma.stok.deleteMany()
  await prisma.parameterStok.deleteMany()
  await prisma.produk.deleteMany()
  await prisma.varianRasa.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.pelanggan.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Pembersihan database selesai.')

  console.log('🌱 Mulai seeding database PT CAHAYA INDOMIE...')

  // ============================================================
  // USERS — 4 role sesuai revisi.md  | ID: user1..user4
  // ============================================================
  const users = [
    { id: 'user1', email: 'admin@cahayaindomie.com',     name: 'Admin',        role: 'admin',        password: 'admin123' },
    { id: 'user2', email: 'inventory@cahayaindomie.com', name: 'Budi Santoso', role: 'inventory_control', password: 'inventory123' },
    { id: 'user3', email: 'gudang@cahayaindomie.com',    name: 'Siti Rahayu',  role: 'warehouse_staff',   password: 'gudang123' },
    { id: 'user4', email: 'manager@cahayaindomie.com',   name: 'Ahmad Fauzi',  role: 'manager_gudang',    password: 'manager123' },
  ]

  const createdUsers: Record<string, string> = {}

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: { id: u.id, email: u.email, name: u.name, role: u.role, password: hashed },
    })
    createdUsers[u.role] = user.id
    console.log(`  ✅ User: ${u.email} (${u.role}) → ${user.id}`)
  }

  // ============================================================
  // SUPPLIER — hanya Indofood (produsen Indomie) | ID: supplier1..
  // ============================================================
  const suppliers = [
    { id: 'supplier1', namaSupplier: 'PT. Indofood CBP Sukses Makmur', kontak: '021-7263625',   alamat: 'Jakarta Barat, DKI Jakarta' },
    { id: 'supplier2', namaSupplier: 'PT. Indofood Sukses Makmur Tbk', kontak: '021-5795-8822', alamat: 'Sudirman Plaza, Jakarta' },
  ]

  const createdSuppliers: string[] = []
  for (const s of suppliers) {
    const sup = await prisma.supplier.create({ data: s })
    createdSuppliers.push(sup.id)
    console.log(`  ✅ Supplier: ${s.namaSupplier} → ${sup.id}`)
  }

  // ============================================================
  // PRODUK — khusus Indomie | ID: produk1..produk10
  // ============================================================
  const produkList = [
    { id: 'produk1',  namaProduk: 'Indomie Goreng Original',   kategori: 'Goreng', satuan: 'dus', stokMinimum: 50, masaKedaluwarsa: 365 },
    { id: 'produk2',  namaProduk: 'Indomie Goreng Pedas',      kategori: 'Goreng', satuan: 'dus', stokMinimum: 40, masaKedaluwarsa: 365 },
    { id: 'produk3',  namaProduk: 'Indomie Goreng Rendang',    kategori: 'Goreng', satuan: 'dus', stokMinimum: 35, masaKedaluwarsa: 365 },
    { id: 'produk4',  namaProduk: 'Indomie Goreng Cakalang',   kategori: 'Goreng', satuan: 'dus', stokMinimum: 30, masaKedaluwarsa: 365 },
    { id: 'produk5',  namaProduk: 'Indomie Goreng Jumbo',      kategori: 'Goreng', satuan: 'dus', stokMinimum: 25, masaKedaluwarsa: 365 },
    { id: 'produk6',  namaProduk: 'Indomie Kuah Ayam Bawang',  kategori: 'Kuah',   satuan: 'dus', stokMinimum: 50, masaKedaluwarsa: 365 },
    { id: 'produk7',  namaProduk: 'Indomie Kuah Soto Mie',     kategori: 'Kuah',   satuan: 'dus', stokMinimum: 40, masaKedaluwarsa: 365 },
    { id: 'produk8',  namaProduk: 'Indomie Kuah Kaldu Ayam',   kategori: 'Kuah',   satuan: 'dus', stokMinimum: 35, masaKedaluwarsa: 365 },
    { id: 'produk9',  namaProduk: 'Indomie Kuah Coto Makassar',kategori: 'Kuah',   satuan: 'dus', stokMinimum: 20, masaKedaluwarsa: 365 },
    { id: 'produk10', namaProduk: 'Indomie Kuah Aceh',         kategori: 'Kuah',   satuan: 'dus', stokMinimum: 20, masaKedaluwarsa: 365 },
  ]

  const createdProduk: string[] = []
  for (const p of produkList) {
    const prod = await prisma.produk.create({ data: p })
    createdProduk.push(prod.id)
    console.log(`  ✅ Produk: ${p.namaProduk} → ${prod.id}`)
  }

  // ============================================================
  // VARIAN RASA — katalog rasa Indomie | ID: varian1..varian10
  // Diturunkan dari produkList (nama tanpa prefix "Indomie ")
  // ============================================================
  const tingkatPedasMap: Record<string, number> = {
    'Indomie Goreng Pedas': 4,
    'Indomie Goreng Cakalang': 2,
    'Indomie Kuah Soto Mie': 1,
    'Indomie Kuah Coto Makassar': 2,
    'Indomie Kuah Aceh': 3,
  }

  for (let i = 0; i < produkList.length; i++) {
    const p = produkList[i]
    const namaVarian = p.namaProduk.replace(/^Indomie\s+/, '')
    const varian = await prisma.varianRasa.create({
      data: {
        id: `varian${i + 1}`,
        namaVarian,
        kategori: p.kategori,
        tingkatPedas: tingkatPedasMap[p.namaProduk] ?? 0,
        deskripsi: `Varian rasa ${namaVarian}`,
        aktif: true,
      },
    })
    // Tautkan produk ke varian rasa-nya
    await prisma.produk.update({
      where: { id: createdProduk[i] },
      data: { varianRasaId: varian.id },
    })
  }
  console.log('  ✅ VarianRasa dibuat & ditautkan ke produk')

  // ============================================================
  // STOK AWAL & PARAMETER STOK | ID: stok1.. & parameter1..
  // ============================================================
  const stokAwal = [120, 85, 15, 90, 10, 200, 45, 70, 22, 18]
  const lokasiRak = ['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'B-01', 'B-02', 'B-03', 'B-04', 'B-05']

  for (let i = 0; i < createdProduk.length; i++) {
    const jumlah = stokAwal[i]
    const min = produkList[i].stokMinimum
    const status = jumlah <= min ? (jumlah <= min / 2 ? 'KRITIS' : 'RENDAH') : 'NORMAL'

    await prisma.stok.create({
      data: { id: `stok${i + 1}`, produkId: createdProduk[i], jumlahStok: jumlah, lokasiRak: lokasiRak[i], statusStok: status },
    })
    await prisma.parameterStok.create({
      data: { id: `parameter${i + 1}`, produkId: createdProduk[i], batasMinimum: min, hariPeringatanExpired: 30, aktif: true },
    })
  }
  console.log('  ✅ Stok & ParameterStok awal berhasil dibuat')

  // ============================================================
  // PELANGGAN | ID: pelanggan1..pelanggan5
  // ============================================================
  const pelangganList = [
    { id: 'pelanggan1', namaPelanggan: 'Toko Sembako Makmur',  alamat: 'Jl. Pasar Raya No. 12, Jakarta',  kontak: '0812-1111-2222' },
    { id: 'pelanggan2', namaPelanggan: 'Minimarket Sejahtera', alamat: 'Jl. Merdeka No. 45, Bandung',     kontak: '0813-3333-4444' },
    { id: 'pelanggan3', namaPelanggan: 'Grosir Nusantara',     alamat: 'Jl. Pemuda No. 8, Surabaya',      kontak: '0814-5555-6666' },
    { id: 'pelanggan4', namaPelanggan: 'Warung Bu Sari',       alamat: 'Jl. Kenanga No. 3, Yogyakarta',   kontak: '0815-7777-8888' },
    { id: 'pelanggan5', namaPelanggan: 'PT. Distribusi Lokal', alamat: 'Jl. Industri No. 99, Tangerang',  kontak: '021-5566778' },
  ]

  const createdPelanggan: string[] = []
  for (const pl of pelangganList) {
    const p = await prisma.pelanggan.create({ data: pl })
    createdPelanggan.push(p.id)
    console.log(`  ✅ Pelanggan: ${pl.namaPelanggan} → ${p.id}`)
  }

  // ============================================================
  // BARANG MASUK (sample) | ID: barangmasuk1..barangmasuk5
  // ============================================================
  const gudangId = createdUsers['warehouse_staff']
  const managerId = createdUsers['manager_gudang']
  const icId = createdUsers['inventory_control']

  const sampleMasuk = [
    { id: 'barangmasuk1', produkId: createdProduk[0], supplierId: createdSuppliers[0], jumlahMasuk: 100, batch: 'B-2026-001', statusPenerimaan: 'DITERIMA', tanggalMasuk: new Date('2026-05-01'), approvedById: managerId, kesesuaianFisik: 'SESUAI',        catatanKesesuaian: 'Jumlah & batch sesuai surat jalan, kondisi dus baik.', tanggalExpired: new Date('2027-05-01') },
    { id: 'barangmasuk2', produkId: createdProduk[1], supplierId: createdSuppliers[0], jumlahMasuk: 80,  batch: 'B-2026-002', statusPenerimaan: 'DITERIMA', tanggalMasuk: new Date('2026-05-05'), approvedById: icId,      kesesuaianFisik: 'SESUAI',        catatanKesesuaian: 'Diverifikasi Inventory Control, dokumen lengkap.',     tanggalExpired: new Date('2027-05-05') },
    { id: 'barangmasuk3', produkId: createdProduk[5], supplierId: createdSuppliers[1], jumlahMasuk: 200, batch: 'B-2026-003', statusPenerimaan: 'DITERIMA', tanggalMasuk: new Date('2026-05-10'), approvedById: managerId, kesesuaianFisik: 'TIDAK_SESUAI',  catatanKesesuaian: 'Selisih 2 dus dari surat jalan, perlu konfirmasi supplier.', tanggalExpired: new Date('2026-01-15') },
    { id: 'barangmasuk4', produkId: createdProduk[6], supplierId: createdSuppliers[1], jumlahMasuk: 50,  batch: 'B-2026-004', statusPenerimaan: 'PENDING',  tanggalMasuk: new Date('2026-05-20'), approvedById: null,      kesesuaianFisik: 'BELUM_DICEK',   catatanKesesuaian: null,                                                  tanggalExpired: new Date('2027-05-20') },
    { id: 'barangmasuk5', produkId: createdProduk[2], supplierId: createdSuppliers[0], jumlahMasuk: 30,  batch: 'B-2026-005', statusPenerimaan: 'PENDING',  tanggalMasuk: new Date('2026-05-22'), approvedById: null,      kesesuaianFisik: 'BELUM_DICEK',   catatanKesesuaian: null,                                                  tanggalExpired: new Date('2026-03-01') },
  ]

  for (const bm of sampleMasuk) {
    await prisma.barangMasuk.create({
      data: { ...bm, dicatatOlehId: gudangId },
    })
  }
  console.log('  ✅ Sample BarangMasuk dibuat')

  // ============================================================
  // BARANG KELUAR (sample) | ID: permintaan1.. & barangkeluar1..
  // ============================================================
  const permintaan1 = await prisma.permintaanBarang.create({
    data: {
      id: 'permintaan1',
      pelangganId: createdPelanggan[0],
      produkId: createdProduk[0],
      jumlahPermintaan: 50,
      statusPermintaan: 'DISETUJUI',
      tanggalPermintaan: new Date('2026-05-15'),
    }
  })

  const barangKeluar1 = await prisma.barangKeluar.create({
    data: {
      id: 'barangkeluar1',
      produkId: createdProduk[0],
      permintaanId: permintaan1.id,
      jumlahKeluar: 50,
      tujuan: 'Toko Sembako Makmur',
      statusPengeluaran: 'DISETUJUI',
      dicatatOlehId: gudangId,
      approvedById: managerId,
      tanggalKeluar: new Date('2026-05-16'),
    }
  })

  const permintaan2 = await prisma.permintaanBarang.create({
    data: {
      id: 'permintaan2',
      pelangganId: createdPelanggan[1],
      produkId: createdProduk[5],
      jumlahPermintaan: 30,
      statusPermintaan: 'PENDING',
      tanggalPermintaan: new Date('2026-05-20'),
    }
  })

  await prisma.barangKeluar.create({
    data: {
      id: 'barangkeluar2',
      produkId: createdProduk[5],
      permintaanId: permintaan2.id,
      jumlahKeluar: 30,
      tujuan: 'Minimarket Sejahtera',
      statusPengeluaran: 'PENDING',
      dicatatOlehId: gudangId,
      tanggalKeluar: new Date('2026-05-21'),
    }
  })
  console.log('  ✅ Permintaan & BarangKeluar dibuat')

  // ============================================================
  // RETUR BARANG (sample) | ID: retur1, retur2
  // ============================================================
  // Retur dari pelanggan — menunggu approval IC
  await prisma.returBarang.create({
    data: {
      id: 'retur1',
      produkId: createdProduk[0],
      barangKeluarId: barangKeluar1.id,
      jenisRetur: 'DARI_PELANGGAN',
      jumlahRetur: 5,
      alasanRetur: 'Produk rusak saat pengiriman, diminta retur oleh pelanggan',
      statusRetur: 'PENDING',
      dicatatOlehId: gudangId,
      tanggalRetur: new Date('2026-05-18'),
    }
  })

  // Retur ke supplier — sudah disetujui Manajer Gudang
  await prisma.returBarang.create({
    data: {
      id: 'retur2',
      produkId: createdProduk[2],
      jenisRetur: 'KE_SUPPLIER',
      jumlahRetur: 10,
      alasanRetur: 'Kemasan rusak saat diterima dari supplier',
      statusRetur: 'APPROVED_MG',
      dicatatOlehId: gudangId,
      approvedByIcId: icId,
      approvedByMgId: managerId,
      tanggalRetur: new Date('2026-05-17'),
    }
  })
  console.log('  ✅ Sample ReturBarang dibuat')

  // ============================================================
  // ALERT STOK | ID: alert1, alert2, alert3
  // ============================================================
  await prisma.alertStok.createMany({
    data: [
      { id: 'alert1', produkId: createdProduk[2], jenisAlert: 'STOK_MINIMUM', pesan: 'Stok Indomie Goreng Rendang mencapai batas kritis (15/35 dus)', status: 'AKTIF' },
      { id: 'alert2', produkId: createdProduk[4], jenisAlert: 'STOK_MINIMUM', pesan: 'Stok Indomie Goreng Jumbo mencapai batas kritis (10/25 dus)', status: 'AKTIF' },
      { id: 'alert3', produkId: createdProduk[8], jenisAlert: 'STOK_MINIMUM', pesan: 'Stok Indomie Kuah Coto Makassar di bawah minimum (22/20 dus)', status: 'AKTIF' },
    ]
  })
  console.log('  ✅ Alert stok dibuat')

  // ============================================================
  // MONITORING STOK | ID: monitoring1..monitoring10
  // ============================================================
  const monitorData = createdProduk.map((id, i) => ({
    id: `monitoring${i + 1}`,
    produkId: id,
    stokAktual: stokAwal[i],
    stokMinimum: produkList[i].stokMinimum,
    status: stokAwal[i] <= produkList[i].stokMinimum ? 'KRITIS' : 'NORMAL',
    waktuMonitor: new Date(),
  }))

  await prisma.monitoringStok.createMany({ data: monitorData })
  console.log('  ✅ Monitoring stok dibuat')

  console.log('\n🎉 Seeding selesai!')
  console.log('\n📋 Akun Login PT CAHAYA INDOMIE:')
  console.log('   admin@cahayaindomie.com       → admin123        (Admin)')
  console.log('   inventory@cahayaindomie.com   → inventory123    (Inventory Control Staf)')
  console.log('   gudang@cahayaindomie.com      → gudang123       (Staf Gudang)')
  console.log('   manager@cahayaindomie.com     → manager123      (Manajer Gudang)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
