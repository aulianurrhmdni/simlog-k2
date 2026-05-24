import { auth } from '@/lib/auth'
import { BarangMasukClient } from './BarangMasukClient'

export const dynamic = 'force-dynamic'

export default async function BarangMasukPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  return <BarangMasukClient role={role} />
}
