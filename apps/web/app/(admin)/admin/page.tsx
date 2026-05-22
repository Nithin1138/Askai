import type { Metadata } from 'next'
import { AdminDashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

export default function AdminDashboardPage() {
  return <AdminDashboardClient />
}
