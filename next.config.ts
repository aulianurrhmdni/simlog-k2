import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.24.192.1', '*.local', '192.168.*.*', '10.*.*.*', '172.16.*.*'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
