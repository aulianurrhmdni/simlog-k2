'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const KATEGORI_VALID = ['Goreng', 'Kuah']

function checkPermission(role: string) {
  return role === 'superadmin' || role === 'inventory_control'
}

function parseForm(formData: FormData) {
  const namaVarian = (formData.get('nama_varian') as string)?.trim()
  const kategori = formData.get('kategori') as string
  const tingkatPedasRaw = formData.get('tingkat_pedas') as string
  const deskripsi = (formData.get('deskripsi') as string)?.trim() || null
  const aktif = formData.get('aktif') !== 'false'

  let tingkatPedas = parseInt(tingkatPedasRaw)
  if (Number.isNaN(tingkatPedas)) tingkatPedas = 0
  tingkatPedas = Math.min(5, Math.max(0, tingkatPedas))

  return { namaVarian, kategori, tingkatPedas, deskripsi, aktif }
}

export async function createVarianRasa(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat menambahkan varian rasa' }
  }

  const { namaVarian, kategori, tingkatPedas, deskripsi, aktif } = parseForm(formData)

  if (!namaVarian || !kategori) {
    return { error: 'Nama varian dan kategori wajib diisi' }
  }
  if (!KATEGORI_VALID.includes(kategori)) {
    return { error: 'Kategori tidak valid' }
  }

  try {
    await prisma.varianRasa.create({
      data: { namaVarian, kategori, tingkatPedas, deskripsi, aktif },
    })
    revalidatePath('/dashboard/varian-rasa')
    return { success: true }
  } catch (e: unknown) {
    const msg = (e as Error).message
    if (msg.includes('Unique') || msg.includes('UNIQUE')) {
      return { error: `Varian rasa "${namaVarian}" sudah ada` }
    }
    return { error: msg }
  }
}

export async function updateVarianRasa(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat mengubah varian rasa' }
  }

  const id = formData.get('id') as string
  const { namaVarian, kategori, tingkatPedas, deskripsi, aktif } = parseForm(formData)

  if (!id || !namaVarian || !kategori) {
    return { error: 'Data tidak lengkap' }
  }
  if (!KATEGORI_VALID.includes(kategori)) {
    return { error: 'Kategori tidak valid' }
  }

  try {
    await prisma.varianRasa.update({
      where: { id },
      data: { namaVarian, kategori, tingkatPedas, deskripsi, aktif },
    })
    revalidatePath('/dashboard/varian-rasa')
    return { success: true }
  } catch (e: unknown) {
    const msg = (e as Error).message
    if (msg.includes('Unique') || msg.includes('UNIQUE')) {
      return { error: `Varian rasa "${namaVarian}" sudah ada` }
    }
    return { error: msg }
  }
}

export async function deleteVarianRasa(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  if (!checkPermission(session.user.role)) {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat menghapus varian rasa' }
  }

  try {
    await prisma.varianRasa.delete({ where: { id } })
    revalidatePath('/dashboard/varian-rasa')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getVarianRasaList() {
  return prisma.varianRasa.findMany({
    include: { _count: { select: { produk: true } } },
    orderBy: [{ kategori: 'asc' }, { namaVarian: 'asc' }],
  })
}
