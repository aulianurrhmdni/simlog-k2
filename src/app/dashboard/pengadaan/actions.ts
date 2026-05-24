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
    await prisma.permintaanBarang.create({
      data: {
        pelangganId: formData.get('pelanggan_id') as string,
        produkId: formData.get('produk_id') as string || null,
        jumlahPermintaan: parseInt(formData.get('jumlah') as string),
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
