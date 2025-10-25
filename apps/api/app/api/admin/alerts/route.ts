import { NextRequest, NextResponse } from 'next/server'
import { performanceService } from '@/lib/performance-service'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || undefined
    const includeResolved = url.searchParams.get('includeResolved') === 'true'
    
    let alerts
    if (type) {
      alerts = performanceService.getAlertsByType(type)
    } else {
      alerts = performanceService.getActiveAlerts()
    }
    
    if (!includeResolved) {
      alerts = alerts.filter(alert => !alert.resolved)
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      alerts,
      count: alerts.length
    })
  } catch (error) {
    console.error('Failed to get alerts:', error)
    return NextResponse.json({
      error: 'Failed to get alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, alertId, thresholds } = await req.json()
    
    if (action === 'resolve' && alertId) {
      const resolved = performanceService.resolveAlert(alertId)
      return NextResponse.json({
        success: resolved,
        message: resolved ? 'Alert resolved' : 'Alert not found'
      })
    }
    
    if (action === 'updateThresholds' && thresholds) {
      performanceService.updateThresholds(thresholds)
      return NextResponse.json({
        success: true,
        message: 'Thresholds updated',
        thresholds: performanceService.getThresholds()
      })
    }
    
    if (action === 'check') {
      const newAlerts = await performanceService.checkPerformance()
      return NextResponse.json({
        success: true,
        message: 'Performance check completed',
        newAlerts,
        count: newAlerts.length
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      message: 'Supported actions: resolve, updateThresholds, check'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Failed to process alert action:', error)
    return NextResponse.json({
      error: 'Failed to process alert action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
