'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    isLoading?: boolean
    icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, icon, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-main border-border text-text-main hover:bg-surface hover:border-text-main',
            secondary: 'bg-surface border-border text-text-main hover:border-gold hover:text-gold',
            outline: 'bg-transparent border-border text-muted hover:border-text-main hover:text-text-main',
            ghost: 'bg-transparent border-transparent text-muted hover:text-text-main',
            danger: 'bg-transparent border-red-500/30 text-red-500 hover:bg-red-500/10',
            inverse: 'bg-inverse text-inverse hover:bg-border border-transparent'
        }

        const sizes = {
            sm: 'h-8 px-3 text-[10px]',
            md: 'h-10 px-6 text-xs',
            lg: 'h-12 px-8 text-sm',
            icon: 'h-10 w-10 p-0 flex items-center justify-center'
        }

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    'inline-flex items-center justify-center border font-bold uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : icon ? (
                    <span className="mr-2">{icon}</span>
                ) : null}
                {children}
            </button>
        )
    }
)
Button.displayName = 'Button'

export { Button }
