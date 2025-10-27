'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@calibr/ui'
import { Badge } from '@calibr/ui'
import { Button } from '@calibr/ui'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Download
} from 'lucide-react'

interface SecurityVulnerability {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  recommendation: string
  affectedEndpoint?: string
  cwe?: string
  owasp?: string
  detectedAt: string
  resolved: boolean
  metadata?: Record<string, any>
}

interface SecurityAuditResult {
  timestamp: string
  overallScore: number
  vulnerabilities: SecurityVulnerability[]
  recommendations: string[]
  compliance: {
    owasp: number
    pci: number
    gdpr: number
  }
  summary: {
    totalVulnerabilities: number
    critical: number
    high: number
    medium: number
    low: number
  }
}

export default function SecurityDashboard() {
  const [data, setData] = useState<SecurityAuditResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [runScan, setRunScan] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const base = process.env.NEXT_PUBLIC_API_BASE || ''
      const response = await fetch(`${base}/api/admin/security?includeDetails=true&runScan=${runScan}`)
      if (!response.ok) {
        throw new Error('Failed to fetch security data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const resolveVulnerability = async (vulnerabilityId: string) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || ''
      const response = await fetch(`${base}/api/admin/security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'resolve',
          vulnerabilityId
        })
      })

      if (response.ok) {
        // Refresh data after resolving
        await fetchData()
      }
    } catch (err) {
      console.error('Failed to resolve vulnerability:', err)
    }
  }

  const downloadReport = () => {
    if (!data) return
    
    const report = {
      ...data,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Security Dashboard'
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchData()
  }, [runScan])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-600">Error: {error}</span>
        <Button onClick={fetchData} className="ml-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <p className="text-gray-600">Security audit and vulnerability management</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setRunScan(true)} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Full Scan
          </Button>
          <Button onClick={downloadReport} variant="ghost">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>
                {data.overallScore}
              </div>
              <div className="text-sm text-gray-600">Overall Security Score</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Scan</div>
              <div className="text-sm">{new Date(data.timestamp).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerability Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-red-600">{data.summary.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-600">{data.summary.high}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-yellow-600">{data.summary.medium}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-600">{data.summary.low}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getComplianceColor(data.compliance.owasp)}`}>
                {data.compliance.owasp}%
              </div>
              <div className="text-sm text-gray-600">OWASP Top 10</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getComplianceColor(data.compliance.pci)}`}>
                {data.compliance.pci}%
              </div>
              <div className="text-sm text-gray-600">PCI DSS</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getComplianceColor(data.compliance.gdpr)}`}>
                {data.compliance.gdpr}%
              </div>
              <div className="text-sm text-gray-600">GDPR</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vulnerabilities</span>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.vulnerabilities.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-600">No vulnerabilities found!</p>
              <p className="text-gray-600">Your system appears to be secure.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.vulnerabilities
                .filter(v => !v.resolved)
                .sort((a, b) => {
                  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                  return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
                })
                .map((vulnerability) => (
                <div key={vulnerability.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getSeverityColor(vulnerability.severity)}>
                          {vulnerability.severity.toUpperCase()}
                        </Badge>
                        <span className="font-semibold">{vulnerability.title}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{vulnerability.description}</p>
                      {showDetails && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                          <p className="text-sm text-gray-600">{vulnerability.recommendation}</p>
                          {vulnerability.affectedEndpoint && (
                            <p className="text-sm text-gray-500 mt-1">
                              Affected: {vulnerability.affectedEndpoint}
                            </p>
                          )}
                          {vulnerability.cwe && (
                            <p className="text-sm text-gray-500">
                              CWE: {vulnerability.cwe}
                            </p>
                          )}
                          {vulnerability.owasp && (
                            <p className="text-sm text-gray-500">
                              OWASP: {vulnerability.owasp}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => resolveVulnerability(vulnerability.id)}
                      variant="ghost"
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
