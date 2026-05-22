import { NextRequest, NextResponse } from 'next/server'
import { getKolibriStatus } from '@/lib/kolibri'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const status = await getKolibriStatus()
  
  // Clone status to prevent mutating cached _lastCheck
  const responseStatus = { ...status }
  
  const hostHeader = req.headers.get('host')
  if (hostHeader && responseStatus.url) {
    const clientHost = hostHeader.split(':')[0]
    if (clientHost && clientHost !== 'localhost' && clientHost !== '127.0.0.1') {
      try {
        const urlObj = new URL(responseStatus.url)
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
          urlObj.hostname = clientHost
          responseStatus.url = urlObj.toString().replace(/\/$/, '')
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
  }

  return NextResponse.json(responseStatus)
}

