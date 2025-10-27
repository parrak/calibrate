import { handlers } from '@/lib/auth'

// Force Node.js runtime to avoid edge runtime incompatibilities
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// NextAuth route handlers
export const { GET, POST } = handlers

