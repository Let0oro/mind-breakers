'use client'

import Link from 'next/link'
import { FallbackImage } from '@/components/FallbackImage'

interface CardPathProps {
    id: string
    title: string
    summary?: string | null
    completedCourses?: number
    totalCourses?: number
    nextCourse?: string
    progressPercent?: number
    isSaved?: boolean
    isValidated?: boolean
    color?: string
    variant?: 'hero' | 'card' | 'profile'
    href?: string
    organizationName?: string
    createdAt?: string
    className?: string
    thumbnailUrl?: string | null
    isOwner?: boolean
}

export function CardPath({
    id,
    title,
    summary,
    completedCourses = 0,
    totalCourses = 0,
    nextCourse,
    progressPercent = 0,
    isSaved,
    isValidated = true,
    color = 'primary',
    variant = 'card',
    href = `/dashboard/paths/${id}`,
    organizationName,
    createdAt,
    className = '',
    thumbnailUrl,
    isOwner = false
}: CardPathProps) {

    // VARIANT: HERO (Horizontal, large icon/progress)
    // Used in: Dashboard My Learning Paths
    if (variant === 'hero') {
        return (
            <Link
                href={href}
                className={`p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a232e] dark:to-[#111827] border border-gray-200 dark:border-[#3b4754] flex gap-6 items-center hover:shadow-lg transition-all ${className}`}
            >
                <div className={`h-20 w-20 shrink-0 rounded-lg ${color === 'primary' ? 'bg-[#137fec]/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
                    {color === 'primary' ? (
                        <span className="material-symbols-outlined w-6.5 h-6.5 text-[#137fec]">workspace_premium</span>
                    ) : (
                        <span className="material-symbols-outlined w-6.5 h-6.5 text-purple-400">workspace_premium</span>
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{title}</h4>
                    <p className="text-gray-600 dark:text-[#b0bfcc] text-xs mb-4">Path {completedCourses} of {totalCourses} courses completed</p>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {/* Render completed dots */}
                            {[...Array(Math.min(completedCourses, 5))].map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border border-[#111827]">
                                    <span className="material-symbols-outlined w-3 h-3 transform translate-y-[-50%] translate-x-[-50%] text-gray-900 dark:text-white">check</span>
                                </div>
                            ))}
                            {/* Render active pulse if not fully complete */}
                            {completedCourses < totalCourses && (
                                <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center border border-[#111827] animate-pulse">
                                    <span className="material-symbols-outlined w-3 h-3 transform translate-y-[-50%] translate-x-[-50%] text-gray-900 dark:text-white">play_arrow</span>
                                </div>
                            )}
                            {/* Render empty dots (limit to remainders up to some max visual) */}
                            {[...Array(Math.min(totalCourses - completedCourses, 3))].map((_, i) => (
                                <div key={`empty-${i}`} className="w-6 h-6 rounded-full bg-[#3b4754] border border-[#111827]"></div>
                            ))}
                        </div>
                        {nextCourse && (
                            <span className="text-[11px] text-gray-600 dark:text-[#b0bfcc] ml-2">Next: {nextCourse}</span>
                        )}
                    </div>
                </div>
            </Link>
        )
    }

    // VARIANT: PROFILE (Vertical, image-based)
    // Used in: ProfileTabs
    if (variant === 'profile') {
        return (
            <Link
                href={href}
                className={`group flex flex-col bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] overflow-hidden hover:border-[#137fec]/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-[#137fec]/5 ${className}`}
            >
                <div className="h-40 relative flex items-center justify-center bg-gray-100 dark:bg-[#3b4754] overflow-hidden">
                    <FallbackImage
                        src={thumbnailUrl || ''}
                        alt={title}
                        as="img"
                        className="w-full h-full object-cover"
                        type="path"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                        <span className="material-symbols-outlined text-4xl text-white/80">map</span>
                    </div>
                    <div className="absolute top-2 right-2">
                        <span className="bg-[#137fec]/90 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm">
                            Path
                        </span>
                    </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-[#137fec] transition-colors line-clamp-1">
                        {title}
                    </h3>
                    {summary && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                            {summary}
                        </p>
                    )}
                    {createdAt && (
                        <div className="mt-auto pt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            <span>{new Date(createdAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </Link>
        )
    }

    // VARIANT: CARD (Vertical, detailed stats)
    // Used in: Paths List Page
    return (
        <Link
            href={href}
            className={`group bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/50 transition-all p-6 flex flex-col gap-4 ${className}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-[#137fec] transition-colors line-clamp-2">
                        {title}
                    </h3>
                    {organizationName && (
                        <p className="text-gray-600 dark:text-[#b0bfcc] text-sm mt-1">
                            by {organizationName}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Pending Badge */}
                    {!isValidated && isOwner && (
                        <span className="inline-flex items-center gap-1 bg-amber-500 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                            <span className="material-symbols-outlined text-xs">pending</span>
                            Pendiente
                        </span>
                    )}
                    {isSaved && (
                        <span className="material-symbols-outlined text-[#137fec]">
                            bookmark
                        </span>
                    )}
                </div>
            </div>

            {/* Summary */}
            {summary && (
                <p className="text-gray-600 dark:text-[#b0bfcc] text-sm line-clamp-2 flex-1">
                    {summary}
                </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm mt-auto">
                <div className="flex items-center gap-1 text-gray-600 dark:text-[#b0bfcc]">
                    <span className="material-symbols-outlined text-base">school</span>
                    <span>{totalCourses} courses</span>
                </div>
                {progressPercent > 0 && (
                    <div className="flex items-center gap-1 text-green-500">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>{completedCourses} completed</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {totalCourses > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-[#b0bfcc]">Progress</span>
                        <span className="text-gray-900 dark:text-white font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-[#3b4754] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#137fec] rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </Link>
    )
}
