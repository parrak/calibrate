'use client'

import { useState } from 'react'
import { submitEarlyAccess } from './actions'

export function EarlyAccessForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatus('loading')
        setErrorMessage('')

        const formData = new FormData(event.currentTarget)
        const result = await submitEarlyAccess(formData)

        if (result.error) {
            setStatus('error')
            setErrorMessage(result.error)
        } else {
            setStatus('success')
        }
    }

    if (status === 'success') {
        return (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
                <p className="text-mute mb-8">
                    Thanks for your interest. We'll reach out to you personally within 24 hours to schedule your onboarding.
                </p>
                <button
                    onClick={() => setStatus('idle')}
                    className="text-brand font-medium hover:underline"
                >
                    Submit another response
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-mute">Full Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Jane Doe"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-mute">Work Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="jane@company.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="storeUrl" className="text-sm font-medium text-mute">Store URL</label>
                    <input
                        id="storeUrl"
                        name="storeUrl"
                        type="url"
                        required
                        placeholder="https://mystore.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="monthlyRevenue" className="text-sm font-medium text-mute">Monthly Revenue</label>
                    <select
                        id="monthlyRevenue"
                        name="monthlyRevenue"
                        required
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none appearance-none"
                    >
                        <option value="">Select range...</option>
                        <option value="<10k">Less than $10k</option>
                        <option value="10k-50k">$10k - $50k</option>
                        <option value="50k-250k">$50k - $250k</option>
                        <option value="250k-1m">$250k - $1M</option>
                        <option value="1m+">$1M+</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="challenges" className="text-sm font-medium text-mute">What are your main pricing challenges?</label>
                <textarea
                    id="challenges"
                    name="challenges"
                    rows={4}
                    placeholder="Tell us what you're looking to automate or solve..."
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-white focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none resize-none"
                />
            </div>

            {status === 'error' && (
                <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 italic">
                    {errorMessage}
                </div>
            )}

            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 px-6 rounded-lg bg-brand text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
                {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving your spot...
                    </span>
                ) : (
                    'Request Early Access'
                )}
            </button>

            <p className="text-center text-xs text-mute mt-4">
                By submitting, you agree to our <a href="/terms" className="underline hover:text-fg">Terms</a> and <a href="/privacy" className="underline hover:text-fg">Privacy Policy</a>.
            </p>
        </form>
    )
}
