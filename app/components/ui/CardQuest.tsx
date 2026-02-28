'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'

interface CardQuestProps {
    id: string
    title: string
    thumbnail_url?: string | null
    xp_reward?: number
    summary?: string
    instructor?: string
    duration?: string
    progress?: number
    status?: string
    href?: string
    variant?: 'grid' | 'compact' | 'profile' | 'draft' | 'list' | 'timeline' | 'recommendation' | 'board'
    isSaved?: boolean
    className?: string
    index?: number
    exercisesCount?: number
    organizationName?: string
    isLast?: boolean
}

export function CardQuest({
    id,
    title,
    thumbnail_url,
    xp_reward = 0,
    summary,
    instructor,
    duration,
    progress,
    status = 'published',
    href = `/guild-hall/quests/${id}`,
    variant = 'grid',
    isSaved,
    className = '',
    index,
    exercisesCount,
    organizationName,
    isLast = false
}: CardQuestProps) {

    // VARIANT: BOARD (Quest Board - Pinned Note)
    if (variant === 'board') {
        const isCompleted = progress === 100
        const isActive = progress !== undefined && progress > 0 && progress < 100
        const isLocked = status !== 'published'

        // Random rotation based on index/id for natural look
        const rotation = index !== undefined ? (index % 2 === 0 ? 'rotate-1' : '-rotate-1') : 'rotate-0'

        return (
            <Link
                href={href}
                className={`group relative md:min-w-48 min-w-32 h-min flex flex-col p-6 bg-background/10 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${rotation} hover:rotate-0 hover:z-[1] isolate ${className}`}
            >
                {/* Pin Visual */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-main -rotate-45 z-[2] border border-gold/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gold"></div>
                </div>

                {/* Decorative Scotch Tape (alternative to pin, or addition) */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-black/5 blur-sm rounded-full -z-10"></div>

                {/* Status Stamps */}
                {isCompleted && (
                    <div className="absolute -right-2 -bottom-2 border-2 border-forest text-forest px-2 py-1 rotate-[-15deg] opacity-80 font-black uppercase text-xs tracking-widest bg-background/80 backdrop-blur-sm z-10">
                        Completed
                    </div>
                )}

                {isActive && (
                    <div className="absolute -right-2 -top-2 border-2 border-gold text-gold px-2 py-1 rotate-[10deg] opacity-90 font-black uppercase text-xs tracking-widest bg-background/80 backdrop-blur-sm z-10">
                        Active
                    </div>
                )}

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    <h3 className="line-clamp-5 font-header text-lg text-foreground italic leading-tight group-hover:text-gold transition-colors ">
                        {title}
                    </h3>


                    <div className='flex items-center gap-2 mt-4 pt-4 border-t border-border/30'>
                        <span className='text-sm text-muted'>{organizationName}</span>
                    </div>

                </div>

                {/* Footer specs */}
                <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center w-full text-[10px] uppercase tracking-widest text-muted font-bold">
                    <span>{xp_reward} XP</span>
                    {exercisesCount !== undefined && (
                        <span>{exercisesCount} Missions</span>
                    )}
                </div>
            </Link>
        )
    }



    // VARIANT: TIMELINE (Expedition Detail Page - Figma design)
    if (variant === 'timeline') {
        const isCompleted = progress === 100
        const isActive = progress !== undefined && progress > 0 && progress < 100
        const isLocked = status !== 'published'

        return (
            <div className={`relative ${className}`}>
                {/* Vertical line connector */}
                {!isLast && (
                    <div className="absolute left-5 top-12 bottom-0 w-px border-l border-dashed border-border" />
                )}

                <Link href={href} className="group flex items-start gap-6">
                    {/* Square icon */}
                    <div className={`relative z-10 w-10 h-10 flex items-center justify-center shrink-0 border transition-all ${isCompleted
                        ? 'border-text-main bg-inverse'
                        : isActive
                            ? 'border-text-main bg-main'
                            : 'border-border bg-main group-hover:border-text-main'
                        }`}>
                        {isCompleted ? (
                            <span className="material-symbols-outlined text-main-alt text-sm">check</span>
                        ) : (
                            <span className={`w-2 h-2 ${isActive ? 'bg-text-main' : 'bg-border'}`} />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:underline">
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
                                    <span className="px-2 py-0.5 border border-text-main text-[10px] font-bold uppercase tracking-widest text-text-main">
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

    // VARIANT: RECOMMENDATION (For recommendations component)
    if (variant === 'recommendation') {
        return (
            <Link
                href={href}
                className={`block group border border-border hover:border-text-main bg-main transition-all overflow-hidden ${className}`}
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
                    <h4 className="font-bold uppercase tracking-wide text-xs text-text-main group-hover:underline truncate">
                        {title}
                    </h4>
                    {summary && (
                        <p className="text-muted text-xs mt-1 line-clamp-2">
                            {summary}
                        </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                        {xp_reward > 0 && <span>{xp_reward} XP</span>}
                        {instructor && <span>{instructor}</span>}
                    </div>
                </div>
            </Link>
        )
    }

    // VARIANT: LIST (Horizontal card - Expedition Detail Page legacy)
    if (variant === 'list') {
        const isCompleted = progress === 100

        return (
            <Link
                href={href}
                className={`block group ${className}`}
            >
                <div className={`border p-4 transition-all ${isCompleted
                    ? 'border-text-main bg-inverse/5'
                    : 'border-border bg-main hover:border-text-main'
                    }`}>
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
                                    <h3 className="uppercase font-bold text-sm tracking-wide text-text-main group-hover:underline line-clamp-1">
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
                                        <span className="material-symbols-outlined text-text-main">check</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    // VARIANT: COMPACT (Small tile - Saved Quests)
    if (variant === 'compact') {
        return (
            <Link
                href={href}
                className={`p-3 border border-border hover:border-text-main bg-main transition-colors cursor-pointer group flex flex-col ${className}`}
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
                <p className="text-xs font-bold uppercase tracking-wide text-text-main truncate text-left">
                    {title}
                </p>
                <p className="text-[11px] text-muted text-left">
                    {xp_reward} XP
                </p>
            </Link>
        )
    }

    // VARIANT: PROFILE (Simpler vertical card)
    if (variant === 'profile') {
        return (
            <Link
                href={href}
                className={`group flex flex-col border border-border hover:border-text-main bg-main overflow-hidden transition-all cursor-pointer ${className}`}
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
                    <h3 className="text-text-main font-bold uppercase tracking-wide text-sm group-hover:underline line-clamp-1">
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

    // VARIANT: GRID / DEFAULT (Detailed vertical card)
    const isCompleted = progress === 100
    const hasProgress = progress !== undefined && progress > 0

    return (
        <Link
            href={href}
            className={`group border border-border hover:border-text-main bg-main overflow-hidden transition-all cursor-pointer flex flex-col relative ${className}`}
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
                        <span className="bg-inverse text-main-alt px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
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
                <h4 className="font-bold uppercase tracking-wide text-sm line-clamp-2 text-text-main group-hover:underline">
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
                            <span className="text-text-main text-xs font-bold">{progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-surface-dark">
                            <div
                                className="h-full bg-inverse transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className={`flex items-center justify-between ${hasProgress ? 'pt-2' : 'mt-auto pt-3 border-t border-border'}`}>
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