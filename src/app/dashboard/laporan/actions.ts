'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
  if (role !== 'superadmin' && role !== 'manager_gudang') {
    return { error: 'Hanya Super Admin dan Manajer Gudang yang dapat mengekspor data' }
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

    return { error: 'Jenis laporan tidak dikenali' }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
