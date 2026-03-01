'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: string
    error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, error, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {icon && (
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none">
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex h-12 w-full border bg-main px-4 py-2 text-sm text-text-main transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus:outline-none focus:border-text-main disabled:cursor-not-allowed disabled:opacity-50',
                        icon ? 'pl-12' : '',
                        error ? 'border-red-500 focus:border-red-500' : 'border-border',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        )
    }
)
Input.displayName = 'Input'

export { Input }
