'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function createPengiriman(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  try {
    await prisma.pengirimanBarang.create({
      data: {
        permintaanId: formData.get('permintaan_id') as string || null,
        tanggalJadwal: formData.get('tanggal_jadwal') ? new Date(formData.get('tanggal_jadwal') as string) : null,
        catatan: formData.get('catatan') as string || null,
        statusPengiriman: 'DIJADWALKAN',
        dibuatOlehId: session.user.id,
      }
    })
    revalidatePath('/dashboard/pengiriman')
    return { success: true }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

export async function updateStatusPengiriman(id: string, status: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }
  try {
    await prisma.pengirimanBarang.update({
      where: { id },
      data: {
        statusPengiriman: status,
        tanggalKirim: status === 'DIKIRIM' ? new Date() : undefined
      }
    })
    revalidatePath('/dashboard/pengiriman')
    return { success: true }
  } catch (e: unknown) { return { error: (e as Error).message } }
}
