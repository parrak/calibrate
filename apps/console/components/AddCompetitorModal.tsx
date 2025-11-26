'use client'

import { useState } from 'react'
import { Button } from '../lib/components/Button'
import { Input } from '../lib/components/Input'
import { Label } from '../lib/components/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/components/Select'
import { Switch } from '../lib/components/Switch'
import { AlertCircle } from 'lucide-react'

export interface CompetitorData {
  name: string
  domain: string
  channel: string
  isActive: boolean
}

export function AddCompetitorModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: CompetitorData) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
}) {
  const [formData, setFormData] = useState<CompetitorData>({
    name: '',
    domain: '',
    channel: 'online',
    isActive: true,
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Competitor name is required'
    }

    if (!formData.domain.trim()) {
      errors.domain = 'Domain is required'
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(formData.domain)) {
      errors.domain = 'Please enter a valid domain (e.g., example.com)'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      domain: '',
      channel: 'online',
      isActive: true,
    })
    setValidationErrors({})
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-surface p-6 shadow-2xl border border-border">
        <h3 className="text-lg font-semibold text-fg mb-4">Add Competitor</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="competitor-name">Competitor Name *</Label>
            <Input
              id="competitor-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Acme Corp"
              disabled={isSubmitting}
              className={validationErrors.name ? 'border-red-500' : ''}
            />
            {validationErrors.name && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="competitor-domain">Website Domain *</Label>
            <Input
              id="competitor-domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="e.g., acmecorp.com"
              disabled={isSubmitting}
              className={validationErrors.domain ? 'border-red-500' : ''}
            />
            {validationErrors.domain && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.domain}</p>
            )}
            <p className="text-xs text-mute mt-1">Enter the domain without http:// or https://</p>
          </div>

          <div>
            <Label htmlFor="competitor-channel">Sales Channel</Label>
            <Select
              value={formData.channel}
              onValueChange={(value) => setFormData({ ...formData, channel: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="competitor-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-mute mt-1">Where does this competitor sell?</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="competitor-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              disabled={isSubmitting}
            />
            <Label htmlFor="competitor-active" className="cursor-pointer">
              Active (start monitoring immediately)
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Competitor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
