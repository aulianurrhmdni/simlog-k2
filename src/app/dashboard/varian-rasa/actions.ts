'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const KATEGORI_VALID = ['Goreng', 'Kuah']

function checkPermission(role: string) {
  return role === 'admin' || role === 'inventory_control' || role === 'manager_gudang'
}

export async function createProdukBaru(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Admin, Inventory Control, atau Manajer Gudang yang dapat menambahkan produk baru' }
  }

  const namaProduk = (formData.get('nama_produk') as string)?.trim()
  const kategori = formData.get('kategori') as string
  const lokasiRak = (formData.get('lokasi_rak') as string)?.trim() || null

  if (!namaProduk || !kategori) {
    return { error: 'Nama produk dan kategori wajib diisi' }
  }
  if (!KATEGORI_VALID.includes(kategori)) {
    return { error: 'Kategori tidak valid' }
  }

  try {
    const produk = await prisma.produk.create({
      data: { namaProduk, kategori },
    })

    await prisma.stok.create({
      data: { produkId: produk.id, lokasiRak },
    })

    revalidatePath('/dashboard/varian-rasa')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard/barang-masuk')
    revalidatePath('/dashboard/barang-keluar')
    revalidatePath('/dashboard/retur')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getProdukBaruList() {
  const products = await prisma.produk.findMany({
    include: { stok: { select: { lokasiRak: true }, take: 1 } },
    orderBy: [{ kategori: 'asc' }, { namaProduk: 'asc' }],
  })
  return products.map(p => ({
    id: p.id,
    namaProduk: p.namaProduk,
    kategori: p.kategori,
    lokasiRak: p.stok[0]?.lokasiRak ?? null,
    createdAt: p.createdAt,
  }))
}
