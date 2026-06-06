import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { LaporanClient } from './LaporanClient'
import { getKlasifikasiInventory } from './actions'

export const dynamic = 'force-dynamic'

export default async function LaporanPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  const [laporanList, klasifikasiRes] = await Promise.all([
    prisma.laporanStok.findMany({
      include: {
        dibuatOleh: {
          select: { name: true },
        },
      },
      orderBy: {
        tanggalLaporan: 'desc',
      },
    }),
    getKlasifikasiInventory(),
  ])

  const klasifikasi = klasifikasiRes.success ? klasifikasiRes.data : []

  return <LaporanClient role={role} laporanList={laporanList as any} klasifikasi={klasifikasi as any} />
}
