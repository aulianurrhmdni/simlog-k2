import { auth } from '@/lib/auth'
import { VarianRasaClient } from './VarianRasaClient'

export const dynamic = 'force-dynamic'

export default async function VarianRasaPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  return <VarianRasaClient role={role} />
}
