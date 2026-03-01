'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
    title?: string
    children: ReactNode
    className?: string
}

export function FormSection({ title, children, className = '' }: FormSectionProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {title && (
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-main flex items-center gap-2">
                    {title}
                </h3>
            )}
            {children}
        </div>
    )
}

interface FormDividerProps {
    className?: string
}

export function FormDivider({ className = '' }: FormDividerProps) {
    return <div className={cn('border-t border-border my-6', className)} />
}
