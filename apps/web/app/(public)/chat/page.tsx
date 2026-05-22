import type { Metadata } from 'next'
import { ChatClient } from './chat-client'

export const metadata: Metadata = {
  title: 'AI Chat',
  description: 'Chat with your local AI model. Completely private, runs on-device.',
}

export default function ChatPage() {
  return <ChatClient />
}
