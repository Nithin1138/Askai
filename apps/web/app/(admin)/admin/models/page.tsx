import type { Metadata } from 'next'
import { ModelsClient } from './models-client'

export const metadata: Metadata = { title: 'Models — Admin' }

export default function ModelsPage() {
  return <ModelsClient />
}
