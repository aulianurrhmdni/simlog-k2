'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateStok(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const role = session.user.role
  if (role !== 'superadmin' && role !== 'manager_gudang') {
    return { error: 'Hanya Super Admin dan Manajer Gudang yang dapat mengubah data stok' }
  }

  const id = formData.get('id_stok') as string
  const jumlahStok = parseInt(formData.get('jumlah_stok') as string, 10)
  const lokasiRak = formData.get('lokasi_rak') as string
  const statusStok = formData.get('status_stok') as string

  if (!id || isNaN(jumlahStok)) {
    return { error: 'Data tidak valid' }
  }

  try {
    await prisma.stok.update({
      where: { id },
      data: {
        jumlahStok,
        lokasiRak: lokasiRak?.trim() || null,
        statusStok,
        tanggalUpdate: new Date(),
      },
    })

    revalidatePath('/dashboard/stok')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
