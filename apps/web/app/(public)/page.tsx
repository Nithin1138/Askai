import type { Metadata } from 'next'
import { HomeClient } from './home-client'

export const metadata: Metadata = {
  title: 'Home — ASKAI Local AI Hub',
  description: 'Your private local AI and knowledge infrastructure. No cloud. No internet required.',
}

export default function HomePage() {
  return <HomeClient />
}
