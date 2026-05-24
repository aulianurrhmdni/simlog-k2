import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { LaporanClient } from './LaporanClient'

export const dynamic = 'force-dynamic'

export default async function LaporanPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  const laporanList = await prisma.laporanStok.findMany({
    include: {
      dibuatOleh: {
        select: { name: true },
      },
    },
    orderBy: {
      tanggalLaporan: 'desc',
    },
  })

  return <LaporanClient role={role} laporanList={laporanList as any} />
}
