'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type CardQuestBaseProps } from './CardQuestBoard'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface CardQuestGridProps extends CardQuestBaseProps {
    thumbnail_url?: string | null
    summary?: string
    instructor?: string
    duration?: string
    isSaved?: boolean
    variant?: 'grid' | 'draft'
}

export function CardQuestGrid({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    thumbnail_url,
    summary,
    instructor,
    duration,
    isSaved,
    progress,
    status = 'published',
    variant = 'grid',
}: CardQuestGridProps) {
    const isCompleted = progress === 100
    const hasProgress = progress !== undefined && progress > 0

    return (
        <Link
            href={href}
            className={cn(
                'group border border-border hover:border-gold bg-main overflow-hidden transition-all cursor-pointer flex flex-col relative',
                className
            )}
        >
            {/* Thumbnail */}
            <div className="h-40 bg-surface-dark relative overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                <FallbackImage
                    src={thumbnail_url || ''}
                    alt={title}
                    as="img"
                    className="object-cover w-full h-full"
                    type={variant === 'draft' ? 'default' : 'quest'}
                />

                {/* Right Top Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                    {isCompleted && (
                        <span className="bg-gold text-main-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check</span>
                            Complete
                        </span>
                    )}

                    {isSaved && !hasProgress && (
                        <span className="bg-inverse text-main-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">bookmark</span>
                            Saved
                        </span>
                    )}

                    {status !== 'published' && (
                        <span className="border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-inverse bg-main-alt">
                            {status}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                <h4 className="font-bold uppercase tracking-wide text-sm line-clamp-2 text-text-main group-hover:text-gold group-hover:underline transition-colors">
                    {title}
                </h4>

                {instructor && (
                    <p className="text-muted text-xs uppercase tracking-wider">
                        {instructor}
                    </p>
                )}

                {!instructor && summary && (
                    <p className="text-muted text-xs line-clamp-2">
                        {summary}
                    </p>
                )}

                {/* Progress Bar */}
                {hasProgress && (
                    <div className="mt-auto pt-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-muted text-[10px] uppercase tracking-widest">Progress</span>
                            <span className="text-gold text-xs font-bold">{progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-surface-dark">
                            <div
                                className="h-full bg-gold transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className={cn(
                    'flex items-center justify-between',
                    hasProgress ? 'pt-2' : 'mt-auto pt-3 border-t border-border'
                )}>
                    <span className="text-muted text-xs">{xp_reward} XP</span>
                    {duration && <span className="text-muted text-xs">{duration}</span>}
                    {variant === 'draft' && (
                        <span className="text-text-main text-xs font-bold uppercase tracking-wider">Edit →</span>
                    )}
                </div>
            </div>
        </Link>
    )
}
