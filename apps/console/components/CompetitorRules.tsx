'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../lib/components/Card'
import { Button } from '../lib/components/Button'
import { Badge } from '../lib/components/Badge'
import { Input } from '../lib/components/Input'
import { Label } from '../lib/components/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/components/Select'
import { Switch } from '../lib/components/Switch'
import { Textarea } from '../lib/components/Textarea'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { competitorsApi } from '@/lib/api-client'

interface CompetitorRule {
  id: string
  name: string
  description?: string
  isActive: boolean
  rules: {
    type: 'beat_by_percent' | 'beat_by_amount' | 'match' | 'avoid_race_to_bottom'
    value?: number
    minMargin?: number
    maxPrice?: number
    minPrice?: number
    competitors?: string[]
    channels?: string[]
  }
}

export function CompetitorRules({ projectSlug }: { projectSlug: string }) {
  const [rules, setRules] = useState<CompetitorRule[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  const [newRule, setNewRule] = useState<{
    name: string
    description: string
    type: 'beat_by_percent' | 'beat_by_amount' | 'match' | 'avoid_race_to_bottom'
    value: number
    minMargin: number
    maxPrice: number
    minPrice: number
    isActive: boolean
  }>({
    name: '',
    description: '',
    type: 'beat_by_percent',
    value: 5,
    minMargin: 10,
    maxPrice: 0,
    minPrice: 0,
    isActive: true
  })

  useEffect(() => {
    fetchRules()
  }, [projectSlug])

  const fetchRules = async () => {
    try {
      const data = await competitorsApi.getRules(projectSlug)
      setRules(Array.isArray(data) ? (data as unknown as CompetitorRule[]) : [])
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      // TODO: Implement create rule API endpoint
      console.warn('Create rule not yet implemented in API client')
      setIsCreating(false)
      setNewRule({
        name: '',
        description: '',
        type: 'beat_by_percent',
        value: 5,
        minMargin: 10,
        maxPrice: 0,
        minPrice: 0,
        isActive: true
      })
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  // updateRule function removed - not currently used

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/v1/competitors/rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRules()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'beat_by_percent': return 'Beat by Percentage'
      case 'beat_by_amount': return 'Beat by Amount'
      case 'match': return 'Match Lowest Price'
      case 'avoid_race_to_bottom': return 'Avoid Race to Bottom'
      default: return type
    }
  }

  if (loading) {
    return <div>Loading rules...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Competitor Pricing Rules</h2>
          <p className="text-gray-600 mt-1">
            Configure automated pricing based on competitor data
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Rule
        </Button>
      </div>

      {/* Create Rule Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Rule</CardTitle>
            <CardDescription>
              Define how your prices should respond to competitor changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Beat Competitors by 5%"
                />
              </div>
              <div>
                <Label htmlFor="type">Rule Type</Label>
                <Select
                  value={newRule.type}
                  onValueChange={(value: string) => {
                    if (value === 'beat_by_percent' || value === 'beat_by_amount' || value === 'match' || value === 'avoid_race_to_bottom') {
                      setNewRule({ ...newRule, type: value })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beat_by_percent">Beat by Percentage</SelectItem>
                    <SelectItem value="beat_by_amount">Beat by Amount</SelectItem>
                    <SelectItem value="match">Match Lowest Price</SelectItem>
                    <SelectItem value="avoid_race_to_bottom">Avoid Race to Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Optional description of this rule"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {newRule.type === 'beat_by_percent' && (
                <div>
                  <Label htmlFor="value">Beat by Percentage (%)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newRule.value}
                    onChange={(e) => setNewRule({ ...newRule, value: Number(e.target.value) })}
                    placeholder="5"
                  />
                </div>
              )}
              {newRule.type === 'beat_by_amount' && (
                <div>
                  <Label htmlFor="value">Beat by Amount (cents)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newRule.value}
                    onChange={(e) => setNewRule({ ...newRule, value: Number(e.target.value) })}
                    placeholder="100"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="minMargin">Minimum Margin (%)</Label>
                <Input
                  id="minMargin"
                  type="number"
                  value={newRule.minMargin}
                  onChange={(e) => setNewRule({ ...newRule, minMargin: Number(e.target.value) })}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice">Minimum Price (cents)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={newRule.minPrice}
                  onChange={(e) => setNewRule({ ...newRule, minPrice: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Maximum Price (cents)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={newRule.maxPrice}
                  onChange={(e) => setNewRule({ ...newRule, maxPrice: Number(e.target.value) })}
                  placeholder="0 (no limit)"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newRule.isActive}
                onCheckedChange={(checked) => setNewRule({ ...newRule, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={createRule}>Create Rule</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Rules ({rules.length})</CardTitle>
          <CardDescription>
            Manage your competitor-based pricing rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No pricing rules configured. Create your first rule to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{getRuleTypeLabel(rule.rules.type)}</span>
                      {rule.rules.value && <span>Value: {rule.rules.value}</span>}
                      {rule.rules.minMargin && <span>Min Margin: {rule.rules.minMargin}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log('Edit rule:', rule)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
