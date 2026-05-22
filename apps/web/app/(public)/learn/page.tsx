import type { Metadata } from 'next'
import { LearnClient } from './learn-client'

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Access offline learning content via Kolibri and educational resources.',
}

export default function LearnPage() {
  return <LearnClient />
}
