'use client'

import { cn } from '@/lib/utils'

interface FormErrorProps {
    message: string | null
    className?: string
}

export function FormError({ message, className }: FormErrorProps) {
    if (!message) return null

    return (
        <div className={cn('border border-red-500/30 bg-red-500/10 p-4 mb-6', className)}>
            <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {message}
            </p>
        </div>
    )
}
