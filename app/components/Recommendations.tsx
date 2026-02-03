'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Course, CourseExercise, LearningPath, PathResource } from '@/lib/types'

interface RecommendationsProps {
    mode: 'social' | 'similar'
    contextId?: string // Course or Path ID for similarity
    contextType?: 'course' | 'path'
    title?: string
}

type Item = Course & LearningPath & PathResource

export default function Recommendations({ mode, contextId, contextType, title }: RecommendationsProps) {
    const [items, setItems] = useState<Array<Item>>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let data: Item[] | null = []

            if (mode === 'social') {
                // Fetch items from people the user follows
                // 1. Get following IDs
                const { data: follows } = await supabase
                    .from('user_follows')
                    .select('following_id')
                    .eq('follower_id', user.id)

                const followingIds = follows?.map(f => f.following_id) || []

                if (followingIds.length > 0) {
                    // 2. Get courses created by them
                    const { data: courses } = await supabase
                        .from('courses')
                        .select('*, profiles:created_by(username, avatar_url)')
                        .in('created_by', followingIds)
                        .eq('status', 'published')
                        .limit(5)

                    data = courses
                }
            } else if (mode === 'similar' && contextId && contextType) {
                // Fetch similar items based on current item's uk (forks) or tags/title
                // First get the current item's UK
                const table = contextType === 'course' ? 'courses' : 'learning_paths'
                const { data: currentItem } = await supabase
                    .from(table)
                    .select('uk, title')
                    .eq('id', contextId)
                    .single()

                if (currentItem) {
                    // Find others with same UK (adaptations) or similar title
                    const { data: similar } = await supabase
                        .from(table)
                        .select('*')
                        .or(`uk.eq.${currentItem.uk},title.ilike.%${currentItem.title.split(' ')[0]}%`) // Simple similarity on first word
                        .neq('id', contextId)
                        .limit(5)

                    data = similar
                }
            }

            if (data) setItems(data)
            setLoading(false)
        }

        fetchRecommendations()
    }, [mode, contextId, contextType, supabase])

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
    if (items.length === 0) return null

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {title || (mode === 'social' ? 'From your network' : 'You might also like')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/dashboard/${contextType === 'path' || (!contextType && !item.path_id) ? 'paths' : 'courses'}/${item.id}`}
                        className="block group"
                    >
                        <div className="bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-[#3b4754] rounded-xl overflow-hidden hover:border-[#137fec] transition-colors">
                            {item.thumbnail_url && (
                                <div className="h-32 bg-gray-200 dark:bg-gray-700 relative">
                                    <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.title} />
                                </div>
                            )}
                            <div className="p-4">
                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-[#137fec] transition-colors truncate">
                                    {item.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {item.summary || item.description}
                                </p>
                                {item.profiles && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                                            {item.profiles.avatar_url && <img src={item.profiles.avatar_url} />}
                                        </div>
                                        <span>{item.profiles.username}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
