'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { type CardExpeditionBaseProps } from './CardExpeditionHero'

interface CardExpeditionMainProps extends CardExpeditionBaseProps {
    isOwner?: boolean
}

export function CardExpeditionMain({
    id,
    title,
    summary,
    completedQuests = 0,
    totalQuests = 0,
    progressPercent = 0,
    isSaved,
    isValidated = true,
    href = `/guild-hall/expeditions/${id}`,
    organizationName,
    className,
    isOwner = false,
}: CardExpeditionMainProps) {
    return (
        <Link
            href={href}
            className={cn(
                'group border border-border hover:border-gold bg-main transition-all p-6 flex flex-col gap-4 cursor-pointer',
                className
            )}
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
