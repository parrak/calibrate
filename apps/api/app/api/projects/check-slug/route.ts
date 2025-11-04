import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { prisma } from '@calibr/db'

/**
 * Check Project Slug Availability
 * Used during onboarding to validate slug availability in real-time
 */

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { available: false, error: 'Invalid slug format (lowercase alphanumeric + hyphens only)' },
        { status: 200 }
      )
    }

    const db = prisma()

    // Check if slug exists
    const existingProject = await db.project.findUnique({
      where: { slug },
      select: { id: true },
    })

    return NextResponse.json({
      available: !existingProject,
      slug,
    })
  } catch (error: unknown) {
    console.error('Error checking slug availability:', error)
    return NextResponse.json(
      { error: 'Failed to check slug availability', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
