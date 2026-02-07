'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminRequestForm() {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/admin/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit request')
            }

            // Success - refresh page to show pending status
            router.refresh()
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unexpected error occurred')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
                    <p className="text-red-500 text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">error</span>
                        {error}
                    </p>
                </div>
            )}

            <div>
                <label htmlFor="reason" className="block text-text-main dark:text-text-main text-sm font-bold mb-2">
                    Why do you want admin access? <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    minLength={10}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main placeholder:text-muted dark:text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                    placeholder="Explain why you need admin access and how you plan to contribute..."
                />
                <p className="text-muted dark:text-muted text-xs mt-1">
                    Minimum 10 characters. Be specific about your intentions.
                </p>
            </div>

            <button
                type="submit"
                disabled={loading || reason.length < 10}
                className="w-full h-12 rounded-lg bg-brand text-text-main dark:text-text-main font-bold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Submitting...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">send</span>
                        Submit Request
                    </>
                )}
            </button>
        </form>
    )
}
