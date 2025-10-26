/**
 * Middleware for authentication
 *
 * Protects routes and redirects to login if not authenticated
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth']

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // If not authenticated and trying to access protected route
  if (!req.auth && !isPublicPath) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login page
  if (req.auth && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
