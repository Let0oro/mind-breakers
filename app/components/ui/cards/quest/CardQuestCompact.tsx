'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type CardQuestBaseProps } from './CardQuestBoard'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardQuestCompactProps extends CardQuestBaseProps {
    thumbnail_url?: string | null
}

export function CardQuestCompact({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    thumbnail_url,
}: CardQuestCompactProps) {
    return (
        <Link
            href={href}
            className={cn(
                'p-3 border border-border hover:border-gold bg-main transition-colors cursor-pointer group flex flex-col',
                className
            )}
        >
            <div className="aspect-video w-full relative overflow-hidden mb-2 bg-surface-dark grayscale group-hover:grayscale-0 transition-all">
                <FallbackImage
                    src={thumbnail_url || ''}
                    alt={title}
                    as="img"
                    className="object-cover w-full h-full"
                    type="quest"
                />
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-main group-hover:text-gold transition-colors truncate text-left">
                {title}
            </p>
            <p className="text-[11px] text-muted text-left">
                {xp_reward} XP
            </p>
        </Link>
    )
}
