import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // Test 1: Can we import the package?
    let importTest = 'FAILED'
    let prismaFunction: any = undefined

    try {
      const dbPackage = await import('@calibr/db')
      prismaFunction = dbPackage.prisma
      importTest = prismaFunction ? 'SUCCESS' : 'IMPORTED_BUT_UNDEFINED'
    } catch (e) {
      importTest = `IMPORT_ERROR: ${e instanceof Error ? e.message : String(e)}`
    }

    // Test 2: Can we call prisma()?
    let prismaCallTest = 'NOT_ATTEMPTED'
    let clientInfo: any = {}

    if (prismaFunction) {
      try {
        const client = prismaFunction()
        prismaCallTest = client ? 'SUCCESS' : 'RETURNED_UNDEFINED'
        if (client) {
          clientInfo = {
            hasProject: !!(client as any).project,
            hasUser: !!(client as any).user,
            keys: Object.keys(client).filter(k => !k.startsWith('_') && !k.startsWith('$')).slice(0, 10)
          }
        }
      } catch (e) {
        prismaCallTest = `CALL_ERROR: ${e instanceof Error ? e.message : String(e)}`
      }
    }

    // Test 3: Check environment
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      hasPrismaClient: typeof (globalThis as any).prisma !== 'undefined'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tests: {
        import: importTest,
        call: prismaCallTest
      },
      clientInfo,
      envInfo
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
