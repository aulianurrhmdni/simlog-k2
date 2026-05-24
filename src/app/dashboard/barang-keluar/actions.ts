'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const APPROVER_ROLES = ['inventory_control', 'manager_gudang', 'superadmin']

export async function createBarangKeluar(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  // Hanya warehouse_staff (dan superadmin) yang bisa input
  if (session.user.role !== 'warehouse_staff' && session.user.role !== 'superadmin') {
    return { error: 'Hanya Staf Gudang yang dapat mencatat barang keluar' }
  }

  const produkId = formData.get('id_produk') as string
  const jumlahKeluar = parseInt(formData.get('jumlah_keluar') as string, 10)
  const tujuan = (formData.get('tujuan') as string)?.trim() || null

  if (!produkId || isNaN(jumlahKeluar) || jumlahKeluar <= 0) {
    return { error: 'Data tidak lengkap atau tidak valid' }
  }

  try {
    // Awalnya PENDING, tidak mengurangi stok
    await prisma.barangKeluar.create({
      data: {
        produkId,
        jumlahKeluar,
        tujuan,
        statusPengeluaran: 'PENDING',
        dicatatOlehId: session.user.id,
      },
    })

    revalidatePath('/dashboard/barang-keluar')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function approveBarangKeluar(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  if (!APPROVER_ROLES.includes(session.user.role)) {
    return { error: 'Anda tidak memiliki akses untuk menyetujui barang keluar' }
  }

  try {
    const barangKeluar = await prisma.barangKeluar.findUnique({
      where: { id },
    })

    if (!barangKeluar) return { error: 'Data transaksi tidak ditemukan' }
    if (barangKeluar.statusPengeluaran !== 'PENDING') {
      return { error: 'Transaksi barang keluar sudah diproses sebelumnya' }
    }

    const produkId = barangKeluar.produkId
    const jumlah = barangKeluar.jumlahKeluar

    // Cek stok tersedia
    const stok = await prisma.stok.findFirst({ where: { produkId } })
    if (!stok) return { error: 'Data stok produk tidak ditemukan di gudang' }
    if (stok.jumlahStok < jumlah) {
      return { error: `Stok tidak mencukupi untuk disetujui. Stok tersedia: ${stok.jumlahStok} dus` }
    }

    // Kurangi stok
    const newJumlah = stok.jumlahStok - jumlah
    const param = await prisma.parameterStok.findFirst({ where: { produkId, aktif: true } })
    const statusStok = param
      ? newJumlah <= param.batasMinimum
        ? newJumlah <= param.batasMinimum / 2 ? 'KRITIS' : 'RENDAH'
        : 'NORMAL'
      : 'NORMAL'

    await prisma.stok.update({
      where: { id: stok.id },
      data: { jumlahStok: newJumlah, statusStok, tanggalUpdate: new Date() }
    })

    // Buat alert jika stok menipis
    if (param && newJumlah <= param.batasMinimum) {
      await prisma.alertStok.create({
        data: {
          produkId,
          jenisAlert: 'STOK_MINIMUM',
          pesan: `Stok telah mencapai batas minimum setelah pengeluaran (${newJumlah}/${param.batasMinimum} dus)`,
          status: 'AKTIF',
        }
      })
    }

    // Update status barang keluar
    await prisma.barangKeluar.update({
      where: { id },
      data: {
        statusPengeluaran: 'DISETUJUI',
        approvedById: session.user.id,
      },
    })

    revalidatePath('/dashboard/barang-keluar')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function rejectBarangKeluar(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  if (!APPROVER_ROLES.includes(session.user.role)) {
    return { error: 'Anda tidak memiliki akses untuk menolak barang keluar' }
  }

  try {
    const barangKeluar = await prisma.barangKeluar.findUnique({
      where: { id },
    })

    if (!barangKeluar) return { error: 'Data transaksi tidak ditemukan' }
    if (barangKeluar.statusPengeluaran !== 'PENDING') {
      return { error: 'Transaksi barang keluar sudah diproses sebelumnya' }
    }

    await prisma.barangKeluar.update({
      where: { id },
      data: {
        statusPengeluaran: 'DITOLAK',
        approvedById: session.user.id,
      },
    })

    revalidatePath('/dashboard/barang-keluar')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getBarangKeluarData() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    const [keluarRes, produkRes] = await Promise.all([
      prisma.barangKeluar.findMany({
        include: {
          produk: true,
          dicatatOleh: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { tanggalKeluar: 'desc' }
      }),
      prisma.produk.findMany({
        orderBy: { namaProduk: 'asc' }
      })
    ])

    const keluarMapped = keluarRes.map(k => ({
      id_keluar: k.id,
      id_produk: k.produkId,
      tanggal_keluar: k.tanggalKeluar.toISOString(),
      jumlah_keluar: k.jumlahKeluar,
      tujuan: k.tujuan,
      status_pengeluaran: k.statusPengeluaran,
      dicatat_oleh: k.dicatatOleh?.name ?? null,
      approved_by: k.approvedBy?.name ?? null,
      produk: k.produk ? {
        id_produk: k.produk.id,
        nama_produk: k.produk.namaProduk,
      } : undefined
    }))

    const produkMapped = produkRes.map(p => ({
      id_produk: p.id,
      nama_produk: p.namaProduk,
    }))

    return { success: true, data: { keluar: keluarMapped, produk: produkMapped } }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
