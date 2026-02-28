'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'

interface CardExpeditionProps {
    id: string
    title: string
    summary?: string | null
    completedQuests?: number
    totalQuests?: number
    nextQuest?: string
    progressPercent?: number
    isSaved?: boolean
    isValidated?: boolean
    color?: string
    variant?: 'hero' | 'card' | 'profile'
    href?: string
    organizationName?: string
    createdAt?: string
    className?: string
    thumbnailUrl?: string | null
    isOwner?: boolean
    index?: number
}

export function CardExpedition({
    id,
    title,
    summary,
    completedQuests = 0,
    totalQuests = 0,
    nextQuest,
    progressPercent = 0,
    isSaved,
    isValidated = true,
    variant = 'card',
    href = `/guild-hall/expeditions/${id}`,
    organizationName,
    createdAt,
    className = '',
    thumbnailUrl,
    isOwner = false,
    index
}: CardExpeditionProps) {

    // VARIANT: HERO (Horizontal - Dashboard Expeditions)
    if (variant === 'hero') {
        return (
            <Link
                href={href}
                className={`p-6 border border-border hover:border-gold bg-main transition-all flex gap-6 items-start group cursor-pointer ${className}`}
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
                            {/* Filled dots for completed */}
                            {[...Array(Math.min(completedQuests, 5))].map((_, i) => (
                                <div key={i} className="w-3 h-3 bg-gold" />
                            ))}
                            {/* Empty dots for remaining */}
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

    // VARIANT: PROFILE (Vertical with image - ProfileTabs)
    if (variant === 'profile') {
        return (
            <Link
                href={href}
                className={`group flex flex-col border border-border hover:border-gold bg-main overflow-hidden transition-all cursor-pointer ${className}`}
            >
                <div className="h-40 relative flex items-center justify-center bg-surface-dark overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                    <FallbackImage
                        src={thumbnailUrl || ''}
                        alt={title}
                        as="img"
                        className="w-full h-full object-cover"
                        type="expedition"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-inverse/10 pointer-events-none">
                        <span className="material-symbols-outlined text-4xl text-main-alt">flag</span>
                    </div>
                    <div className="absolute top-2 right-2">
                        <span className="bg-inverse text-main-alt px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                            Expedition
                        </span>
                    </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:text-gold group-hover:underline transition-colors line-clamp-1">
                        {title}
                    </h3>
                    {summary && (
                        <p className="text-muted text-xs line-clamp-2">
                            {summary}
                        </p>
                    )}
                    {createdAt && (
                        <div className="mt-auto pt-2 text-xs text-muted">
                            {new Date(createdAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </Link>
        )
    }

    // VARIANT: CARD (Vertical detailed - Expeditions List Page)
    return (
        <Link
            href={href}
            className={`group border border-border hover:border-gold bg-main transition-all p-6 flex flex-col gap-4 cursor-pointer ${className}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:text-gold group-hover:underline transition-colors line-clamp-2">
                        {title}
                    </h3>
                    {organizationName && (
                        <p className="text-muted text-xs mt-1 uppercase tracking-wider">
                            {organizationName}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isValidated && isOwner && (
                        <span className="border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                            Pending
                        </span>
                    )}
                    {isSaved && (
                        <span className="material-symbols-outlined text-gold text-lg">bookmark</span>
                    )}
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <p className="text-muted text-xs line-clamp-2 flex-1">
                    {summary}
                </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted mt-auto">
                <span>{totalQuests} quests</span>
                {progressPercent > 0 && (
                    <span>{completedQuests} completed</span>
                )}
            </div>

            {/* Progress Bar */}
            {totalQuests > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted uppercase tracking-wider">Progress</span>
                        <span className="text-gold font-bold">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 bg-surface-dark dark:bg-surface">
                        <div
                            className="h-full bg-gold transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </Link>
    )
}
