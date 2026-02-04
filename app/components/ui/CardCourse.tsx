'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'

interface CardCourseProps {
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
    variant?: 'grid' | 'compact' | 'profile' | 'draft' | 'list'
    isSaved?: boolean
    className?: string
    index?: number
    exercisesCount?: number
    organizationName?: string
}

export function CardCourse({
    id,
    title,
    thumbnail_url,
    xp_reward = 0,
    summary,
    instructor,
    duration,
    progress,
    status = 'published',
    href = `/dashboard/courses/${id}`,
    variant = 'grid',
    isSaved,
    className = '',
    index,
    exercisesCount,
    organizationName
}: CardCourseProps) {

    // VARIANT: LIST (Horizontal card with details)
    // Used in: Path Detail Page
    if (variant === 'list') {
        const isCompleted = progress === 100

        return (
            <Link
                href={href}
                className={`block group ${className}`}
            >
                <div className={`rounded-xl border-2 p-6 transition-all ${isCompleted
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-gray-200 dark:border-sidebar-border bg-white dark:bg-[#1a232e] hover:border-brand/50'
                    }`}>
                    <div className="flex gap-4 relative">
                        {/* Thumbnail */}
                        <div className="relative h-24 my-auto mx-0 w-40 shrink-0 align-center overflow-hidden rounded-lg bg-sidebar-border">
                            <FallbackImage
                                as="img"
                                src={thumbnail_url || ''}
                                alt={title}
                                className="h-full w-full object-cover"
                            />
                            {!thumbnail_url && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="material-symbols-outlined h-10 w-10 text-gray-600 dark:text-muted-foreground">image</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        {index !== undefined && (
                                            <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-sidebar-border text-sm font-medium text-gray-900 dark:text-white">
                                                {index + 1}
                                            </span>
                                        )}
                                        <h3 className="overflow-hidden text-ellipsis md:line-clamp-1 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                                            {title}
                                        </h3>
                                        {status !== 'published' && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                status === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {status}
                                            </span>
                                        )}
                                    </div>

                                    {summary && (
                                        <p className="overflow-hidden text-ellipsis line-clamp-3 mt-2 text-sm text-gray-600 dark:text-muted-foreground">
                                            {summary}
                                        </p>
                                    )}

                                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-muted-foreground">
                                        {organizationName && (
                                            <span>📚 {organizationName}</span>
                                        )}
                                        <span className="text-brand">⚡ {xp_reward} XP</span>
                                        {exercisesCount !== undefined && exercisesCount > 0 && (
                                            <span>✍️ {exercisesCount} ejercicio(s)</span>
                                        )}
                                    </div>
                                </div>

                                {isCompleted && (
                                    <div className="ml-4 flex items-center gap-2 text-green-400">
                                        <span className="material-symbols-outlined h-6 w-6">check_circle</span>
                                        <span className="text-sm font-medium">Completado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    // VARIANT: COMPACT (Small, horizontal/tile)
    // Used in: Dashboard Saved Courses
    if (variant === 'compact') {
        return (
            <Link
                href={href}
                className={`p-3 bg-white dark:bg-[#1a232e] rounded-lg border border-gray-200 dark:border-sidebar-border hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors cursor-pointer group flex flex-col ${className}`}
            >
                <div className="aspect-video w-full relative rounded overflow-hidden mb-2 bg-gray-100 dark:bg-sidebar-border">
                    <FallbackImage
                        src={thumbnail_url || ''}
                        alt={title}
                        as="img"
                        className="object-cover w-full h-full"
                        type="course"
                    />
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-brand text-left">
                    {title}
                </p>
                <p className="text-[11px] text-gray-600 dark:text-muted-foreground text-left">
                    {xp_reward} XP
                </p>
            </Link>
        )
    }

    // VARIANT: PROFILE (Simpler vertical card)
    // Used in: ProfileTabs
    if (variant === 'profile') {
        return (
            <Link
                href={href}
                className={`group flex flex-col bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border overflow-hidden hover:border-brand/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-[#137fec]/5 ${className}`}
            >
                <div className="h-40 relative flex items-center justify-center bg-gray-100 dark:bg-sidebar-border overflow-hidden">
                    <FallbackImage
                        src={thumbnail_url || ''}
                        alt={title}
                        as="img"
                        className="w-full h-full object-cover"
                        type="course"
                    />
                    <div className="absolute top-2 right-2">
                        <span className="bg-gray-900/80 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest backdrop-blur-sm">
                            Course
                        </span>
                    </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-brand transition-colors line-clamp-1">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                        <span className="material-symbols-outlined text-sm text-brand">star</span>
                        <span>{xp_reward} XP</span>
                    </div>
                    {summary && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mt-auto">
                            {summary}
                        </p>
                    )}
                </div>
            </Link>
        )
    }

    // VARIANT: GRID / DEFAULT (Detailed vertical card)
    // Used in: Dashboard My Courses, Courses List, Drafts
    // Also handles 'draft' styling via status check
    return (
        <Link
            href={href}
            className={`group bg-white dark:bg-[#1a232e] rounded-xl overflow-hidden border border-gray-200 dark:border-sidebar-border hover:border-brand/50 transition-all cursor-pointer flex flex-col relative ${className}`}
        >
            {/* Thumbnail */}
            <div className="h-40 bg-gradient-to-br from-[#137fec]/20 to-[#137fec]/5 relative overflow-hidden shrink-0">
                <FallbackImage
                    src={thumbnail_url || ''}
                    alt={title}
                    as="img"
                    className="object-cover w-full h-full"
                    type={variant === 'draft' ? 'default' : 'course'} // maybe specific draft icon?
                />

                {/* Right Top Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                    {/* Progress Badge */}
                    {progress === 100 ? (
                        <span className="bg-green-500 text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined w-3 h-3">check</span>
                            Completed
                        </span>
                    ) : (progress !== undefined && progress > 0) ? (
                        <span className="bg-brand text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {progress}%
                        </span>
                    ) : null}

                    {/* Saved Badge */}
                    {isSaved && (progress === undefined || progress === 0) && (
                        <span className="bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-white/10">
                            <span className="material-symbols-outlined w-3 h-3">bookmark</span>
                            Saved
                        </span>
                    )}

                    {/* Status Badge */}
                    {status !== 'published' && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {status}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                <h4 className="font-bold text-base line-clamp-2 text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                    {title}
                </h4>

                {instructor && (
                    <p className="text-gray-600 dark:text-muted-foreground text-xs">
                        {instructor}
                    </p>
                )}

                {/* Summary (if provided, usually for Drafts/Profile view but useful here too) */}
                {!instructor && summary && (
                    <p className="text-gray-600 dark:text-muted-foreground text-xs line-clamp-2">
                        {summary}
                    </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined w-4 h-4 text-brand">star</span>
                        <span className="text-gray-600 dark:text-muted-foreground text-xs font-medium">{xp_reward} XP</span>
                    </div>
                    {duration ? (
                        <span className="text-gray-600 dark:text-muted-foreground text-xs">{duration}</span>
                    ) : variant === 'draft' ? (
                        <span className="text-brand text-xs font-bold">Continue Editing</span>
                    ) : null}
                </div>
            </div>
        </Link>
    )
}
