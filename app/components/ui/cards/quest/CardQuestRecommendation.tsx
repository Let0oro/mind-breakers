'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type CardQuestBaseProps } from './CardQuestBoard'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardQuestRecommendationProps extends CardQuestBaseProps {
    thumbnail_url?: string | null
    summary?: string
    instructor?: string
    expeditionName?: string
}

export function CardQuestRecommendation({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    thumbnail_url,
    summary,
    instructor,
    expeditionName,
}: CardQuestRecommendationProps) {
    return (
        <Link
            href={href}
            className={cn(
                'block group border border-border hover:border-gold bg-main transition-all overflow-hidden cursor-pointer',
                className
            )}
        >
            {thumbnail_url && (
                <div className="h-32 bg-surface-dark relative overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                    <FallbackImage
                        as="img"
                        src={thumbnail_url}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="p-4">
                <h4 className="font-bold uppercase tracking-wide text-xs text-text-main group-hover:text-gold group-hover:underline truncate transition-colors">
                    {title}
                </h4>
                {summary && (
                    <p className="text-muted text-xs mt-1 line-clamp-2">
                        {summary}
                    </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                    <div className="flex items-center gap-3">
                        {xp_reward > 0 && <span>{xp_reward} XP</span>}
                        {instructor && <span>{instructor}</span>}
                    </div>
                    {expeditionName && <span className="truncate max-w-[50%] text-right" title={expeditionName}>From: {expeditionName}</span>}
                </div>
            </div>
        </Link>
    )
}
