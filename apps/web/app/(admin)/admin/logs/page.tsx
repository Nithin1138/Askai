import type { Metadata } from 'next'
import { LogsClient } from './logs-client'

export const metadata: Metadata = { title: 'System Logs — Admin' }

export default function LogsPage() {
  return <LogsClient />
}
