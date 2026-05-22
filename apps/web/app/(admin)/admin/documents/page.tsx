import type { Metadata } from 'next'
import { DocumentsClient } from './documents-client'

export const metadata: Metadata = { title: 'Documents — Admin' }

export default function DocumentsPage() {
  return <DocumentsClient />
}
