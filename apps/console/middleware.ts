/**
 * Middleware for authentication
 *
 * Protects routes and redirects to login if not authenticated
 */

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl

    // If authenticated and trying to access login page
    if (req.nextauth.token && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl

        // Public paths that don't require authentication
        const publicPaths = ['/login', '/api/auth']
        const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

        // Allow public paths
        if (isPublicPath) return true

        // Require token for all other paths
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
