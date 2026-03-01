'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, error, ...props }, ref) => {
        return (
            <select
                className={cn(
                    'flex h-12 w-full items-center justify-between border bg-main px-4 py-2 text-sm text-text-main transition-all focus:outline-none focus:border-text-main disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
                    error ? 'border-red-500 focus:border-red-500' : 'border-border',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
            </select>
        )
    }
)
Select.displayName = 'Select'

export { Select }
