import { auth } from '@/lib/auth'
import { ReturClient } from './ReturClient'

export const dynamic = 'force-dynamic'

export default async function ReturPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''

  return <ReturClient role={role} />
}
