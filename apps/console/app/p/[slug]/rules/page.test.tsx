import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import RulesPage from './page'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

// Mock toast
vi.mock('@/lib/components', async () => {
  const actual = await vi.importActual('@/lib/components')
  return {
    ...actual,
    useToast: () => ({
      Toast: () => null,
      setMsg: vi.fn(),
    }),
  }
})

const mockSession = {
  user: { email: 'test@example.com', name: 'Test User', role: 'ADMIN' },
  expires: '2099-12-31',
  apiToken: 'mock-token',
}

describe('RulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSession as any).mockReturnValue({ data: mockSession })
  })

  it('should render pricing rules header', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)
    expect(screen.getByText('Pricing Rules')).toBeInTheDocument()
    expect(
      screen.getByText('Create and manage automated pricing rules')
    ).toBeInTheDocument()
  })

  it('should show empty state when no rules', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)
    expect(screen.getByText('No pricing rules yet')).toBeInTheDocument()
  })

  it('should open rule editor when clicking New Rule', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    const newRuleButton = screen.getByRole('button', { name: /new rule/i })
    fireEvent.click(newRuleButton)

    expect(screen.getByLabelText('Rule Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByText('Product Selector')).toBeInTheDocument()
  })

  it('should add SKU predicate', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    // Open editor
    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    // Add SKU predicate
    const addSkuButton = screen.getByRole('button', { name: /\+ SKU Code/i })
    fireEvent.click(addSkuButton)

    expect(screen.getByText('sku')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Enter SKU codes (comma-separated)')
    ).toBeInTheDocument()
  })

  it('should add tag predicate', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const addTagButton = screen.getByRole('button', { name: /\+ Tag/i })
    fireEvent.click(addTagButton)

    expect(screen.getByText('tag')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Enter tags (comma-separated)')
    ).toBeInTheDocument()
  })

  it('should add price range predicate', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const addPriceRangeButton = screen.getByRole('button', {
      name: /\+ Price Range/i,
    })
    fireEvent.click(addPriceRangeButton)

    expect(screen.getByPlaceholderText('Min price')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Max price')).toBeInTheDocument()
  })

  it('should add custom field predicate', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const addCustomButton = screen.getByRole('button', {
      name: /\+ Custom Field/i,
    })
    fireEvent.click(addCustomButton)

    expect(screen.getByPlaceholderText('Field name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Value')).toBeInTheDocument()
  })

  it('should remove predicate', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ SKU Code/i }))

    expect(screen.getByText('sku')).toBeInTheDocument()

    // Find and click remove button
    const removeButtons = screen.getAllByRole('button')
    const removeButton = removeButtons.find((btn) =>
      btn.querySelector('svg.lucide-trash-2')
    )
    if (removeButton) fireEvent.click(removeButton)

    expect(screen.queryByText('sku')).not.toBeInTheDocument()
  })

  it('should change transform type', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const transformSelect = screen.getByDisplayValue('Percentage Change')
    fireEvent.change(transformSelect, { target: { value: 'absolute' } })

    expect(screen.getByDisplayValue('Absolute Change')).toBeInTheDocument()
  })

  it('should set transform value', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const valueInput = screen.getByPlaceholderText('0')
    fireEvent.change(valueInput, { target: { value: '10' } })

    expect(valueInput).toHaveValue(10)
  })

  it('should set constraints', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const floorInput = screen.getByPlaceholderText('No minimum')
    const ceilingInput = screen.getByPlaceholderText('No maximum')
    const maxDeltaInput = screen.getByPlaceholderText('No limit')

    fireEvent.change(floorInput, { target: { value: '5' } })
    fireEvent.change(ceilingInput, { target: { value: '100' } })
    fireEvent.change(maxDeltaInput, { target: { value: '20' } })

    expect(floorInput).toHaveValue(5)
    expect(ceilingInput).toHaveValue(100)
    expect(maxDeltaInput).toHaveValue(20)
  })

  it('should change schedule type', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const scheduleSelect = screen.getByDisplayValue('Apply Immediately')
    fireEvent.change(scheduleSelect, { target: { value: 'scheduled' } })

    expect(screen.getByDisplayValue('Schedule for Later')).toBeInTheDocument()
    expect(screen.getByLabelText('Scheduled Date & Time')).toBeInTheDocument()
  })

  it('should show recurring schedule fields', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const scheduleSelect = screen.getByDisplayValue('Apply Immediately')
    fireEvent.change(scheduleSelect, { target: { value: 'recurring' } })

    expect(screen.getByPlaceholderText('0 0 * * *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('UTC')).toBeInTheDocument()
  })

  it('should toggle enabled checkbox', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const enabledCheckbox = screen.getByLabelText('Enable this rule')
    expect(enabledCheckbox).toBeChecked()

    fireEvent.click(enabledCheckbox)
    expect(enabledCheckbox).not.toBeChecked()
  })

  it('should cancel rule editing', () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))
    expect(screen.getByLabelText('Rule Name')).toBeInTheDocument()

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(screen.queryByLabelText('Rule Name')).not.toBeInTheDocument()
  })

  it('should show error when saving without name', async () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const saveButton = screen.getByRole('button', { name: /save rule/i })
    fireEvent.click(saveButton)

    // The component should still show the editor (not close)
    await waitFor(() => {
      expect(screen.getByLabelText('Rule Name')).toBeInTheDocument()
    })
  })

  it('should handle preview button click', async () => {
    render(<RulesPage params={{ slug: 'demo' }} />)

    fireEvent.click(screen.getByRole('button', { name: /new rule/i }))

    const nameInput = screen.getByLabelText('Rule Name')
    fireEvent.change(nameInput, { target: { value: 'Test Rule' } })

    const previewButton = screen.getByRole('button', { name: /preview/i })
    fireEvent.click(previewButton)

    await waitFor(() => {
      expect(screen.getByText('Preview Results')).toBeInTheDocument()
    })
  })
})
