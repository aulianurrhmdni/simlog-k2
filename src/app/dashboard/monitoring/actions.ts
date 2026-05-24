'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function dismissAlert(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    await prisma.alertStok.update({ where: { id }, data: { status: 'DIABAIKAN' } })
    revalidatePath('/dashboard/monitoring')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function resolveAlert(id: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    await prisma.alertStok.update({ where: { id }, data: { status: 'SELESAI' } })
    revalidatePath('/dashboard/monitoring')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function getMonitoringData() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  try {
    const [alertRes, monitorRes] = await Promise.all([
      prisma.alertStok.findMany({
        include: { produk: true },
        orderBy: { waktuAlert: 'desc' }
      }),
      prisma.monitoringStok.findMany({
        include: { produk: true },
        orderBy: { waktuMonitor: 'desc' }
      })
    ])

    const alertsMapped = alertRes.map(a => ({
      id_alert: a.id,
      id_produk: a.produkId,
      jenis_alert: a.jenisAlert,
      pesan: a.pesan,
      waktu_alert: a.waktuAlert.toISOString(),
      status: a.status,
      produk: a.produk ? {
        id_produk: a.produk.id,
        nama_produk: a.produk.namaProduk,
      } : undefined
    }))

    const monitorMapped = monitorRes.map(m => ({
      id_monitor: m.id,
      id_produk: m.produkId,
      waktu_monitor: m.waktuMonitor.toISOString(),
      stok_aktual: m.stokAktual,
      stok_minimum: m.stokMinimum,
      status: m.status,
      produk: m.produk ? {
        id_produk: m.produk.id,
        nama_produk: m.produk.namaProduk,
      } : undefined
    }))

    return { success: true, data: { alerts: alertsMapped, monitoring: monitorMapped } }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
