'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createPermintaan(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const role = session.user.role
  if (role !== 'superadmin' && role !== 'inventory_control') {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat membuat permintaan pengadaan' }
  }
  try {
    let pelangganId = (formData.get('pelanggan_id') as string) || null
    const pelangganNama = (formData.get('pelanggan_nama') as string)?.trim() || null

    // Input manual pelanggan: pakai yang sudah ada bila namanya cocok, jika tidak buat baru
    if (!pelangganId && pelangganNama) {
      const existing = await prisma.pelanggan.findFirst({
        where: { namaPelanggan: pelangganNama },
      })
      pelangganId = existing
        ? existing.id
        : (await prisma.pelanggan.create({ data: { namaPelanggan: pelangganNama } })).id
    }

    if (!pelangganId) {
      return { error: 'Pelanggan wajib dipilih atau diisi secara manual' }
    }

    const produkId = (formData.get('produk_id') as string) || null
    if (!produkId) {
      return { error: 'Produk wajib dipilih' }
    }

    const jumlah = parseInt(formData.get('jumlah') as string)
    if (isNaN(jumlah) || jumlah <= 0) {
      return { error: 'Jumlah permintaan tidak valid' }
    }

    await prisma.permintaanBarang.create({
      data: {
        pelangganId,
        produkId,
        jumlahPermintaan: jumlah,
        statusPermintaan: 'PENDING',
      }
    })
    revalidatePath('/dashboard/pengadaan')
    return { success: true }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

export async function updateStatusPermintaan(id: string, status: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  const role = session.user.role
  if (role !== 'superadmin' && role !== 'inventory_control') {
    return { error: 'Hanya Super Admin dan Staf Inventory Control yang dapat memproses permintaan pengadaan' }
  }
  try {
    await prisma.permintaanBarang.update({ where: { id }, data: { statusPermintaan: status } })
    revalidatePath('/dashboard/pengadaan')
    return { success: true }
  } catch (e: unknown) { return { error: (e as Error).message } }
}
