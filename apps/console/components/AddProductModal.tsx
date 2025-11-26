'use client'

import { useState } from 'react'
import { Button } from '../lib/components/Button'
import { Input } from '../lib/components/Input'
import { Label } from '../lib/components/Label'
import { AlertCircle } from 'lucide-react'

export interface ProductData {
  name: string
  url: string
  skuCode?: string
  imageUrl?: string
}

export function AddProductModal({
  open,
  competitorName,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}: {
  open: boolean
  competitorName: string
  onClose: () => void
  onSubmit: (data: ProductData) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
}) {
  const [formData, setFormData] = useState<ProductData>({
    name: '',
    url: '',
    skuCode: '',
    imageUrl: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Product name is required'
    }

    if (!formData.url.trim()) {
      errors.url = 'Product URL is required'
    } else {
      try {
        new URL(formData.url)
      } catch {
        errors.url = 'Please enter a valid URL (e.g., https://example.com/product)'
      }
    }

    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl)
      } catch {
        errors.imageUrl = 'Please enter a valid image URL'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit({
      name: formData.name,
      url: formData.url,
      skuCode: formData.skuCode || undefined,
      imageUrl: formData.imageUrl || undefined,
    })
  }

  const handleClose = () => {
    setFormData({
      name: '',
      url: '',
      skuCode: '',
      imageUrl: '',
    })
    setValidationErrors({})
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-surface p-6 shadow-2xl border border-border">
        <h3 className="text-lg font-semibold text-fg mb-2">Add Product to Track</h3>
        <p className="text-sm text-mute mb-4">
          Add a product from <span className="font-medium text-fg">{competitorName}</span> to monitor
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Premium Widget"
              disabled={isSubmitting}
              className={validationErrors.name ? 'border-red-500' : ''}
            />
            {validationErrors.name && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="product-url">Product URL *</Label>
            <Input
              id="product-url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://competitor.com/product/premium-widget"
              disabled={isSubmitting}
              className={validationErrors.url ? 'border-red-500' : ''}
            />
            {validationErrors.url && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.url}</p>
            )}
            <p className="text-xs text-mute mt-1">Full URL to the competitor's product page</p>
          </div>

          <div>
            <Label htmlFor="product-sku">Your SKU Code (Optional)</Label>
            <Input
              id="product-sku"
              value={formData.skuCode}
              onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
              placeholder="e.g., WIDGET-001"
              disabled={isSubmitting}
            />
            <p className="text-xs text-mute mt-1">
              Map this competitor product to your SKU for direct price comparison
            </p>
          </div>

          <div>
            <Label htmlFor="product-image">Product Image URL (Optional)</Label>
            <Input
              id="product-image"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://competitor.com/images/product.jpg"
              disabled={isSubmitting}
              className={validationErrors.imageUrl ? 'border-red-500' : ''}
            />
            {validationErrors.imageUrl && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.imageUrl}</p>
            )}
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
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
