'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const APPROVER_ROLES = ['inventory_control', 'manager_gudang', 'admin']
// Hanya Staf Gudang yang menilai kesesuaian fisik saat input barang masuk
const WAREHOUSE_ROLES = ['warehouse_staff', 'admin']
const KESESUAIAN_VALID = ['BELUM_DICEK', 'SESUAI', 'TIDAK_SESUAI']

export async function createBarangMasuk(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  // Hanya warehouse_staff (dan admin) yang bisa input
  if (session.user.role !== 'warehouse_staff' && session.user.role !== 'admin') {
    return { error: 'Hanya Staf Gudang yang dapat menginput barang masuk' }
  }

  const produkId = formData.get('id_produk') as string
  const supplierId = formData.get('id_supplier') as string
  const jumlahMasuk = parseInt(formData.get('jumlah_masuk') as string, 10)
  const batch = (formData.get('batch') as string)?.trim() || null
  const tanggalExpiredRaw = formData.get('tanggal_expired') as string
  const kesesuaianFisik = (formData.get('kesesuaian_fisik') as string) || 'BELUM_DICEK'
  const catatan = (formData.get('catatan') as string)?.trim() || null

  if (!produkId || !supplierId || isNaN(jumlahMasuk) || jumlahMasuk <= 0) {
    return { error: 'Data tidak lengkap atau tidak valid' }
  }

  try {
    await prisma.barangMasuk.create({
      data: {
        produkId,
        supplierId,
        jumlahMasuk,
        batch,
        tanggalExpired: tanggalExpiredRaw ? new Date(tanggalExpiredRaw) : null,
        statusPenerimaan: 'PENDING',
        kesesuaianFisik: KESESUAIAN_VALID.includes(kesesuaianFisik) ? kesesuaianFisik : 'BELUM_DICEK',
        catatan,
        dicatatOlehId: session.user.id,
      },
    })

    revalidatePath('/dashboard/barang-masuk')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function verifyBarangMasuk(
  id: string,
  status: string,
  produkId: string,
  jumlah: number
) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  // Hanya inventory_control atau manager_gudang (dan admin) yang bisa approve
  if (!APPROVER_ROLES.includes(session.user.role)) {
    return { error: 'Anda tidak memiliki akses untuk menyetujui atau menolak barang masuk' }
  }

  try {
    await prisma.barangMasuk.update({
      where: { id },
      data: {
        statusPenerimaan: status,
        approvedById: session.user.id,
      },
    })

    // Update stok hanya jika status DITERIMA
    if (status === 'DITERIMA') {
      const stok = await prisma.stok.findFirst({ where: { produkId } })

      if (stok) {
        const param = await prisma.parameterStok.findFirst({
          where: { produkId, aktif: true },
        })
        const batas = param?.batasMinimum ?? 0
        const newJumlah = stok.jumlahStok + jumlah

        let newStatus = 'NORMAL'
        if (newJumlah <= batas / 2) newStatus = 'KRITIS'
        else if (newJumlah <= batas) newStatus = 'RENDAH'

        await prisma.stok.update({
          where: { id: stok.id },
          data: { jumlahStok: newJumlah, statusStok: newStatus, tanggalUpdate: new Date() },
        })

        // Buat alert jika masih di bawah minimum
        if (param && newJumlah <= param.batasMinimum) {
          await prisma.alertStok.create({
            data: {
              produkId,
              jenisAlert: 'STOK_MINIMUM',
              pesan: `Stok masih di bawah minimum setelah penerimaan (${newJumlah}/${param.batasMinimum} dus)`,
              status: 'AKTIF',
            },
          })
        }
      } else {
        // Belum ada record stok — buat baru
        const produk = await prisma.produk.findUnique({ where: { id: produkId } })
        const batas = produk?.stokMinimum ?? 0
        const newStatus = jumlah <= batas ? (jumlah <= batas / 2 ? 'KRITIS' : 'RENDAH') : 'NORMAL'
        await prisma.stok.create({
          data: { produkId, jumlahStok: jumlah, statusStok: newStatus },
        })
      }
    }

    revalidatePath('/dashboard/barang-masuk')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function updateKesesuaianFisik(
  id: string,
  kesesuaian: string,
  catatan: string | null
) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  // Hanya Staf Gudang yang menilai kesesuaian fisik barang
  if (!WAREHOUSE_ROLES.includes(session.user.role)) {
    return { error: 'Hanya Staf Gudang yang dapat menilai kesesuaian barang' }
  }

  if (!KESESUAIAN_VALID.includes(kesesuaian)) {
    return { error: 'Nilai kesesuaian tidak valid' }
  }

  try {
    await prisma.barangMasuk.update({
      where: { id },
      data: {
        kesesuaianFisik: kesesuaian,
        catatanKesesuaian: catatan?.trim() || null,
      },
    })

    revalidatePath('/dashboard/barang-masuk')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getBarangMasukData() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    const [masukRes, produkRes, supplierRes] = await Promise.all([
      prisma.barangMasuk.findMany({
        include: {
          produk: true,
          supplier: true,
          dicatatOleh: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
        orderBy: { tanggalMasuk: 'desc' }
      }),
      prisma.produk.findMany({ orderBy: { namaProduk: 'asc' } }),
      prisma.supplier.findMany({ orderBy: { namaSupplier: 'asc' } })
    ])

    const masukMapped = masukRes.map(m => ({
      id_masuk: m.id,
      id_produk: m.produkId,
      id_supplier: m.supplierId,
      tanggal_masuk: m.tanggalMasuk.toISOString(),
      jumlah_masuk: m.jumlahMasuk,
      batch: m.batch,
      tanggal_expired: m.tanggalExpired ? m.tanggalExpired.toISOString() : null,
      status_penerimaan: m.statusPenerimaan,
      kesesuaian_fisik: m.kesesuaianFisik,
      catatan_kesesuaian: m.catatanKesesuaian,
      catatan: m.catatan,
      dicatat_oleh: m.dicatatOleh?.name ?? null,
      approved_by: m.approvedBy?.name ?? null,
      produk: m.produk ? { id_produk: m.produk.id, nama_produk: m.produk.namaProduk } : undefined,
      supplier: m.supplier ? { id_supplier: m.supplier.id, nama_supplier: m.supplier.namaSupplier } : undefined,
    }))

    const produkMapped = produkRes.map(p => ({ id_produk: p.id, nama_produk: p.namaProduk }))
    const supplierMapped = supplierRes.map(s => ({ id_supplier: s.id, nama_supplier: s.namaSupplier }))

    return { success: true, data: { masuk: masukMapped, produk: produkMapped, supplier: supplierMapped } }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
