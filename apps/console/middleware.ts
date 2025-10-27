/**
 * Middleware for authentication
 *
 * Protects routes and redirects to login if not authenticated
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Get token to check authentication
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  })

  // If authenticated and trying to access login page, redirect to home
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
