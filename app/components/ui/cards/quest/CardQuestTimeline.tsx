'use client'

import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type CardQuestBaseProps } from './CardQuestBoard'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardQuestTimelineProps extends CardQuestBaseProps {
    summary?: string
    exercisesCount?: number
    isLast?: boolean
}

export function CardQuestTimeline({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    organizationName,
    progress,
    status = 'published',
    summary,
    exercisesCount,
    isLast = false,
}: CardQuestTimelineProps) {
    const isCompleted = progress === 100
    const isActive = progress !== undefined && progress > 0 && progress < 100
    const isLocked = status !== 'published'

    return (
        <div className={cn('relative', className)}>
            {/* Vertical line connector */}
            {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-px border-l border-dashed border-border" />
            )}

            <Link href={href} className="group flex items-start gap-6 cursor-pointer">
                {/* Square icon */}
                <div className={cn(
                    'relative z-10 w-10 h-10 flex items-center justify-center shrink-0 border transition-all',
                    isCompleted
                        ? 'border-text-main bg-inverse'
                        : isActive
                            ? 'border-text-main bg-main'
                            : 'border-border bg-main group-hover:border-text-main'
                )}>
                    {isCompleted ? (
                        <span className="material-symbols-outlined text-main-alt text-sm">check</span>
                    ) : (
                        <span className={cn('w-2 h-2', isActive ? 'bg-text-main' : 'bg-border')} />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:underline group-hover:text-gold transition-colors">
                                {title}
                            </h3>
                            {summary && (
                                <p className="text-muted text-xs mt-1 line-clamp-2">
                                    {summary}
                                </p>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                                {organizationName && <span>{organizationName}</span>}
                                <span>{xp_reward} XP</span>
                                {exercisesCount !== undefined && exercisesCount > 0 && (
                                    <span>{exercisesCount} Missions</span>
                                )}
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2 shrink-0">
                            {isActive && (
                                <span className="px-2 py-0.5 border border-gold text-[10px] font-bold uppercase tracking-widest text-gold cursor-default">
                                    Active
                                </span>
                            )}
                            {isLocked && (
                                <span className="px-2 py-0.5 border border-muted text-[10px] font-bold uppercase tracking-widest text-muted">
                                    {status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}
