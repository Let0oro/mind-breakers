'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paths: any[] | null // Using any for flexibility with Supabase types for now
}

export default function ProfileTabs({ courses, paths }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<'courses' | 'paths' | 'achievements'>('courses')

    return (
        <div>
            {/* Content Navigation Tabs */}
            <div className="mb-6">
                <div className="flex border-b border-gray-200 dark:border-[#3b4754] px-4 gap-8">
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-all ${activeTab === 'courses'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <p className="text-sm font-bold leading-normal tracking-[0.015em]">Created Courses</p>
                    </button>
                    <button
                        onClick={() => setActiveTab('paths')}
                        className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-all ${activeTab === 'paths'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        <p className="text-sm font-bold leading-normal tracking-[0.015em]">Learning Paths</p>
                    </button>
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-all ${activeTab === 'achievements'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
                            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
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
                            paths.map((path: PathWithCourses) => (
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
                            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
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
                            <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] text-center shadow-sm">
                                <div className="size-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <span className="material-symbols-outlined text-3xl">emoji_events</span>
                                </div>
                                <span className="text-gray-900 dark:text-white text-[11px] font-bold uppercase tracking-tighter">Top Creator</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] text-center shadow-sm">
                                <div className="size-12 rounded-full bg-[#137fec]/20 flex items-center justify-center text-[#137fec]">
                                    <span className="material-symbols-outlined text-3xl">local_fire_department</span>
                                </div>
                                <span className="text-gray-900 dark:text-white text-[11px] font-bold uppercase tracking-tighter">30 Day Streak</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] text-center shadow-sm opacity-50 grayscale">
                                <div className="size-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                                    <span className="material-symbols-outlined text-3xl">diamond</span>
                                </div>
                                <span className="text-gray-900 dark:text-white text-[11px] font-bold uppercase tracking-tighter">Elite Member</span>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">More achievements coming soon!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
