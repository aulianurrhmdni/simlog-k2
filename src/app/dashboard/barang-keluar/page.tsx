import { auth } from '@/lib/auth'
import { BarangKeluarClient } from './BarangKeluarClient'

export const dynamic = 'force-dynamic'

export default async function BarangKeluarPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  return <BarangKeluarClient role={role} />
}
