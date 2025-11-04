/**
 * JSON Serialization Test Utility
 *
 * This utility helps detect BigInt serialization issues before deployment
 * Run this as part of your pre-commit hooks and CI/CD pipeline
 */

import { NextRequest, NextResponse } from 'next/server'

export interface SerializationTestResult {
  endpoint: string
  success: boolean
  error?: string
  hasBigInt?: boolean
  responseTime: number
}

/**
 * Test JSON serialization for all API endpoints
 */
export async function testJsonSerialization(): Promise<SerializationTestResult[]> {
  const results: SerializationTestResult[] = []
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'

  const endpoints = [
    '/api/health',
    '/api/metrics?project=demo',
    '/api/admin/dashboard?project=demo',
    '/api/v1/price-changes?project=demo',
    '/api/v1/catalog?project=demo',
    '/api/v1/catalog?project=demo&productCode=PRO'
  ]

  for (const endpoint of endpoints) {
    const startTime = Date.now()
    const result: SerializationTestResult = {
      endpoint,
      success: false,
      responseTime: 0
    }

    try {
      // Create a mock request
      const url = new URL(endpoint, baseUrl)
      const request = new NextRequest(url.toString())

      // Test the endpoint
      let response: NextResponse

      switch (endpoint) {
        case '/api/health':
          response = await testHealthEndpoint()
          break
        case '/api/metrics?project=demo':
          response = await testMetricsEndpoint(request)
          break
        case '/api/admin/dashboard?project=demo':
          response = await testAdminDashboardEndpoint(request)
          break
        case '/api/v1/price-changes?project=demo':
          response = await testPriceChangesEndpoint(request)
          break
        case '/api/v1/catalog?project=demo':
          response = await testCatalogEndpoint(request)
          break
        case '/api/v1/catalog?project=demo&productCode=PRO':
          response = await testCatalogSingleEndpoint(request)
          break
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`)
      }

      // Test JSON serialization
      const jsonString = JSON.stringify(await response.json())

      // Check for BigInt serialization issues
      result.hasBigInt = jsonString.includes('"connections":') &&
                        !jsonString.match(/"connections":\s*\d+/)

      result.success = response.status === 200 && !result.hasBigInt
      result.responseTime = Date.now() - startTime

      if (!result.success) {
        result.error = result.hasBigInt ? 'BigInt serialization detected' : 'HTTP error'
      }

    } catch (error) {
      result.success = false
      result.error = error instanceof Error ? error.message : 'Unknown error'
      result.responseTime = Date.now() - startTime
    }

    results.push(result)
  }

  return results
}

/**
 * Test individual endpoints (these would be imported from actual route handlers)
 */
async function testHealthEndpoint(): Promise<NextResponse> {
  // Import and test the actual health endpoint
  const { GET } = await import('../app/api/health/route')
  return await GET()
}

async function testMetricsEndpoint(req: NextRequest): Promise<NextResponse> {
  const { GET } = await import('../app/api/metrics/route')
  return await GET(req)
}

async function testAdminDashboardEndpoint(req: NextRequest): Promise<NextResponse> {
  const { GET } = await import('../app/api/admin/dashboard/route')
  return await GET(req)
}

async function testPriceChangesEndpoint(req: NextRequest): Promise<NextResponse> {
  const { GET } = await import('../app/api/v1/price-changes/route')
  return await GET(req)
}

async function testCatalogEndpoint(req: NextRequest): Promise<NextResponse> {
  const { GET } = await import('../app/api/v1/catalog/route')
  return await GET(req)
}

async function testCatalogSingleEndpoint(req: NextRequest): Promise<NextResponse> {
  const { GET } = await import('../app/api/v1/catalog/route')
  return await GET(req)
}

/**
 * Validate that a value can be safely serialized to JSON
 */
export function validateJsonSerialization(value: unknown): boolean {
  try {
    const jsonString = JSON.stringify(value)
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

/**
 * Convert BigInt values to numbers in an object
 */
export function convertBigIntToNumber(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return Number(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToNumber)
  }

  if (typeof obj === 'object' && obj !== null) {
    const converted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value)
    }
    return converted
  }

  return obj
}

/**
 * Safe JSON response helper that converts BigInt values
 */
export function safeJsonResponse(data: unknown, status: number = 200): NextResponse {
  const convertedData = convertBigIntToNumber(data)
  return NextResponse.json(convertedData, { status })
}

/**
 * Run serialization tests and return formatted results
 */
export async function runSerializationTests(): Promise<string> {
  const results = await testJsonSerialization()

  let output = 'JSON Serialization Test Results\n'
  output += '================================\n\n'

  let allPassed = true

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    const time = `${result.responseTime}ms`

    output += `${status} ${result.endpoint} (${time})\n`

    if (!result.success) {
      allPassed = false
      output += `   Error: ${result.error}\n`
    }

    if (result.hasBigInt) {
      output += `   Warning: Potential BigInt serialization issue\n`
    }
  }

  output += `\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`

  return output
}

// CLI usage
if (require.main === module) {
  runSerializationTests().then(console.log).catch(console.error)
}
