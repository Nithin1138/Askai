import type { Metadata } from 'next'
import { KnowledgeClient } from './knowledge-client'

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Search and browse your local document library.',
}

export default function KnowledgePage() {
  return <KnowledgeClient />
}
