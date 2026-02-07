'use client'

import { useState } from 'react'
import type { Course, PathListItem, PathWithCourses } from '@/lib/types'
import { CardCourse } from '@/components/ui/CardCourse'
import { CardPath } from '@/components/ui/CardPath'

// Define a simplified Path interface for what we need here, or import if available
// Since we pass 'any' or specific shape from page, let's define locally for prop validation
interface LearningPath {
    id: string
    title: string
    summary: string | null
    created_at: string
}

interface ProfileTabsProps {
    courses: Course[] | null
    paths: PathListItem[] | null
}

export default function ProfileTabs({ courses, paths }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<'courses' | 'paths' | 'achievements'>('courses')

    return (
        <div>
            {/* Content Navigation Tabs */}
            <div className="mb-6">
                <div className="flex border-b border-border dark:border-border px-4 gap-8">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-all ${activeTab === 'courses'
                            ? 'border-brand text-brand'
                            : 'border-transparent text-muted dark:text-muted hover:text-text-main dark:hover:text-gray-200'
                            }`}
                    >
                        <p className="text-sm font-bold leading-normal tracking-[0.015em]">Created Courses</p>
                    </button>
                    <button
                        onClick={() => setActiveTab('paths')}
                        className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-all ${activeTab === 'paths'
                            ? 'border-brand text-brand'
                            : 'border-transparent text-muted dark:text-muted hover:text-text-main dark:hover:text-gray-200'
                            }`}
                    >
                        <p className="text-sm font-bold leading-normal tracking-[0.015em]">Learning Paths</p>
                    </button>
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-all ${activeTab === 'achievements'
                            ? 'border-brand text-brand'
                            : 'border-transparent text-muted dark:text-muted hover:text-text-main dark:hover:text-gray-200'
                            }`}
                    >
                        <p className="text-sm font-bold leading-normal tracking-[0.015em]">Achievements</p>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div>
                {/* COURSES TAB */}
                {activeTab === 'courses' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses && courses.length > 0 ? (
                            courses.map((course) => (
                                <CardCourse
                                    key={course.id}
                                    id={course.id}
                                    title={course.title}
                                    thumbnail_url={course.thumbnail_url}
                                    xp_reward={course.xp_reward}
                                    summary={course.summary || undefined}
                                    variant="profile"
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted dark:text-muted">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">school</span>
                                <p>No published courses yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* PATHS TAB */}
                {activeTab === 'paths' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paths && paths.length > 0 ? (
                            paths.map((path: PathListItem) => (
                                <CardPath
                                    key={path.id}
                                    id={path.id}
                                    title={path.title}
                                    summary={path.summary}
                                    thumbnailUrl={(path.courses && path.courses.length > 0) ? (path.courses[0] as Course).thumbnail_url : null}
                                    createdAt={path.created_at}
                                    variant="profile"
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted dark:text-muted">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">map</span>
                                <p>No learning paths created yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ACHIEVEMENTS TAB */}
                {activeTab === 'achievements' && (
                    <div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {/* Hardcoded Badges for UI Demo */}
                            <div className="flex flex-col items-center gap-2 p-4 bg-main dark:bg-surface rounded-xl border border-border dark:border-border text-center shadow-sm">
                                <div className="size-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <span className="material-symbols-outlined text-3xl">emoji_events</span>
                                </div>
                                <span className="text-text-main dark:text-text-main text-[11px] font-bold uppercase tracking-tighter">Top Creator</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 p-4 bg-main dark:bg-surface rounded-xl border border-border dark:border-border text-center shadow-sm">
                                <div className="size-12 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                                    <span className="material-symbols-outlined text-3xl">local_fire_department</span>
                                </div>
                                <span className="text-text-main dark:text-text-main text-[11px] font-bold uppercase tracking-tighter">30 Day Streak</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-main dark:bg-surface rounded-xl border border-border dark:border-border text-center shadow-sm opacity-50 grayscale">
                                <div className="size-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                                    <span className="material-symbols-outlined text-3xl">diamond</span>
                                </div>
                                <span className="text-text-main dark:text-text-main text-[11px] font-bold uppercase tracking-tighter">Elite Member</span>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted dark:text-muted italic">More achievements coming soon!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
