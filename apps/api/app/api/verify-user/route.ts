import { NextResponse } from 'next/server'
import { prisma } from '@calibr/db'

/**
 * Verification endpoint to check if:
 * 1. passwordHash column exists
 * 2. User admin@calibr.lat exists and has passwordHash
 */
export async function GET() {
  try {
    const db = prisma()
    
    // Check if passwordHash column exists by trying to query it
    let columnExists = false
    let userHasPassword = false
    let userExists = false
    
    try {
      // Try to query passwordHash - if column doesn't exist, this will fail
      const user = await db.user.findUnique({
        where: { email: 'admin@calibr.lat' },
        select: {
          id: true,
          email: true,
          passwordHash: true,
        },
      })
      
      userExists = !!user
      columnExists = true // If we got here, column exists
      userHasPassword = !!user?.passwordHash
      
      return NextResponse.json({
        success: true,
        checks: {
          passwordHashColumnExists: columnExists,
          userExists: userExists,
          userHasPassword: userHasPassword,
        },
        user: userExists ? {
          email: user?.email,
          hasPassword: userHasPassword,
        } : null,
        message: userExists
          ? userHasPassword
            ? '✅ User exists and has password'
            : '⚠️ User exists but has no passwordHash'
          : '❌ User does not exist',
      })
    } catch (error: any) {
      // If query failed, column probably doesn't exist
      if (error.message?.includes('passwordHash') || error.message?.includes('column')) {
        columnExists = false
        return NextResponse.json({
          success: false,
          checks: {
            passwordHashColumnExists: false,
            userExists: false,
            userHasPassword: false,
          },
          message: '❌ passwordHash column does not exist - migration not applied',
          error: error.message,
        }, { status: 500 })
      }
      throw error
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

