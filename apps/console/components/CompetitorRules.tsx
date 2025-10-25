'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calibrate/ui/components/card'
import { Button } from '@calibrate/ui/components/button'
import { Badge } from '@calibrate/ui/components/badge'
import { Input } from '@calibrate/ui/components/input'
import { Label } from '@calibrate/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@calibrate/ui/components/select'
import { Switch } from '@calibrate/ui/components/switch'
import { Textarea } from '@calibrate/ui/components/textarea'
import { Plus, Edit, Trash2, Play } from 'lucide-react'

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

export function CompetitorRules({ tenantId, projectId }: { tenantId: string; projectId: string }) {
  const [rules, setRules] = useState<CompetitorRule[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingRule, setEditingRule] = useState<CompetitorRule | null>(null)
  const [loading, setLoading] = useState(true)

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    type: 'beat_by_percent' as const,
    value: 5,
    minMargin: 10,
    maxPrice: 0,
    minPrice: 0,
    isActive: true
  })

  useEffect(() => {
    fetchRules()
  }, [tenantId, projectId])

  const fetchRules = async () => {
    try {
      const response = await fetch(`/api/v1/competitors/rules?tenantId=${tenantId}&projectId=${projectId}`)
      const data = await response.json()
      setRules(data.rules || [])
    } catch (error) {
      console.error('Error fetching rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRule = async () => {
    try {
      const response = await fetch('/api/v1/competitors/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          projectId,
          name: newRule.name,
          description: newRule.description,
          rules: {
            type: newRule.type,
            value: newRule.value,
            minMargin: newRule.minMargin,
            maxPrice: newRule.maxPrice || undefined,
            minPrice: newRule.minPrice || undefined
          }
        })
      })

      if (response.ok) {
        await fetchRules()
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
      }
    } catch (error) {
      console.error('Error creating rule:', error)
    }
  }

  const updateRule = async (rule: CompetitorRule) => {
    try {
      const response = await fetch(`/api/v1/competitors/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      })

      if (response.ok) {
        await fetchRules()
        setEditingRule(null)
      }
    } catch (error) {
      console.error('Error updating rule:', error)
    }
  }

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
          <h2 className="text-2xl font-bold">Competitor Pricing Rules</h2>
          <p className="text-muted-foreground">
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
                  onValueChange={(value: any) => setNewRule({ ...newRule, type: value })}
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
            <div className="text-center py-8 text-muted-foreground">
              No pricing rules configured. Create your first rule to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{getRuleTypeLabel(rule.rules.type)}</span>
                      {rule.rules.value && <span>Value: {rule.rules.value}</span>}
                      {rule.rules.minMargin && <span>Min Margin: {rule.rules.minMargin}%</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
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
