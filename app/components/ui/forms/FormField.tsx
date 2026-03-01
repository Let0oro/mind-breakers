'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/base/Input'
import { Textarea } from '@/components/ui/base/Textarea'
import { Select } from '@/components/ui/base/Select'

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        onChange?.(e.target.value)
    }

    const renderInput = () => {
        if (type === 'textarea') {
            return (
                <Textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    rows={rows}
                    error={needsAttention}
                    className={className}
                />
            )
        }

        if (type === 'select') {
            return (
                <Select
                    id={name}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    required={required}
                    disabled={disabled}
                    error={needsAttention}
                    className={className}
                >
                    {children}
                </Select>
            )
        }

        return (
            <Input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                icon={icon}
                error={needsAttention}
                className={className}
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
            {renderInput()}
            {hint && (
                <p className="text-muted text-xs">{hint}</p>
            )}
        </div>
    )
}
