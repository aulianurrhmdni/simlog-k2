import { auth } from '@/lib/auth'
import { ProdukClient } from './ProdukClient'

export const dynamic = 'force-dynamic'

export default async function ProdukPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  return <ProdukClient role={role} />
}
