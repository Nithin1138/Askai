'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Cpu,
  Settings,
  LogOut,
  Home,
  FileText,
  Users,
  Activity,
  ChevronRight,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/documents', icon: FileText, label: 'Documents' },
  { href: '/admin/models', icon: Cpu, label: 'Models' },
  { href: '/admin/sessions', icon: Users, label: 'Sessions' },
  { href: '/admin/logs', icon: Activity, label: 'Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

interface AdminSidebarProps {
  username: string
}

export function AdminSidebar({ username }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-56 h-screen border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[hsl(var(--sidebar-border))]">
        <div className="h-7 w-7 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div>
          <span className="font-semibold text-[hsl(var(--foreground))] text-sm tracking-tight block">
            ASKAI
          </span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-2 mb-2">
          Manage
        </p>
        {adminNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-[hsl(var(--sidebar-item-active))] text-[hsl(var(--sidebar-item-active-foreground))] font-medium'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--sidebar-item-hover))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[hsl(var(--accent))]"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {isActive && (
                  <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
                )}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-[hsl(var(--sidebar-border))] pt-3">
        <Link href="/">
          <span className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--sidebar-item-hover))] hover:text-[hsl(var(--foreground))] transition-colors">
            <Home className="h-3.5 w-3.5" />
            View Site
          </span>
        </Link>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="h-5 w-5 rounded-full bg-[hsl(var(--accent-subtle))] flex items-center justify-center flex-shrink-0">
            <span className="text-[8px] font-bold text-[hsl(var(--accent))]">
              {username[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-[hsl(var(--foreground))] truncate flex-1">{username}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            title="Logout"
            className="h-6 w-6 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--error))]"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
