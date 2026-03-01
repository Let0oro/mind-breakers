'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/base/Button'

interface FormLayoutProps {
    title: string
    subtitle?: string
    children: ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    showBackButton?: boolean
    className?: string
}

export function FormLayout({
    title,
    subtitle,
    children,
    maxWidth = '3xl',
    showBackButton = true,
    className
}: FormLayoutProps) {
    const router = useRouter()

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl'
    }

    return (
        <div className={cn('w-full', className)}>
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    {showBackButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-8 w-8"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Button>
                    )}
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-text-main">
                        {title}
                    </h1>
                </div>
                {subtitle && (
                    <p className="text-muted text-sm">{subtitle}</p>
                )}
            </header>

            {/* Form Container */}
            <div className={cn('border border-border bg-main p-6 md:p-8', maxWidthClasses[maxWidth])}>
                {children}
            </div>
        </div>
    )
}
