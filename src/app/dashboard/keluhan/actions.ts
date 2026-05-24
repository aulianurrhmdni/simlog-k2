'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createKeluhan(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  try {
    await prisma.keluhanPersediaan.create({
      data: {
        pelangganId: formData.get('pelanggan_id') as string,
        produkId: formData.get('produk_id') as string,
        deskripsiKeluhan: formData.get('deskripsi') as string,
        statusKeluhan: 'OPEN',
        dicatatOlehId: session.user.id,
      }
    })
    revalidatePath('/dashboard/keluhan')
    return { success: true }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

export async function updateStatusKeluhan(id: string, status: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  try {
    await prisma.keluhanPersediaan.update({ where: { id }, data: { statusKeluhan: status } })
    revalidatePath('/dashboard/keluhan')
    return { success: true }
  } catch (e: unknown) { return { error: (e as Error).message } }
}
