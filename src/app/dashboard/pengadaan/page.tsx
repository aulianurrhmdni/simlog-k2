import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { PengadaanClient } from './PengadaanClient'

export const dynamic = 'force-dynamic'

export default async function PengadaanPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  const [permintaan, pelangganList, produkList] = await Promise.all([
    prisma.permintaanBarang.findMany({
      include: {
        pelanggan: true,
        produk: true,
      },
      orderBy: {
        tanggalPermintaan: 'desc',
      },
    }),
    prisma.pelanggan.findMany({
      orderBy: {
        namaPelanggan: 'asc',
      },
    }),
    prisma.produk.findMany({
      orderBy: {
        namaProduk: 'asc',
      },
    }),
  ])

  return (
    <PengadaanClient
      role={role}
      permintaan={permintaan as any}
      pelangganList={pelangganList as any}
      produkList={produkList as any}
    />
  )
}
