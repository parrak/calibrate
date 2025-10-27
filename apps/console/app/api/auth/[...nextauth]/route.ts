import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force Node.js runtime to avoid edge runtime incompatibilities
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// NextAuth v4 route handler
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

