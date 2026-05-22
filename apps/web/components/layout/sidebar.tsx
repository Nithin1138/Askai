'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  BookOpen,
  GraduationCap,
  Home,
  Settings,
  LayoutDashboard,
  ChevronRight,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  exact?: boolean
}

const publicNav: NavItem[] = [
  { href: '/', icon: Home, label: 'Home', exact: true },
  { href: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/knowledge', icon: BookOpen, label: 'Knowledge' },
  { href: '/learn', icon: GraduationCap, label: 'Learn' },
]

const adminNav: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/documents', icon: BookOpen, label: 'Documents' },
  { href: '/admin/models', icon: Cpu, label: 'Models' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  isAdmin?: boolean
  className?: string
}

export function Sidebar({ isAdmin = false, className }: SidebarProps) {
  const pathname = usePathname()
  const navItems = isAdmin ? adminNav : publicNav

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-60 border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))]',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[hsl(var(--sidebar-border))]">
        <div className="h-7 w-7 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold tracking-tight">AI</span>
        </div>
        <span className="font-semibold text-[hsl(var(--foreground))] tracking-tight">
          ASKAI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!isAdmin && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-2 mb-2">
            Navigation
          </p>
        )}
        {isAdmin && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-2 mb-2">
            Admin
          </p>
        )}
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 group',
                  isActive
                    ? 'bg-[hsl(var(--sidebar-item-active))] text-[hsl(var(--sidebar-item-active-foreground))] font-medium'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--sidebar-item-hover))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId={isAdmin ? 'admin-indicator' : 'nav-indicator'}
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

      {/* Bottom section */}
      <div className="px-3 pb-4 border-t border-[hsl(var(--sidebar-border))] pt-3">
        {isAdmin ? (
          <Link href="/">
            <span className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--sidebar-item-hover))] hover:text-[hsl(var(--foreground))] transition-colors duration-150">
              <Home className="h-4 w-4" />
              Back to App
            </span>
          </Link>
        ) : (
          <Link href="/admin">
            <span className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--sidebar-item-hover))] hover:text-[hsl(var(--foreground))] transition-colors duration-150">
              <Settings className="h-4 w-4" />
              Admin
            </span>
          </Link>
        )}
      </div>
    </aside>
  )
}
