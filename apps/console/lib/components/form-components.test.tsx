import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Select } from './Select'
import { Button } from './Button'
import { Switch } from './Switch'

describe('Form Components - Stripe-like UX Regression Tests', () => {
  describe('Input Component', () => {
    it('should have white background with visible borders', () => {
      const { container } = render(<Input placeholder="Test input" />)
      const input = container.querySelector('input')

      expect(input).toBeInTheDocument()
      expect(input?.className).toContain('bg-surface')
      expect(input?.className).toContain('border-border')
      expect(input?.className).toContain('border-2')
    })

    it('should have proper focus states', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input')

      expect(input?.className).toContain('focus-visible:border-brand')
      expect(input?.className).toContain('focus-visible:ring-2')
      expect(input?.className).toContain('focus-visible:ring-brand/20')
    })

    it('should have hover state', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input')

      expect(input?.className).toContain('hover:border-mute')
    })

    it('should NOT use bg-background or bg-white', () => {
      const { container } = render(<Input />)
      const input = container.querySelector('input')

      // Should use design token bg-surface, not hardcoded bg-white
      expect(input?.className).toContain('bg-surface')
      expect(input?.className).not.toMatch(/\bbg-white\b/)
    })
  })

  describe('Textarea Component', () => {
    it('should have white background with visible borders', () => {
      const { container } = render(<Textarea placeholder="Test textarea" />)
      const textarea = container.querySelector('textarea')

      expect(textarea).toBeInTheDocument()
      expect(textarea?.className).toContain('bg-surface')
      expect(textarea?.className).toContain('border-border')
      expect(textarea?.className).toContain('border-2')
    })

    it('should have proper focus states', () => {
      const { container } = render(<Textarea />)
      const textarea = container.querySelector('textarea')

      expect(textarea?.className).toContain('focus-visible:border-brand')
      expect(textarea?.className).toContain('focus-visible:ring-2')
      expect(textarea?.className).toContain('focus-visible:ring-brand/20')
    })
  })

  describe('Select Component', () => {
    it('should have white background with visible borders', () => {
      const { container } = render(
        <Select>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      )
      const select = container.querySelector('select')

      expect(select).toBeInTheDocument()
      expect(select?.className).toContain('bg-surface')
      expect(select?.className).toContain('border-border')
      expect(select?.className).toContain('border-2')
    })

    it('should have proper focus states', () => {
      const { container } = render(
        <Select>
          <option>Test</option>
        </Select>
      )
      const select = container.querySelector('select')

      expect(select?.className).toContain('focus:border-brand')
      expect(select?.className).toContain('focus:ring-2')
      expect(select?.className).toContain('focus:ring-brand/20')
    })
  })

  describe('Button Component', () => {
    it('should use design tokens for primary variant', () => {
      const { container } = render(<Button variant="primary">Click me</Button>)
      const button = container.querySelector('button')

      expect(button?.className).toContain('bg-brand')
      expect(button?.className).not.toMatch(/\bbg-blue-600\b/)
    })

    it('should use design tokens for ghost variant', () => {
      const { container } = render(<Button variant="ghost">Click me</Button>)
      const button = container.querySelector('button')

      expect(button?.className).toContain('bg-surface')
      expect(button?.className).toContain('text-fg')
      expect(button?.className).toContain('border-border')
    })

    it('should use design tokens for outline variant', () => {
      const { container } = render(<Button variant="outline">Click me</Button>)
      const button = container.querySelector('button')

      expect(button?.className).toContain('bg-surface')
      expect(button?.className).toContain('border-border')
      expect(button?.className).toContain('hover:border-brand')
    })

    it('should have shadow for visual depth', () => {
      const { container } = render(<Button>Click me</Button>)
      const button = container.querySelector('button')

      expect(button?.className).toContain('shadow-sm')
    })

    it('should NOT use hardcoded colors', () => {
      const variants: Array<'primary' | 'ghost' | 'danger' | 'outline'> = ['primary', 'ghost', 'danger', 'outline']

      variants.forEach(variant => {
        const { container } = render(<Button variant={variant}>Test</Button>)
        const button = container.querySelector('button')

        // Should not have hardcoded blue/gray colors
        expect(button?.className).not.toMatch(/\bbg-blue-[0-9]+\b/)
        expect(button?.className).not.toMatch(/\bbg-gray-[89]00\b/)
      })
    })
  })

  describe('Switch Component', () => {
    it('should use design tokens', () => {
      const { container } = render(<Switch />)
      const switchInput = container.querySelector('input[type="checkbox"]')

      expect(switchInput?.className).toContain('border-border')
      expect(switchInput?.className).toContain('bg-border')
      expect(switchInput?.className).toContain('checked:bg-brand')
    })

    it('should have proper focus states', () => {
      const { container } = render(<Switch />)
      const switchInput = container.querySelector('input[type="checkbox"]')

      expect(switchInput?.className).toContain('focus-visible:ring-2')
      expect(switchInput?.className).toContain('focus-visible:ring-brand/20')
    })
  })

  describe('Overall Contrast Requirements', () => {
    it('all form inputs should have 2px borders for visibility', () => {
      const components = [
        { name: 'Input', render: () => render(<Input />) },
        { name: 'Textarea', render: () => render(<Textarea />) },
        { name: 'Select', render: () => render(<Select><option>Test</option></Select>) },
      ]

      components.forEach(({ name, render: renderFn }) => {
        const { container } = renderFn()
        const element = container.firstElementChild

        expect(element?.className, `${name} should have border-2`).toContain('border-2')
      })
    })

    it('all interactive elements should have transition effects', () => {
      const components = [
        { name: 'Input', render: () => render(<Input />) },
        { name: 'Textarea', render: () => render(<Textarea />) },
        { name: 'Select', render: () => render(<Select><option>Test</option></Select>) },
        { name: 'Button', render: () => render(<Button>Test</Button>) },
      ]

      components.forEach(({ name, render: renderFn }) => {
        const { container } = renderFn()
        const element = container.firstElementChild

        expect(
          element?.className,
          `${name} should have transition effects`
        ).toMatch(/transition/)
      })
    })
  })
})
