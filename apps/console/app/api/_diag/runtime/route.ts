/**
 * Diagnostic endpoint to verify runtime configuration
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    runtime: process.env.NEXT_RUNTIME || 'node',
    nodeVersion: process.version,
    platform: process.platform,
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasAuthUrl: !!process.env.AUTH_URL,
      hasApiBase: !!process.env.NEXT_PUBLIC_API_BASE,
      hasConsoleToken: !!process.env.CONSOLE_INTERNAL_TOKEN,
    },
    timestamp: new Date().toISOString(),
  })
}
