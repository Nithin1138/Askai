import type { NextConfig } from 'next'
import os from 'os'

function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces()
  const ips: string[] = []
  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name]
    if (netInterface) {
      for (const net of netInterface) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address)
        }
      }
    }
  }
  return ips
}

const nextConfig: NextConfig = {
  // Allow binding to 0.0.0.0 for LAN access
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  // @ts-ignore - Dev-only setting for cross-origin HMR support on local network
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    ...getLocalIPs(),
  ],
  turbopack: {},
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
