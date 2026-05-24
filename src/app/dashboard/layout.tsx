import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = session.user.role
  const name = session.user.name
  const email = session.user.email
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      <div className="hidden md:block h-screen sticky top-0">
        <Sidebar role={role} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header email={email} role={role} name={name} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
