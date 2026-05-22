/**
 * Kolibri Integration Service
 * Handles health checks, URL management, and launch configuration
 */

import { getSetting } from '../db/migrations'

export interface KolibriStatus {
  available: boolean
  url: string
  version?: string
  checkedAt: string
}

let _lastCheck: KolibriStatus | null = null
let _lastCheckTime = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

export async function getKolibriStatus(): Promise<KolibriStatus> {
  const now = Date.now()

  // Return cached result within TTL
  if (_lastCheck && now - _lastCheckTime < CACHE_TTL_MS) {
    return _lastCheck
  }

  let dbUrl: string | null = null
  try {
    dbUrl = getSetting('kolibri_url')
  } catch (e) {
    console.error('Failed to load kolibri_url setting from database:', e)
  }

  const kolibriUrl = dbUrl ?? process.env.KOLIBRI_BASE_URL ?? 'http://localhost:8080'

  try {
    const res = await fetch(`${kolibriUrl}/api/public/v1/info/`, {
      signal: AbortSignal.timeout(3000),
      headers: { Accept: 'application/json' },
    })

    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      _lastCheck = {
        available: true,
        url: kolibriUrl,
        version: data.version,
        checkedAt: new Date().toISOString(),
      }
    } else {
      _lastCheck = {
        available: false,
        url: kolibriUrl,
        checkedAt: new Date().toISOString(),
      }
    }
  } catch {
    _lastCheck = {
      available: false,
      url: kolibriUrl,
      checkedAt: new Date().toISOString(),
    }
  }

  _lastCheckTime = now
  return _lastCheck
}

export function getKolibriLaunchUrl(path = '/'): string {
  let dbUrl: string | null = null
  try {
    dbUrl = getSetting('kolibri_url')
  } catch {
    // Ignore error
  }
  const base = dbUrl ?? process.env.KOLIBRI_BASE_URL ?? 'http://localhost:8080'
  return `${base}${path}`
}

