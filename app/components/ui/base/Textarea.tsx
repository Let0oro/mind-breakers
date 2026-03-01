'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    'flex min-h-[80px] w-full border bg-main px-4 py-3 text-sm text-text-main transition-all placeholder:text-muted focus:outline-none focus:border-text-main disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                    error ? 'border-red-500 focus:border-red-500' : 'border-border',
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = 'Textarea'

export { Textarea }
