import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import AssistantPage from './page'

jest.mock('next-auth/react')
jest.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'demo' }),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('AssistantPage', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com' },
        apiToken: 'test-token',
      },
      status: 'authenticated',
    } as ReturnType<typeof useSession>)

    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
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
    const button = screen.getByRole('button', { name: /submit question/i })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled() // Initially disabled when input is empty
  })

  it('enables Ask button when input has text', () => {
    render(<AssistantPage />)
    const input = screen.getByLabelText('Ask a question about your pricing data')
    const button = screen.getByRole('button', { name: /submit question/i })

    fireEvent.change(input, { target: { value: 'Test question' } })

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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
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

  it('shows warning when no token', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as ReturnType<typeof useSession>)

    render(<AssistantPage />)
    expect(screen.getByText(/Please sign in to use the AI Assistant/i)).toBeInTheDocument()
  })
})

