import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session.isAdmin) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))]">
      <AdminSidebar username={session.username ?? 'Admin'} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
