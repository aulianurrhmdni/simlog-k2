'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const DOWNLOAD_ROLES = ['superadmin', 'manager_gudang', 'inventory_control']

export type KlasifikasiRow = {
  tanggal: string
  jenis: string
  produk: string
  kategori: string
  jumlah: number
  supplier: string
  pelanggan: string
  sumberRetur: string
  status: string
}

// Bangun tabel klasifikasi inventory gabungan (masuk + keluar + retur)
// dengan detail supplier, pelanggan, dan sumber retur.
async function buildKlasifikasi(
  pAwal: Date | null,
  pAkhir: Date | null
): Promise<KlasifikasiRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rangeFor = (field: string): any => {
    if (!pAwal && !pAkhir) return {}
    const r: any = {} // eslint-disable-line @typescript-eslint/no-explicit-any
    r[field] = {}
    if (pAwal) r[field].gte = pAwal
    if (pAkhir) r[field].lte = pAkhir
    return r
  }

  const [masuk, keluar, retur] = await Promise.all([
    prisma.barangMasuk.findMany({
      where: rangeFor('tanggalMasuk'),
      include: { produk: true, supplier: true },
    }),
    prisma.barangKeluar.findMany({
      where: rangeFor('tanggalKeluar'),
      include: { produk: true, permintaan: { include: { pelanggan: true } } },
    }),
    prisma.returBarang.findMany({
      where: rangeFor('tanggalRetur'),
      include: {
        produk: true,
        barangKeluar: { include: { permintaan: { include: { pelanggan: true } } } },
      },
    }),
  ])

  const rows: (KlasifikasiRow & { _sort: number })[] = []
  const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  for (const m of masuk) {
    rows.push({
      tanggal: fmt(m.tanggalMasuk),
      jenis: 'Barang Masuk',
      produk: m.produk.namaProduk,
      kategori: m.produk.kategori,
      jumlah: m.jumlahMasuk,
      supplier: m.supplier.namaSupplier,
      pelanggan: '-',
      sumberRetur: '-',
      status: m.statusPenerimaan,
      _sort: m.tanggalMasuk.getTime(),
    })
  }
  for (const k of keluar) {
    rows.push({
      tanggal: fmt(k.tanggalKeluar),
      jenis: 'Barang Keluar',
      produk: k.produk.namaProduk,
      kategori: k.produk.kategori,
      jumlah: k.jumlahKeluar,
      supplier: '-',
      pelanggan: k.permintaan?.pelanggan?.namaPelanggan ?? k.tujuan ?? '-',
      sumberRetur: '-',
      status: k.statusPengeluaran,
      _sort: k.tanggalKeluar.getTime(),
    })
  }
  for (const r of retur) {
    const dariPelanggan = r.jenisRetur === 'DARI_PELANGGAN'
    rows.push({
      tanggal: fmt(r.tanggalRetur),
      jenis: 'Retur Barang',
      produk: r.produk.namaProduk,
      kategori: r.produk.kategori,
      jumlah: r.jumlahRetur,
      supplier: dariPelanggan ? '-' : 'Dikembalikan ke Supplier',
      pelanggan: dariPelanggan
        ? (r.barangKeluar?.permintaan?.pelanggan?.namaPelanggan ?? r.barangKeluar?.tujuan ?? '-')
        : '-',
      sumberRetur: dariPelanggan ? 'Retur dari Pelanggan' : 'Retur ke Supplier',
      status: r.statusRetur,
      _sort: r.tanggalRetur.getTime(),
    })
  }

  rows.sort((a, b) => b._sort - a._sort)
  return rows.map(({ _sort, ...rest }) => rest) // eslint-disable-line @typescript-eslint/no-unused-vars
}

export async function getKlasifikasiInventory(
  periodeAwal?: string | Date | null,
  periodeAkhir?: string | Date | null
) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const pAwal = periodeAwal ? new Date(periodeAwal) : null
  const pAkhir = periodeAkhir ? new Date(periodeAkhir) : null
  if (pAkhir) pAkhir.setHours(23, 59, 59, 999)

  try {
    const data = await buildKlasifikasi(pAwal, pAkhir)
    return { success: true, data }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function createLaporan(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role
  if (role !== 'superadmin' && role !== 'manager_gudang') {
    return { error: 'Hanya Super Admin dan Manajer Gudang yang dapat mengekspor/membuat laporan' }
  }

  try {
    const periodeAwalRaw = formData.get('periode_awal') as string
    const periodeAkhirRaw = formData.get('periode_akhir') as string

    await prisma.laporanStok.create({
      data: {
        jenisLaporan: formData.get('jenis_laporan') as string,
        periodeAwal: periodeAwalRaw ? new Date(periodeAwalRaw) : null,
        periodeAkhir: periodeAkhirRaw ? new Date(periodeAkhirRaw) : null,
        dibuatOlehId: session.user.id,
      }
    })

    revalidatePath('/dashboard/laporan')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getLaporanExportData(
  jenisLaporan: string,
  periodeAwal: string | Date | null,
  periodeAkhir: string | Date | null
) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role
  // Inventory Control juga boleh mengunduh laporan (hanya tidak boleh membuat/ekspor entri baru)
  if (!DOWNLOAD_ROLES.includes(role)) {
    return { error: 'Anda tidak memiliki akses untuk mengunduh data laporan' }
  }

  const pAwal = periodeAwal ? new Date(periodeAwal) : null
  const pAkhir = periodeAkhir ? new Date(periodeAkhir) : null

  // Adjust end date to include the entire day
  if (pAkhir) {
    pAkhir.setHours(23, 59, 59, 999)
  }

  try {
    if (jenisLaporan === 'Laporan Stok Saat Ini') {
      const stok = await prisma.stok.findMany({
        include: { produk: true },
        orderBy: { produk: { namaProduk: 'asc' } },
      })

      return {
        success: true,
        data: stok.map((s) => ({
          'Nama Produk': s.produk.namaProduk,
          'Kategori': s.produk.kategori,
          'Jumlah Stok (dus)': s.jumlahStok,
          'Lokasi Rak': s.lokasiRak ?? '-',
          'Status Stok': s.statusStok,
          'Batas Minimum (dus)': s.produk.stokMinimum,
          'Terakhir Diperbarui': s.tanggalUpdate.toLocaleString('id-ID'),
        })),
      }
    }

    if (jenisLaporan === 'Laporan Alur Barang Masuk') {
      const where: any = {}
      if (pAwal || pAkhir) {
        where.tanggalMasuk = {}
        if (pAwal) where.tanggalMasuk.gte = pAwal
        if (pAkhir) where.tanggalMasuk.lte = pAkhir
      }

      const masuk = await prisma.barangMasuk.findMany({
        where,
        include: {
          produk: true,
          supplier: true,
          dicatatOleh: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { tanggalMasuk: 'desc' },
      })

      return {
        success: true,
        data: masuk.map((m) => ({
          'Tanggal': m.tanggalMasuk.toLocaleString('id-ID'),
          'Nama Produk': m.produk.namaProduk,
          'Kategori': m.produk.kategori,
          'Supplier': m.supplier.namaSupplier,
          'Jumlah Masuk (dus)': m.jumlahMasuk,
          'Batch': m.batch ?? '-',
          'Tanggal Kedaluwarsa': m.tanggalExpired ? m.tanggalExpired.toLocaleDateString('id-ID') : '-',
          'Status Penerimaan': m.statusPenerimaan,
          'Dicatat Oleh': m.dicatatOleh?.name ?? '-',
          'Disetujui Oleh': m.approvedBy?.name ?? '-',
        })),
      }
    }

    if (jenisLaporan === 'Laporan Alur Barang Keluar') {
      const where: any = {}
      if (pAwal || pAkhir) {
        where.tanggalKeluar = {}
        if (pAwal) where.tanggalKeluar.gte = pAwal
        if (pAkhir) where.tanggalKeluar.lte = pAkhir
      }

      const keluar = await prisma.barangKeluar.findMany({
        where,
        include: {
          produk: true,
          dicatatOleh: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { tanggalKeluar: 'desc' },
      })

      return {
        success: true,
        data: keluar.map((k) => ({
          'Tanggal': k.tanggalKeluar.toLocaleString('id-ID'),
          'Nama Produk': k.produk.namaProduk,
          'Kategori': k.produk.kategori,
          'Jumlah Keluar (dus)': k.jumlahKeluar,
          'Tujuan': k.tujuan ?? '-',
          'Status Pengeluaran': k.statusPengeluaran,
          'Dicatat Oleh': k.dicatatOleh?.name ?? '-',
          'Disetujui Oleh': k.approvedBy?.name ?? '-',
        })),
      }
    }

    if (jenisLaporan === 'Laporan Retur Barang') {
      const where: any = {}
      if (pAwal || pAkhir) {
        where.tanggalRetur = {}
        if (pAwal) where.tanggalRetur.gte = pAwal
        if (pAkhir) where.tanggalRetur.lte = pAkhir
      }

      const retur = await prisma.returBarang.findMany({
        where,
        include: {
          produk: true,
          dicatatOleh: { select: { name: true } },
          approvedByIc: { select: { name: true } },
          approvedByMg: { select: { name: true } },
        },
        orderBy: { tanggalRetur: 'desc' },
      })

      return {
        success: true,
        data: retur.map((r) => ({
          'Tanggal': r.tanggalRetur.toLocaleString('id-ID'),
          'Nama Produk': r.produk.namaProduk,
          'Kategori': r.produk.kategori,
          'Jenis Retur': r.jenisRetur === 'DARI_PELANGGAN' ? 'Dari Pelanggan' : 'Ke Supplier',
          'Jumlah Retur (dus)': r.jumlahRetur,
          'Alasan Retur': r.alasanRetur ?? '-',
          'Status Retur': r.statusRetur === 'PENDING' ? 'Menunggu IC' : r.statusRetur === 'APPROVED_IC' ? 'Menunggu MG' : r.statusRetur === 'APPROVED_MG' ? 'Disetujui Final' : 'Ditolak',
          'Dicatat Oleh': r.dicatatOleh?.name ?? '-',
          'Disetujui IC Oleh': r.approvedByIc?.name ?? '-',
          'Disetujui MG Oleh': r.approvedByMg?.name ?? '-',
        })),
      }
    }

    if (jenisLaporan === 'Laporan Klasifikasi Inventory') {
      const rows = await buildKlasifikasi(pAwal, pAkhir)
      return {
        success: true,
        data: rows.map((r) => ({
          'Tanggal': r.tanggal,
          'Jenis Transaksi': r.jenis,
          'Nama Produk': r.produk,
          'Kategori': r.kategori,
          'Jumlah (dus)': r.jumlah,
          'Supplier': r.supplier,
          'Pelanggan / Customer': r.pelanggan,
          'Sumber Retur': r.sumberRetur,
          'Status': r.status,
        })),
      }
    }

    return { error: 'Jenis laporan tidak dikenali' }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
