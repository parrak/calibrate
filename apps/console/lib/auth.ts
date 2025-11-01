/**
 * NextAuth Configuration
 *
 * Simple email-based authentication for Calibrate Console
 */

import NextAuth, { NextAuthOptions } from 'next-auth'
import { getServerSession as getServerSessionHelper } from 'next-auth'
import { prisma } from '@calibr/db'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

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
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password
        const db = prisma()

        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValidPassword = await compare(password, user.passwordHash)
        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
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
        ;(token as any).tenantId = (user as any).tenantId
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE_URL
          const internal = process.env.CONSOLE_INTERNAL_TOKEN
          if (apiBase && internal && token.sub) {
            const tenantId = (user as any).tenantId
            const roleLower =
              typeof user.role === 'string' ? user.role.toLowerCase() : undefined
            const roles = Array.from(new Set([user.role, roleLower].filter(Boolean)))
            const res = await fetch(`${apiBase}/api/auth/session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-console-auth': internal },
              body: JSON.stringify({ userId: token.sub, roles, tenantId }),
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
        session.user.tenantId = (token as any).tenantId as string | undefined
        session.apiToken = (token as any).apiToken as string | undefined
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
