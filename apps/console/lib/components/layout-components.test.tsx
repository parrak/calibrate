import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Drawer } from './Drawer'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card'

describe('Layout Components - Stripe-like UX Regression Tests', () => {
  describe('Drawer Component', () => {
    it('should use light colors and proper design tokens', () => {
      // Since Drawer uses portals, we need to check document.body
      render(
        <Drawer open={true} onClose={() => {}}>
          <div>Test content</div>
        </Drawer>
      )

      // Check that drawer is in the DOM
      const drawer = document.querySelector('aside')
      expect(drawer).toBeInTheDocument()

      // Should use bg-surface, not dark backgrounds
      if (drawer) {
        expect(drawer.className).toContain('bg-surface')
        expect(drawer.className).not.toContain('bg-black')
        expect(drawer.className).not.toContain('bg-gray-900')
      }
    })

    it('should have proper borders and shadows', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          <div>Test content</div>
        </Drawer>
      )

      const drawer = document.querySelector('aside')

      if (drawer) {
        expect(drawer.className).toContain('border-l')
        expect(drawer.className).toContain('border-border')
        expect(drawer.className).toContain('shadow-2xl')
      }
    })

    it('should have light backdrop with blur', () => {
      render(
        <Drawer open={true} onClose={() => {}}>
          <div>Test content</div>
        </Drawer>
      )

      // Find the backdrop div - it should have gray-900 with low opacity for light theme
      const backdrop = document.querySelector('[class*="bg-gray-900/"]')
      expect(backdrop).toBeInTheDocument()

      // Should have backdrop blur
      if (backdrop) {
        expect(backdrop.className).toContain('backdrop-blur')
      }

      // Should NOT have black backdrop without opacity
      const blackBackdrop = document.querySelector('[class*="bg-black"]')
      expect(blackBackdrop).not.toBeInTheDocument()
    })
  })

  describe('Card Component', () => {
    it('should use proper card styling', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      )

      const card = container.firstElementChild
      expect(card?.className).toContain('bg-card')
      expect(card?.className).toContain('text-card-foreground')
      expect(card?.className).toContain('border')
    })

    it('should have proper text colors', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
        </Card>
      )

      const title = screen.getByText('Test Title')
      expect(title.className).not.toMatch(/text-gray-900/)

      const description = screen.getByText('Test Description')
      expect(description.className).toContain('text-muted-foreground')
    })

    it('should NOT have dark backgrounds', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      )

      const card = container.firstElementChild
      expect(card?.className).not.toMatch(/bg-gray-[89]00/)
      expect(card?.className).not.toMatch(/bg-black/)
      expect(card?.className).not.toMatch(/bg-slate-900/)
    })
  })

  describe('General Layout Principles', () => {
    it('should use consistent border radius', () => {
      const { container: cardContainer } = render(<Card>Test</Card>)
      const card = cardContainer.firstElementChild

      expect(card?.className).toMatch(/rounded/)
    })

    it('should use shadow for visual hierarchy', () => {
      const { container: cardContainer } = render(<Card>Test</Card>)
      const card = cardContainer.firstElementChild

      expect(card?.className).toContain('shadow-sm')
    })
  })

  describe('No Dark Mode Classes', () => {
    it('Drawer should not contain dark: variants', () => {
      const { container } = render(
        <Drawer open={true} onClose={() => {}}>
          <div>Content</div>
        </Drawer>
      )

      const html = container.innerHTML
      expect(html).not.toMatch(/dark:/)
    })

    it('Card should not contain dark: variants', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      )

      const html = container.innerHTML
      expect(html).not.toMatch(/dark:/)
    })
  })
})
