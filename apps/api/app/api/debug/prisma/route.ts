import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Test 1: Can we import the package?
    let importTest = 'FAILED'
    let prismaFunction: (() => unknown) | undefined = undefined

    try {
      const dbPackage = await import('@calibr/db')
      prismaFunction = dbPackage.prisma
      importTest = prismaFunction ? 'SUCCESS' : 'IMPORTED_BUT_UNDEFINED'
    } catch (e) {
      importTest = `IMPORT_ERROR: ${e instanceof Error ? e.message : String(e)}`
    }

    // Test 2: Can we call prisma()?
    let prismaCallTest = 'NOT_ATTEMPTED'
    let clientInfo: { hasProject?: boolean; hasUser?: boolean; keys?: string[] } = {}
    let dbConnectionTest = 'NOT_ATTEMPTED'

    if (prismaFunction) {
      try {
        const client = prismaFunction()
        prismaCallTest = client ? 'SUCCESS' : 'RETURNED_UNDEFINED'
        if (client) {
          const clientObj = client as Record<string, unknown>
          clientInfo = {
            hasProject: !!clientObj.project,
            hasUser: !!clientObj.user,
            keys: Object.keys(clientObj).filter(k => !k.startsWith('_') && !k.startsWith('$')).slice(0, 10)
          }

          // Test 2b: Try to actually query the database
          try {
            await client.$queryRaw`SELECT 1 as test`
            dbConnectionTest = 'SUCCESS'
          } catch (e) {
            dbConnectionTest = `QUERY_ERROR: ${e instanceof Error ? e.message : String(e)}`
          }
        }
      } catch (e) {
        prismaCallTest = `CALL_ERROR: ${e instanceof Error ? e.message : String(e)}`
      }
    }

    // Test 3: Check environment
    const dbUrl = process.env.DATABASE_URL
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: dbUrl ? 'SET' : 'NOT_SET',
      DATABASE_URL_PREFIX: dbUrl ? dbUrl.substring(0, 15) : 'N/A',
      DATABASE_URL_LENGTH: dbUrl ? dbUrl.length : 0,
      hasPrismaClient: typeof (globalThis as Record<string, unknown>).prisma !== 'undefined',
      allEnvKeys: Object.keys(process.env).filter(k =>
        k.includes('DATABASE') || k.includes('PRISMA') || k === 'NODE_ENV' || k === 'PORT'
      )
    }

    const response = NextResponse.json({
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
      tests: {
        import: importTest,
        call: prismaCallTest,
        dbConnection: dbConnectionTest
      },
      clientInfo,
      envInfo
    })

    // Disable all caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
