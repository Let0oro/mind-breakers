'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface FormLayoutProps {
    title: string
    subtitle?: string
    children: ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    showBackButton?: boolean
}

export function FormLayout({
    title,
    subtitle,
    children,
    maxWidth = '3xl',
    showBackButton = true
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
        <>
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    {showBackButton && (
                        <button
                            onClick={() => router.back()}
                            className="text-muted hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
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
            <div className={`border border-border bg-main p-6 md:p-8 ${maxWidthClasses[maxWidth]}`}>
                {children}
            </div>
        </>
    )
}

interface FormFieldProps {
    label: string
    name?: string
    type?: 'text' | 'url' | 'number' | 'email' | 'password' | 'textarea' | 'select'
    value?: string | number
    onChange?: (value: string) => void
    placeholder?: string
    required?: boolean
    disabled?: boolean
    rows?: number
    min?: number
    max?: number
    step?: number
    icon?: string
    hint?: string
    autoFilled?: boolean
    needsAttention?: boolean
    children?: ReactNode // For select options
    className?: string
}

export function FormField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    disabled,
    rows = 4,
    min,
    max,
    step,
    icon,
    hint,
    autoFilled,
    needsAttention,
    children,
    className = ''
}: FormFieldProps) {
    const baseInputClasses = `
        w-full px-4 bg-main border text-text-main 
        placeholder:text-muted focus:outline-none focus:border-text-main
        transition-all disabled:opacity-50 disabled:cursor-not-allowed
        ${needsAttention ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-border'}
        ${icon ? 'pl-12' : ''}
    `

    const renderInput = () => {
        if (type === 'textarea') {
            return (
                <textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    rows={rows}
                    className={`${baseInputClasses} py-3 resize-none ${className}`}
                />
            )
        }

        if (type === 'select') {
            return (
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    required={required}
                    disabled={disabled}
                    className={`${baseInputClasses} h-12 ${className}`}
                >
                    {children}
                </select>
            )
        }

        return (
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                className={`${baseInputClasses} h-12 ${className}`}
            />
        )
    }

    return (
        <div className="space-y-2">
            <label htmlFor={name} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main">
                {label}
                {required && <span className="text-red-500">*</span>}
                {autoFilled && (
                    <span className="text-[10px] font-normal normal-case text-green-500">✓ Auto-filled</span>
                )}
            </label>
            <div className="relative">
                {icon && (
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">
                        {icon}
                    </span>
                )}
                {renderInput()}
            </div>
            {hint && (
                <p className="text-muted text-xs">{hint}</p>
            )}
        </div>
    )
}

interface FormActionsProps {
    onCancel?: () => void
    onSave?: () => void
    onPublish?: () => void
    onDelete?: () => void
    saving?: boolean
    publishing?: boolean
    saveLabel?: string
    publishLabel?: string
    deleteLabel?: string
    canSave?: boolean
    canPublish?: boolean
    showDelete?: boolean
}

export function FormActions({
    onCancel,
    onSave,
    onPublish,
    onDelete,
    saving,
    publishing,
    saveLabel = 'Save Draft',
    publishLabel = 'Publish',
    deleteLabel = 'Delete',
    canSave = true,
    canPublish = true,
    showDelete = false
}: FormActionsProps) {
    const router = useRouter()

    return (
        <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-border">
            <button
                type="button"
                onClick={onCancel || (() => router.back())}
                className="px-6 h-10 border border-border text-text-main text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-surface transition-colors"
            >
                Cancel
            </button>

            {showDelete && onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={saving || publishing}
                    className="cursor-pointer px-6 h-10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                    {deleteLabel}
                </button>
            )}

            <div className="flex-1 flex justify-end gap-3">
                {onSave && (
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving || !canSave}
                        className="cursor-pointer px-6 h-10 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-input transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : saveLabel}
                    </button>
                )}

                {onPublish && (
                    <button
                        type="button"
                        onClick={onPublish}
                        disabled={publishing || !canPublish}
                        className="cursor-pointer px-6 h-10 bg-inverse text-inverse text-xs font-bold uppercase tracking-widest hover:bg-border transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {publishing ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-inverse border-t-transparent" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                {publishLabel}
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

interface FormErrorProps {
    message: string | null
}

export function FormError({ message }: FormErrorProps) {
    if (!message) return null

    return (
        <div className="border border-red-500/30 bg-red-500/10 p-4 mb-6">
            <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {message}
            </p>
        </div>
    )
}

interface FormSectionProps {
    title?: string
    children: ReactNode
    className?: string
}

export function FormSection({ title, children, className = '' }: FormSectionProps) {
    return (
        <div className={`space-y-4 ${className}`}>
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
    return <div className={`border-t border-border my-6 ${className}`} />
}
