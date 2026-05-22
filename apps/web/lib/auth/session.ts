import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export interface SessionData {
  isAdmin: boolean
  adminId?: number
  username?: string
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? 'change-this-secret-in-production-min-32-chars',
  cookieName: 'askai_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession(cookieStore?: ReadonlyRequestCookies) {
  const store = cookieStore ?? (await cookies())
  return getIronSession<SessionData>(store, SESSION_OPTIONS)
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) {
    throw new Error('Unauthorized')
  }
  return session
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && error.message === 'Unauthorized'
}
