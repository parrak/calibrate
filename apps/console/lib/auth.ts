/**
 * NextAuth Configuration
 *
 * Simple email-based authentication for Calibrate Console
 */

import NextAuth, { NextAuthOptions } from 'next-auth'
import { getServerSession as getServerSessionHelper } from 'next-auth'
import { prisma } from '@calibr/db'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'you@example.com',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== 'string') {
          return null
        }

        // For demo purposes, allow any email
        // In production, verify password or send magic link
        const email = credentials.email.toLowerCase()
        const db = prisma()

        // Find or create user
        let user = await db.user.findUnique({
          where: { email },
          include: { tenant: true },
        })

        if (!user) {
          // Create demo user with demo tenant
          const tenant = await db.tenant.upsert({
            where: { id: 'demo-tenant' },
            create: {
              id: 'demo-tenant',
              name: 'Demo Company',
            },
            update: {},
          })

          user = await db.user.create({
            data: {
              email,
              name: email.split('@')[0],
              role: 'ADMIN',
              tenantId: tenant.id,
            },
            include: { tenant: true },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        // Bootstrap API session token for console → API calls
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE_URL
          const internal = process.env.CONSOLE_INTERNAL_TOKEN
          if (apiBase && internal) {
            const res = await fetch(`${apiBase}/api/auth/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-console-auth': internal },
              body: JSON.stringify({ userId: token.sub, roles: [user.role] }),
            })
            if (res.ok) {
              const data = await res.json()
              token.apiToken = data.token
            }
          }
        } catch {
          // ignore; API token optional
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.apiToken = token.apiToken
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export default handler

// Export helper to get session on server
// In NextAuth v4, getServerSession is imported from next-auth/next
export async function getServerSession(options?: NextAuthOptions) {
  return await getServerSessionHelper(options || authOptions)
}

// For use in server components: await getServerSession()
