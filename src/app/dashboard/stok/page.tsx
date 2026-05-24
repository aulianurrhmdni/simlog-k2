import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { StokClient } from './StokClient'

export const dynamic = 'force-dynamic'

export default async function StokPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  const stokList = await prisma.stok.findMany({
    include: { produk: true },
    orderBy: { tanggalUpdate: 'desc' },
  })

  return (
    <div className="space-y-6">
      <StokClient stokList={stokList} role={role} />
    </div>
  )
}
