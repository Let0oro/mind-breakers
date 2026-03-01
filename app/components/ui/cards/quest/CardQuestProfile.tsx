'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type CardQuestBaseProps } from './CardQuestBoard'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface CardQuestProfileProps extends CardQuestBaseProps {
    thumbnail_url?: string | null
    summary?: string
}

export function CardQuestProfile({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    thumbnail_url,
    summary,
}: CardQuestProfileProps) {
    return (
        <Link
            href={href}
            className={cn(
                'group flex flex-col border border-border hover:border-gold bg-main overflow-hidden transition-all cursor-pointer',
                className
            )}
        >
            <div className="h-40 relative flex items-center justify-center bg-surface-dark overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                <FallbackImage
                    src={thumbnail_url || ''}
                    alt={title}
                    as="img"
                    className="w-full h-full object-cover"
                    type="quest"
                />
                <div className="absolute top-2 right-2">
                    <span className="bg-inverse text-main-alt px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                        Quest
                    </span>
                </div>
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:text-gold group-hover:underline transition-colors line-clamp-1">
                    {title}
                </h3>
                <p className="text-muted text-xs">{xp_reward} XP</p>
                {summary && (
                    <p className="text-muted text-xs line-clamp-2 mt-auto">
                        {summary}
                    </p>
                )}
            </div>
        </Link>
    )
}
