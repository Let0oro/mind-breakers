'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error Boundary:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="mb-6 p-4 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600">
                <span className="material-symbols-outlined text-5xl">warning</span>
            </div>

            <h2 className="text-2xl font-header font-bold text-inverse mb-3 uppercase tracking-tight">
                An unexpected trial has occurred
            </h2>

            <p className="text-muted text-sm max-w-lg mb-8">
                The grand library has encountered a minor collapse. Our scribes have been notified.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
                <button
                    onClick={() => reset()}
                    className="px-6 py-2 bg-inverse text-main font-bold uppercase tracking-widest text-xs hover:bg-inverse/90 transition-all rounded-xs"
                >
                    Try to mend
                </button>

                <Link
                    href="/"
                    className="px-6 py-2 border border-border text-muted font-bold uppercase tracking-widest text-xs hover:border-gold hover:text-gold transition-all rounded-xs"
                >
                    Return to safe haven
                </Link>
            </div>

            {error.digest && (
                <p className="mt-12 text-[10px] text-muted opacity-50 font-mono tracking-widest">
                    ID: {error.digest}
                </p>
            )}
        </div>
    )
}
