'use client'

import { useState } from 'react'
import type { Course, PathListItem } from '@/lib/types'
import { CardCourse } from '@/components/ui/CardCourse'
import { CardPath } from '@/components/ui/CardPath'

interface ProfileTabsProps {
    courses: Course[] | null
    paths: PathListItem[] | null
}

export default function ProfileTabs({ courses, paths }: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<'courses' | 'paths' | 'achievements'>('courses')

    const tabs = [
        { key: 'courses', label: 'Created Courses', icon: 'school' },
        { key: 'paths', label: 'Learning Paths', icon: 'map' },
        { key: 'achievements', label: 'Achievements', icon: 'emoji_events' },
    ] as const

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-6 border-b border-border mb-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px flex items-center gap-2 ${activeTab === tab.key
                            ? 'border-text-main text-text-main'
                            : 'border-transparent text-muted hover:text-text-main'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
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
                            <div className="col-span-full py-12 text-center border border-dashed border-border">
                                <span className="material-symbols-outlined text-4xl mb-2 text-muted">assignment_late</span>
                                <p className="text-muted text-sm">No published quests yet.</p>
                            </div>
                        )}
                    </div>
                )}

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
                            <div className="col-span-full py-12 text-center border border-dashed border-border">
                                <span className="material-symbols-outlined text-4xl mb-2 text-muted">map</span>
                                <p className="text-muted text-sm">No expeditions created yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {/* Achievement Badges */}
                            <div className="flex flex-col items-center gap-2 p-4 border border-border text-center">
                                <div className="w-12 h-12 flex items-center justify-center bg-amber-500/10 text-amber-500">
                                    <span className="material-symbols-outlined text-2xl">emoji_events</span>
                                </div>
                                <span className="text-text-main text-[10px] font-bold uppercase tracking-widest">Top Creator</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 p-4 border border-border text-center">
                                <div className="w-12 h-12 flex items-center justify-center bg-orange-500/10 text-orange-500">
                                    <span className="material-symbols-outlined text-2xl">local_fire_department</span>
                                </div>
                                <span className="text-text-main text-[10px] font-bold uppercase tracking-widest">30 Day Streak</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 p-4 border border-muted text-center opacity-40 grayscale">
                                <div className="w-12 h-12 flex items-center justify-center bg-purple-500/10 text-purple-500">
                                    <span className="material-symbols-outlined text-2xl">diamond</span>
                                </div>
                                <span className="text-text-main text-[10px] font-bold uppercase tracking-widest">Elite Member</span>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-xs text-muted italic">
                            More achievements coming soon
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
