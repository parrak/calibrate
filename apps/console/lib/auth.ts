/**
 * NextAuth Configuration
 *
 * Simple email-based authentication for Calibrate Console
 */

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@calibr/db'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
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

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        })

        if (!user) {
          // Create demo user with demo tenant
          const tenant = await prisma.tenant.upsert({
            where: { id: 'demo-tenant' },
            create: {
              id: 'demo-tenant',
              name: 'Demo Company',
            },
            update: {},
          })

          user = await prisma.user.create({
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})
