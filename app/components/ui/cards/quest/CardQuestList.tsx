'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type CardQuestBaseProps } from './CardQuestBoard'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardQuestListProps extends CardQuestBaseProps {
    thumbnail_url?: string | null
    duration?: string
    exercisesCount?: number
}

export function CardQuestList({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    index,
    organizationName,
    progress,
    status = 'published',
    thumbnail_url,
    duration,
    exercisesCount,
}: CardQuestListProps) {
    const isCompleted = progress === 100

    return (
        <Link href={href} className={cn('block group cursor-pointer', className)}>
            <div className={cn(
                'border p-4 transition-all',
                isCompleted ? 'border-gold bg-gold/5' : 'border-border bg-main hover:border-gold'
            )}>
                <div className="flex flex-col md:flex-row gap-4 relative">
                    {/* Index Number */}
                    {index !== undefined && (
                        <div className="hidden md:flex items-center justify-center w-8 shrink-0">
                            <span className="text-muted text-sm font-medium">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        </div>
                    )}

                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full md:w-32 md:h-20 shrink-0 overflow-hidden bg-surface-dark grayscale">
                        <FallbackImage
                            as="img"
                            src={thumbnail_url || ''}
                            alt={title}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="uppercase font-bold text-sm tracking-wide text-text-main group-hover:text-gold group-hover:underline line-clamp-1 transition-colors">
                                    {title}
                                </h3>

                                {organizationName && (
                                    <p className="text-muted text-xs mt-1 uppercase tracking-wider">
                                        {organizationName}
                                    </p>
                                )}

                                <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                                    <span>{xp_reward} XP</span>
                                    {exercisesCount !== undefined && exercisesCount > 0 && (
                                        <span>{exercisesCount} Missions</span>
                                    )}
                                    {duration && <span>{duration}</span>}
                                </div>
                            </div>

                            {/* Status indicators */}
                            <div className="flex items-center gap-2 shrink-0">
                                {status !== 'published' && (
                                    <span className="px-2 py-0.5 border border-current text-[10px] font-bold uppercase tracking-widest text-muted">
                                        {status}
                                    </span>
                                )}
                                {isCompleted && (
                                    <span className="material-symbols-outlined text-gold">check</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
