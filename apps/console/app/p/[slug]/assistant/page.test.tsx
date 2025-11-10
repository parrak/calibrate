import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AssistantPage from './page'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'demo' }),
}))

// Mock global fetch
global.fetch = vi.fn()

describe('AssistantPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        user: { email: 'test@example.com' },
        apiToken: 'test-token',
      },
      status: 'authenticated',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', () => {
    render(<AssistantPage />)
    expect(screen.getByText('AI Pricing Assistant')).toBeInTheDocument()
  })

  it('renders input field with proper ARIA attributes', () => {
    render(<AssistantPage />)
    const input = screen.getByLabelText('Ask a question about your pricing data')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-describedby', 'ask-input-help')
  })

  it('renders Ask button with proper ARIA attributes', () => {
    render(<AssistantPage />)
    // When input is empty, button has aria-label "Ask button disabled: Enter a question first"
    const button = screen.getByRole('button', { name: /ask button disabled: enter a question first/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled() // Initially disabled when input is empty
  })

  it('enables Ask button when input has text', () => {
    render(<AssistantPage />)
    const input = screen.getByLabelText('Ask a question about your pricing data')

    fireEvent.change(input, { target: { value: 'Test question' } })

    // After input has text, button aria-label changes to "Ask the AI Assistant"
    const button = screen.getByRole('button', { name: /ask the ai assistant/i })
    expect(button).not.toBeDisabled()
  })

  it('shows help text for input', () => {
    render(<AssistantPage />)
    expect(screen.getByText(/Type your question and press Enter/i)).toBeInTheDocument()
  })

  it('renders suggested questions', () => {
    render(<AssistantPage />)
    expect(screen.getByText('Suggested Questions')).toBeInTheDocument()
    expect(screen.getByText(/Why was this price changed/i)).toBeInTheDocument()
  })

  it('suggested questions have proper ARIA labels', () => {
    render(<AssistantPage />)
    const suggestion = screen.getByLabelText(/Suggested question: Why was this price changed/i)
    expect(suggestion).toBeInTheDocument()
  })

  it('messages container has proper ARIA attributes', () => {
    render(<AssistantPage />)
    const messagesContainer = screen.getByLabelText('AI Assistant conversation')
    expect(messagesContainer).toHaveAttribute('role', 'log')
    expect(messagesContainer).toHaveAttribute('aria-live', 'polite')
  })

  it('submits query on Enter key', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'Test answer',
        method: 'ai',
      }),
    })

    render(<AssistantPage />)
    const input = screen.getByLabelText('Ask a question about your pricing data')

    fireEvent.change(input, { target: { value: 'Test question' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('shows warning when no token', async () => {
    const { useSession } = await import('next-auth/react')
    ;(useSession as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<AssistantPage />)
    // There are multiple instances of this text, so use getAllByText
    const warnings = screen.getAllByText(/Please sign in to use the AI Assistant/i)
    expect(warnings.length).toBeGreaterThan(0)
  })
})

