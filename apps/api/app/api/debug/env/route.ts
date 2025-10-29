import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Check if .env file exists and read it
    const envPath = join(process.cwd(), '.env')
    const envExists = existsSync(envPath)
    let envFileContent = 'FILE_NOT_FOUND'

    if (envExists) {
      try {
        const content = readFileSync(envPath, 'utf-8')
        envFileContent = content.split('\n').map(line => {
          if (line.includes('DATABASE_URL=')) {
            const parts = line.split('=')
            return `DATABASE_URL=${parts[1]?.substring(0, 20)}...`
          }
          return line
        }).join('\n')
      } catch (e) {
        envFileContent = `READ_ERROR: ${e instanceof Error ? e.message : String(e)}`
      }
    }

    const response = NextResponse.json({
      timestamp: new Date().toISOString(),
      cwd: process.cwd(),
      envFile: {
        exists: envExists,
        path: envPath,
        content: envFileContent
      },
      processEnv: {
        DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV,
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
        HOME: process.env.HOME,
        allKeys: Object.keys(process.env).filter(k =>
          k.includes('DATABASE') || k.includes('RAILWAY') || k.includes('PRISMA')
        )
      }
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
