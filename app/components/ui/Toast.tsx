'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
    title: string
    message: string
    type: string
    onClose: () => void
    duration?: number
}

export function Toast({ title, message, type, onClose, duration = 5000 }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Animation in
        requestAnimationFrame(() => setIsVisible(true))

        // Auto close
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300) // Wait for animation to finish
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const getIcon = () => {
        switch (type) {
            case 'exercise_approved':
            case 'quest_approved':
                return '✅'
            case 'exercise_rejected':
            case 'quest_rejected':
            case 'admin_request_rejected':
                return '❌'
            case 'level_up':
            case 'admin_request_approved':
                return '🎉'
            case 'new_follower':
                return '👋'
            default:
                return '🔔'
        }
    }

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 flex w-80 transform items-start gap-3 rounded-lg bg-main p-4 shadow-xl transition-all duration-300 dark:bg-surface-dark border border-border dark:border-border ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
            role="alert"
        >
            <span className="text-2xl">{getIcon()}</span>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-main dark:text-text-main">{title}</h4>
                <p className="mt-1 text-sm text-muted dark:text-gray-300 line-clamp-2">
                    {message}
                </p>
            </div>
            <button
                onClick={() => {
                    setIsVisible(false)
                    setTimeout(onClose, 300)
                }}
                className="text-muted hover:text-muted dark:hover:text-gray-200"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
    )
}
