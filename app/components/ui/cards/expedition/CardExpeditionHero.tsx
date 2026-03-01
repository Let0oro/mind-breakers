'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface CardExpeditionBaseProps {
    id: string
    title: string
    summary?: string | null
    completedQuests?: number
    totalQuests?: number
    progressPercent?: number
    isSaved?: boolean
    isValidated?: boolean
    href?: string
    organizationName?: string
    className?: string
    thumbnailUrl?: string | null
    index?: number
}

interface CardExpeditionHeroProps extends CardExpeditionBaseProps {
    nextQuest?: string
}

export function CardExpeditionHero({
    id,
    title,
    completedQuests = 0,
    totalQuests = 0,
    nextQuest,
    href = `/guild-hall/expeditions/${id}`,
    className,
    index,
}: CardExpeditionHeroProps) {
    return (
        <Link
            href={href}
            className={cn(
                'p-6 border border-border hover:border-gold bg-main transition-all flex gap-6 items-start group cursor-pointer',
                className
            )}
        >
            {/* Index Number */}
            {index !== undefined && (
                <div className="hidden md:block text-muted text-sm font-medium w-6 shrink-0">
                    {String(index + 1).padStart(2, '0')}
                </div>
            )}

            {/* Icon Box */}
            <div className="h-16 w-16 shrink-0 border border-border flex items-center justify-center bg-surface">
                <span className="material-symbols-outlined text-2xl text-text-main">flag</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-bold uppercase tracking-wide text-sm text-text-main group-hover:text-gold group-hover:underline transition-colors line-clamp-1">
                    {title}
                </h4>
                <p className="text-muted text-xs mt-1 uppercase tracking-wider">
                    {completedQuests} of {totalQuests} quests completed
                </p>

                {/* Progress Dots */}
                <div className="flex items-center gap-2 mt-3">
                    <div className="flex gap-1">
                        {[...Array(Math.min(completedQuests, 5))].map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-gold" />
                        ))}
                        {[...Array(Math.min(totalQuests - completedQuests, 5))].map((_, i) => (
                            <div key={`empty-${i}`} className="w-3 h-3 border border-border" />
                        ))}
                    </div>
                    {nextQuest && (
                        <span className="text-[10px] text-muted uppercase tracking-wider ml-2">
                            Next: {nextQuest}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
