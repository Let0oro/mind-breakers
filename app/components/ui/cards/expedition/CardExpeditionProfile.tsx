'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { cn } from '@/lib/utils'
import { type CardExpeditionBaseProps } from './CardExpeditionHero'

interface CardExpeditionProfileProps extends CardExpeditionBaseProps {
    createdAt?: string
}

export function CardExpeditionProfile({
    id,
    title,
    summary,
    href = `/guild-hall/expeditions/${id}`,
    className,
    thumbnailUrl,
    createdAt,
}: CardExpeditionProfileProps) {
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
