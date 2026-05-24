'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// Roles yang bisa approve retur
const IC_ROLES = ['inventory_control', 'superadmin']
const MG_ROLES = ['manager_gudang', 'superadmin']
const APPROVER_ROLES = ['inventory_control', 'manager_gudang', 'superadmin']

export async function createRetur(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role
  // Hanya warehouse_staff yang input retur (+ superadmin)
  if (role !== 'warehouse_staff' && role !== 'superadmin') {
    return { error: 'Hanya Staf Gudang yang dapat menginput retur' }
  }

  const produkId = formData.get('id_produk') as string
  const jenisRetur = formData.get('jenis_retur') as string
  const barangKeluarId = (formData.get('id_barang_keluar') as string) || null
  const jumlahRetur = parseInt(formData.get('jumlah_retur') as string)
  const alasanRetur = formData.get('alasan_retur') as string

  if (!produkId || !jenisRetur || isNaN(jumlahRetur) || jumlahRetur <= 0) {
    return { error: 'Data tidak lengkap atau tidak valid' }
  }

  // Validasi kritis: Retur dari pelanggan WAJIB ada barang keluar yang sesuai
  if (jenisRetur === 'DARI_PELANGGAN') {
    if (!barangKeluarId) {
      return { error: 'Retur dari pelanggan wajib melampirkan transaksi barang keluar yang sesuai' }
    }
    const barangKeluar = await prisma.barangKeluar.findFirst({
      where: { id: barangKeluarId, produkId, statusPengeluaran: 'DISETUJUI' }
    })
    if (!barangKeluar) {
      return { error: 'Tidak ditemukan transaksi barang keluar yang valid untuk produk ini. Sistem menolak retur.' }
    }
  }

  try {
    await prisma.returBarang.create({
      data: {
        produkId,
        jenisRetur,
        barangKeluarId: jenisRetur === 'DARI_PELANGGAN' ? barangKeluarId : null,
        jumlahRetur,
        alasanRetur: alasanRetur || null,
        statusRetur: 'PENDING',
        dicatatOlehId: session.user.id,
      }
    })

    revalidatePath('/dashboard/retur')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function approveReturIC(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  if (!IC_ROLES.includes(session.user.role)) {
    return { error: 'Hanya Inventory Control Staf yang dapat memberikan approval tahap pertama' }
  }

  try {
    const retur = await prisma.returBarang.findUnique({ where: { id } })
    if (!retur) return { error: 'Data retur tidak ditemukan' }
    if (retur.statusRetur !== 'PENDING') {
      return { error: 'Retur ini sudah diproses sebelumnya' }
    }

    await prisma.returBarang.update({
      where: { id },
      data: {
        statusRetur: 'APPROVED_IC',
        approvedByIcId: session.user.id,
      }
    })

    revalidatePath('/dashboard/retur')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function approveReturMG(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  if (!MG_ROLES.includes(session.user.role)) {
    return { error: 'Hanya Manajer Gudang yang dapat memberikan approval tahap akhir' }
  }

  try {
    const retur = await prisma.returBarang.findUnique({ where: { id } })
    if (!retur) return { error: 'Data retur tidak ditemukan' }
    if (retur.statusRetur !== 'APPROVED_IC') {
      return { error: 'Retur harus disetujui oleh Inventory Control terlebih dahulu' }
    }

    // Setelah approval akhir — update stok
    const stok = await prisma.stok.findFirst({ where: { produkId: retur.produkId } })
    if (stok) {
      const param = await prisma.parameterStok.findFirst({
        where: { produkId: retur.produkId, aktif: true }
      })

      let newJumlah: number
      if (retur.jenisRetur === 'DARI_PELANGGAN') {
        // Barang kembali masuk → stok bertambah
        newJumlah = stok.jumlahStok + retur.jumlahRetur
      } else {
        // Barang ke supplier → stok berkurang
        if (stok.jumlahStok < retur.jumlahRetur) {
          return { error: `Stok tidak mencukupi untuk retur ke supplier (stok: ${stok.jumlahStok}, retur: ${retur.jumlahRetur})` }
        }
        newJumlah = stok.jumlahStok - retur.jumlahRetur
      }

      const batas = param?.batasMinimum ?? 0
      let statusStok = 'NORMAL'
      if (newJumlah <= batas / 2) statusStok = 'KRITIS'
      else if (newJumlah <= batas) statusStok = 'RENDAH'

      await prisma.stok.update({
        where: { id: stok.id },
        data: { jumlahStok: newJumlah, statusStok, tanggalUpdate: new Date() }
      })

      // Alert jika stok turun ke bawah minimum
      if (param && newJumlah <= param.batasMinimum) {
        await prisma.alertStok.create({
          data: {
            produkId: retur.produkId,
            jenisAlert: 'STOK_MINIMUM',
            pesan: `Stok mencapai batas minimum setelah retur ke supplier (${newJumlah}/${param.batasMinimum} dus)`,
            status: 'AKTIF',
          }
        })
      }
    }

    await prisma.returBarang.update({
      where: { id },
      data: {
        statusRetur: 'APPROVED_MG',
        approvedByMgId: session.user.id,
      }
    })

    revalidatePath('/dashboard/retur')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function rejectRetur(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  if (!APPROVER_ROLES.includes(session.user.role)) {
    return { error: 'Anda tidak memiliki akses untuk menolak retur' }
  }

  try {
    const retur = await prisma.returBarang.findUnique({ where: { id } })
    if (!retur) return { error: 'Data retur tidak ditemukan' }
    if (retur.statusRetur === 'APPROVED_MG' || retur.statusRetur === 'REJECTED') {
      return { error: 'Retur ini sudah diproses final' }
    }

    await prisma.returBarang.update({
      where: { id },
      data: { statusRetur: 'REJECTED' }
    })

    revalidatePath('/dashboard/retur')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getReturData() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    const [returRes, produkRes, barangKeluarRes] = await Promise.all([
      prisma.returBarang.findMany({
        include: {
          produk: true,
          barangKeluar: { include: { produk: true } },
          dicatatOleh: { select: { name: true } },
          approvedByIc: { select: { name: true } },
          approvedByMg: { select: { name: true } },
        },
        orderBy: { tanggalRetur: 'desc' }
      }),
      prisma.produk.findMany({ orderBy: { namaProduk: 'asc' } }),
      prisma.barangKeluar.findMany({
        where: { statusPengeluaran: 'DISETUJUI' },
        include: { produk: true },
        orderBy: { tanggalKeluar: 'desc' }
      }),
    ])

    const returMapped = returRes.map(r => ({
      id_retur: r.id,
      id_produk: r.produkId,
      id_barang_keluar: r.barangKeluarId,
      jenis_retur: r.jenisRetur,
      tanggal_retur: r.tanggalRetur.toISOString(),
      jumlah_retur: r.jumlahRetur,
      alasan_retur: r.alasanRetur,
      status_retur: r.statusRetur,
      dicatat_oleh: r.dicatatOleh?.name ?? null,
      approved_by_ic: r.approvedByIc?.name ?? null,
      approved_by_mg: r.approvedByMg?.name ?? null,
      produk: r.produk ? { id_produk: r.produk.id, nama_produk: r.produk.namaProduk } : undefined,
      barang_keluar: r.barangKeluar ? {
        id_keluar: r.barangKeluar.id,
        jumlah_keluar: r.barangKeluar.jumlahKeluar,
        tujuan: r.barangKeluar.tujuan,
        tanggal_keluar: r.barangKeluar.tanggalKeluar.toISOString(),
      } : undefined,
    }))

    const produkMapped = produkRes.map(p => ({
      id_produk: p.id,
      nama_produk: p.namaProduk,
    }))

    const keluarMapped = barangKeluarRes.map(k => ({
      id_keluar: k.id,
      id_produk: k.produkId,
      jumlah_keluar: k.jumlahKeluar,
      tujuan: k.tujuan,
      tanggal_keluar: k.tanggalKeluar.toISOString(),
      produk: k.produk ? { nama_produk: k.produk.namaProduk } : undefined,
    }))

    return { success: true, data: { retur: returMapped, produk: produkMapped, barangKeluar: keluarMapped } }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
