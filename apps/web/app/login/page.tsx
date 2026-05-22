import type { Metadata } from 'next'
import { LoginClient } from './login-client'

export const metadata: Metadata = {
  title: 'Admin Login — ASKAI',
}

export default function LoginPage() {
  return <LoginClient />
}
