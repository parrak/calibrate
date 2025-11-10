'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button, Card, Input, Badge, EmptyState } from '@/lib/components'
import { Plus, Trash2, Play, Save } from 'lucide-react'

type SelectorPredicate =
  | { type: 'all' }
  | { type: 'sku'; skuCodes: string[] }
  | { type: 'tag'; tags: string[] }
  | { type: 'priceRange'; min?: number; max?: number; currency?: string }
  | { type: 'custom'; field: string; operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'; value: unknown }

type Selector = {
  predicates: SelectorPredicate[]
  operator?: 'AND' | 'OR'
}

type Transform =
  | { type: 'percentage'; value: number }
  | { type: 'absolute'; value: number }
  | { type: 'set'; value: number }
  | { type: 'multiply'; factor: number }

type TransformConstraints = {
  floor?: number
  ceiling?: number
  maxPctDelta?: number
}

type TransformDefinition = {
  transform: Transform
  constraints?: TransformConstraints
}

type Schedule = {
  type: 'immediate' | 'scheduled' | 'recurring'
  scheduledAt?: Date
  cron?: string
  timezone?: string
}

type PricingRule = {
  id?: string
  name: string
  description?: string
  selector: Selector
  transform: TransformDefinition
  schedule?: Schedule
  enabled?: boolean
}

type RuleFormData = {
  name: string
  description: string
  enabled: boolean
  selector: {
    predicates: SelectorPredicate[]
    operator: 'AND' | 'OR'
  }
  transform: {
    type: 'percentage' | 'absolute' | 'set' | 'multiply'
    value?: number
    factor?: number
  }
  constraints: TransformConstraints
  schedule: {
    type: 'immediate' | 'scheduled' | 'recurring'
    scheduledAt?: string
    cron?: string
    timezone?: string
  }
}

const DEFAULT_RULE: RuleFormData = {
  name: '',
  description: '',
  enabled: true,
  selector: {
    predicates: [],
    operator: 'AND',
  },
  transform: {
    type: 'percentage',
    value: 0,
  },
  constraints: {},
  schedule: {
    type: 'immediate',
  },
}

type PreviewResults = {
  matchedProducts: number
  totalPriceChanges: number
  averageChange: number
}

export default function RulesPage({ params }: { params: { slug: string } }) {
  const { data: _session } = useSession()

  const [rules, setRules] = useState<PricingRule[]>([])
  const [editingRule, setEditingRule] = useState<RuleFormData | null>(null)
  const [previewResults, setPreviewResults] = useState<PreviewResults | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch pricing rules when component mounts or slug changes
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true)
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.calibr.lat'
        const response = await fetch(`${API_BASE}/api/v1/rules?project=${params.slug}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch rules: ${response.status}`)
        }

        const data = await response.json()

        // Transform API response to local format
        const transformedRules: PricingRule[] = (data.items || []).map((item: {
          id: string
          name: string
          description: string | null
          enabled: boolean
          selectorJson: Selector
          transformJson: TransformDefinition
          scheduleAt: string | null
        }) => ({
          id: item.id,
          name: item.name,
          description: item.description || undefined,
          enabled: item.enabled,
          selector: item.selectorJson,
          transform: item.transformJson,
          schedule: item.scheduleAt
            ? { type: 'scheduled' as const, scheduledAt: new Date(item.scheduleAt) }
            : { type: 'immediate' as const },
        }))

        setRules(transformedRules)
      } catch (err) {
        console.error('Failed to fetch pricing rules:', err)
        setToastMessage({
          msg: 'Failed to load pricing rules',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [params.slug])

  const startNewRule = () => {
    setEditingRule({ ...DEFAULT_RULE })
    setIsPreviewMode(false)
  }

  const addPredicate = (type: SelectorPredicate['type']) => {
    if (!editingRule) return

    let newPredicate: SelectorPredicate

    switch (type) {
      case 'all':
        newPredicate = { type: 'all' }
        break
      case 'sku':
        newPredicate = { type: 'sku', skuCodes: [] }
        break
      case 'tag':
        newPredicate = { type: 'tag', tags: [] }
        break
      case 'priceRange':
        newPredicate = { type: 'priceRange' }
        break
      case 'custom':
        newPredicate = { type: 'custom', field: '', operator: 'eq', value: '' }
        break
      default:
        return
    }

    setEditingRule({
      ...editingRule,
      selector: {
        ...editingRule.selector,
        predicates: [...editingRule.selector.predicates, newPredicate],
      },
    })
  }

  const removePredicate = (index: number) => {
    if (!editingRule) return
    setEditingRule({
      ...editingRule,
      selector: {
        ...editingRule.selector,
        predicates: editingRule.selector.predicates.filter((_, i) => i !== index),
      },
    })
  }

  const updatePredicate = (index: number, updates: Partial<SelectorPredicate>) => {
    if (!editingRule) return
    setEditingRule({
      ...editingRule,
      selector: {
        ...editingRule.selector,
        predicates: editingRule.selector.predicates.map((pred, i) =>
          i === index ? ({ ...pred, ...updates } as SelectorPredicate) : pred
        ),
      },
    })
  }

  const handlePreview = async () => {
    if (!editingRule) return

    try {
      // Mock preview for now - will integrate with API
      setToastMessage({ msg: 'Preview functionality coming soon!', type: 'info' })
      setIsPreviewMode(true)
      setPreviewResults({
        matchedProducts: 5,
        totalPriceChanges: 12,
        averageChange: 8.5,
      })
    } catch (_err) {
      setToastMessage({ msg: 'Failed to preview rule', type: 'error' })
    }
  }

  const handleSave = async () => {
    if (!editingRule) return

    if (!editingRule.name.trim()) {
      setToastMessage({ msg: 'Please enter a rule name', type: 'error' })
      return
    }

    try {
      // Create the rule object from form data
      const newRule: PricingRule = {
        id: `rule-${Date.now()}`, // Generate temporary ID
        name: editingRule.name,
        description: editingRule.description,
        enabled: editingRule.enabled,
        selector: editingRule.selector,
        transform: {
          transform: editingRule.transform.type === 'multiply'
            ? { type: editingRule.transform.type, factor: editingRule.transform.factor || 1 }
            : { type: editingRule.transform.type, value: editingRule.transform.value || 0 },
          constraints: editingRule.constraints
        },
        schedule: editingRule.schedule.type === 'scheduled'
          ? { type: 'scheduled', scheduledAt: editingRule.schedule.scheduledAt ? new Date(editingRule.schedule.scheduledAt) : undefined }
          : editingRule.schedule.type === 'recurring'
          ? { type: 'recurring', cron: editingRule.schedule.cron, timezone: editingRule.schedule.timezone }
          : { type: 'immediate' }
      }

      // Add the new rule to the rules list
      setRules([...rules, newRule])

      // TODO: Save to API when backend is ready
      setToastMessage({ msg: 'Rule saved successfully!', type: 'success' })
      setEditingRule(null)
      setIsPreviewMode(false)
    } catch (_err) {
      setToastMessage({ msg: 'Failed to save rule', type: 'error' })
    }
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId))
    setToastMessage({ msg: 'Rule deleted successfully', type: 'success' })
  }

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ))
  }

  return (
    <main className="p-6 space-y-6">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg ${
            toastMessage.type === 'success'
              ? 'bg-green-600 text-white'
              : toastMessage.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage automated pricing rules
          </p>
        </div>
        <Button onClick={startNewRule} disabled={!!editingRule}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Rule Editor */}
      {editingRule && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingRule.name || 'New Pricing Rule'}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handlePreview}>
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Rule
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rule Name</label>
              <Input
                type="text"
                value={editingRule.name}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, name: e.target.value })
                }
                placeholder="e.g., Summer Sale - 20% Off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                type="text"
                value={editingRule.description}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={editingRule.enabled}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, enabled: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                Enable this rule
              </label>
            </div>
          </div>

          {/* Selector Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold">Product Selector</h3>
              <div className="flex gap-2">
                <select
                  value={editingRule.selector.operator}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      selector: {
                        ...editingRule.selector,
                        operator: e.target.value as 'AND' | 'OR',
                      },
                    })
                  }
                  className="px-3 py-1 border border-border rounded-md text-sm"
                >
                  <option value="AND">Match ALL conditions</option>
                  <option value="OR">Match ANY condition</option>
                </select>
              </div>
            </div>

            {editingRule.selector.predicates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No selection criteria defined. Add conditions below.
              </div>
            ) : (
              <div className="space-y-3">
                {editingRule.selector.predicates.map((pred, idx) => (
                  <Card key={idx} className="p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{pred.type}</Badge>
                        </div>

                        {/* SKU selector */}
                        {pred.type === 'sku' && (
                          <Input
                            type="text"
                            placeholder="Enter SKU codes (comma-separated)"
                            value={(pred.skuCodes || []).join(', ')}
                            onChange={(e) =>
                              updatePredicate(idx, {
                                skuCodes: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        )}

                        {/* Tag selector */}
                        {pred.type === 'tag' && (
                          <Input
                            type="text"
                            placeholder="Enter tags (comma-separated)"
                            value={(pred.tags || []).join(', ')}
                            onChange={(e) =>
                              updatePredicate(idx, {
                                tags: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        )}

                        {/* Price range selector */}
                        {pred.type === 'priceRange' && (
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              placeholder="Min price"
                              value={pred.min || ''}
                              onChange={(e) =>
                                updatePredicate(idx, {
                                  min: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Max price"
                              value={pred.max || ''}
                              onChange={(e) =>
                                updatePredicate(idx, {
                                  max: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                            />
                            <Input
                              type="text"
                              placeholder="Currency"
                              value={pred.currency || ''}
                              onChange={(e) =>
                                updatePredicate(idx, { currency: e.target.value })
                              }
                            />
                          </div>
                        )}

                        {/* Custom field selector */}
                        {pred.type === 'custom' && (
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="text"
                              placeholder="Field name"
                              value={pred.field || ''}
                              onChange={(e) =>
                                updatePredicate(idx, { field: e.target.value })
                              }
                            />
                            <select
                              value={pred.operator}
                              onChange={(e) =>
                                updatePredicate(idx, {
                                  operator: e.target.value as 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains',
                                })
                              }
                              className="px-3 py-2 border border-border rounded-md text-sm"
                            >
                              <option value="eq">Equals</option>
                              <option value="ne">Not equals</option>
                              <option value="gt">Greater than</option>
                              <option value="gte">Greater or equal</option>
                              <option value="lt">Less than</option>
                              <option value="lte">Less or equal</option>
                              <option value="in">In list</option>
                              <option value="contains">Contains</option>
                            </select>
                            <Input
                              type="text"
                              placeholder="Value"
                              value={String(pred.value || '')}
                              onChange={(e) =>
                                updatePredicate(idx, { value: e.target.value })
                              }
                            />
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePredicate(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPredicate('sku')}
              >
                + SKU Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPredicate('tag')}
              >
                + Tag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPredicate('priceRange')}
              >
                + Price Range
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPredicate('custom')}
              >
                + Custom Field
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addPredicate('all')}
              >
                + All Products
              </Button>
            </div>
          </div>

          {/* Transform Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-md font-semibold">Price Transform</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Transform Type</label>
                <select
                  value={editingRule.transform.type}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      transform: {
                        type: e.target.value as 'percentage' | 'absolute' | 'set' | 'multiply',
                        value: 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="percentage">Percentage Change</option>
                  <option value="absolute">Absolute Change</option>
                  <option value="set">Set to Value</option>
                  <option value="multiply">Multiply by Factor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {editingRule.transform.type === 'percentage'
                    ? 'Percentage (%)'
                    : editingRule.transform.type === 'multiply'
                    ? 'Factor'
                    : 'Amount'}
                </label>
                <Input
                  type="number"
                  step={editingRule.transform.type === 'percentage' ? '0.1' : '0.01'}
                  value={
                    editingRule.transform.type === 'multiply'
                      ? editingRule.transform.factor || ''
                      : editingRule.transform.value || ''
                  }
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : 0
                    setEditingRule({
                      ...editingRule,
                      transform: {
                        ...editingRule.transform,
                        ...(editingRule.transform.type === 'multiply'
                          ? { factor: val }
                          : { value: val }),
                      },
                    })
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-3 pt-4">
              <h4 className="text-sm font-semibold text-gray-700">
                Constraints (Optional)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Minimum Price Floor
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingRule.constraints.floor || ''}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        constraints: {
                          ...editingRule.constraints,
                          floor: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Maximum Price Ceiling
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingRule.constraints.ceiling || ''}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        constraints: {
                          ...editingRule.constraints,
                          ceiling: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="No maximum"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Max Change (%)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    value={editingRule.constraints.maxPctDelta || ''}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        constraints: {
                          ...editingRule.constraints,
                          maxPctDelta: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="No limit"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-md font-semibold">Schedule</h3>

            <div>
              <label className="block text-sm font-medium mb-1">When to apply</label>
              <select
                value={editingRule.schedule.type}
                onChange={(e) =>
                  setEditingRule({
                    ...editingRule,
                    schedule: {
                      type: e.target.value as 'immediate' | 'scheduled' | 'recurring',
                    },
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="immediate">Apply Immediately</option>
                <option value="scheduled">Schedule for Later</option>
                <option value="recurring">Recurring Schedule</option>
              </select>
            </div>

            {editingRule.schedule.type === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Date & Time</label>
                <Input
                  type="datetime-local"
                  value={editingRule.schedule.scheduledAt || ''}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      schedule: {
                        ...editingRule.schedule,
                        scheduledAt: e.target.value,
                      },
                    })
                  }
                />
              </div>
            )}

            {editingRule.schedule.type === 'recurring' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cron Expression</label>
                  <Input
                    type="text"
                    value={editingRule.schedule.cron || ''}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        schedule: {
                          ...editingRule.schedule,
                          cron: e.target.value,
                        },
                      })
                    }
                    placeholder="0 0 * * *"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    e.g., "0 0 * * *" for daily at midnight
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <Input
                    type="text"
                    value={editingRule.schedule.timezone || 'UTC'}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        schedule: {
                          ...editingRule.schedule,
                          timezone: e.target.value,
                        },
                      })
                    }
                    placeholder="UTC"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Results */}
          {isPreviewMode && previewResults && (
            <div className="border-t pt-6">
              <h3 className="text-md font-semibold mb-4">Preview Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-blue-50">
                  <div className="text-sm text-gray-600">Matched Products</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {previewResults.matchedProducts}
                  </div>
                </Card>
                <Card className="p-4 bg-green-50">
                  <div className="text-sm text-gray-600">Price Changes</div>
                  <div className="text-2xl font-bold text-green-600">
                    {previewResults.totalPriceChanges}
                  </div>
                </Card>
                <Card className="p-4 bg-purple-50">
                  <div className="text-sm text-gray-600">Avg. Change</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {previewResults.averageChange}%
                  </div>
                </Card>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Rules List */}
      {!editingRule && loading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-gray-500">Loading pricing rules...</div>
        </div>
      )}

      {!editingRule && !loading && rules.length === 0 && (
        <EmptyState
          title="No pricing rules yet"
          desc="Create your first automated pricing rule to get started."
        />
      )}

      {!editingRule && rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge variant={rule.enabled ? 'secondary' : 'outline'}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Transform: {rule.transform.transform.type}
                    {' | '}
                    Predicates: {rule.selector.predicates.length}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id!)}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id!)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
