'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

function checkPermission(role: string) {
  return role === 'superadmin' || role === 'inventory_control'
}

export async function createProduk(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat menambahkan produk' }
  }

  const namaProduk = formData.get('nama_produk') as string
  const kategori = formData.get('kategori') as string

  if (!namaProduk || !kategori) {
    return { error: 'Nama produk dan kategori wajib diisi' }
  }

  if (kategori !== 'Kuah' && kategori !== 'Goreng') {
    return { error: 'Kategori tidak valid' }
  }

  try {
    const produk = await prisma.produk.create({
      data: {
        namaProduk,
        kategori,
        satuan: 'dus', // Hardcoded to dus
        stokMinimum: parseInt(formData.get('stok_minimum') as string) || 0,
        masaKedaluwarsa: formData.get('masa_kedaluwarsa')
          ? parseInt(formData.get('masa_kedaluwarsa') as string)
          : null,
      },
    })

    // Auto-create stok entry
    await prisma.stok.create({
      data: { produkId: produk.id, jumlahStok: 0, statusStok: 'NORMAL' },
    })

    await prisma.parameterStok.create({
      data: {
        produkId: produk.id,
        batasMinimum: parseInt(formData.get('stok_minimum') as string) || 0,
        aktif: true,
      },
    })

    revalidatePath('/dashboard/produk')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function updateProduk(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat mengubah produk' }
  }

  const id = formData.get('id') as string
  const namaProduk = formData.get('nama_produk') as string
  const kategori = formData.get('kategori') as string

  if (!id || !namaProduk || !kategori) {
    return { error: 'Data tidak lengkap' }
  }

  if (kategori !== 'Kuah' && kategori !== 'Goreng') {
    return { error: 'Kategori tidak valid' }
  }

  try {
    await prisma.produk.update({
      where: { id },
      data: {
        namaProduk,
        kategori,
        satuan: 'dus', // Hardcoded to dus
        stokMinimum: parseInt(formData.get('stok_minimum') as string) || 0,
        masaKedaluwarsa: formData.get('masa_kedaluwarsa')
          ? parseInt(formData.get('masa_kedaluwarsa') as string)
          : null,
      },
    })

    // Sync parameter stok
    const param = await prisma.parameterStok.findFirst({ where: { produkId: id } })
    if (param) {
      await prisma.parameterStok.update({
        where: { id: param.id },
        data: { batasMinimum: parseInt(formData.get('stok_minimum') as string) || 0 }
      })
    }

    revalidatePath('/dashboard/produk')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function deleteProduk(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat menghapus produk' }
  }

  try {
    await prisma.produk.delete({ where: { id } })
    revalidatePath('/dashboard/produk')
    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getProdukList() {
  const produkList = await prisma.produk.findMany({
    include: { stok: true },
    orderBy: { namaProduk: 'asc' },
  })
  return produkList
}
