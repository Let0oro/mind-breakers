'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Course, LearningPath, PathResource } from '@/lib/types'
import { CardCourse } from '@/components/ui/CardCourse'

interface RecommendationsProps {
    mode: 'social' | 'similar'
    contextId?: string
    contextType?: 'course' | 'path'
    title?: string
}

type Item = Course & LearningPath & PathResource & { profiles?: { username: string; avatar_url: string } }

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
                const { data: follows } = await supabase
                    .from('user_follows')
                    .select('following_id')
                    .eq('follower_id', user.id)

                const followingIds = follows?.map(f => f.following_id) || []

                if (followingIds.length > 0) {
                    const { data: courses } = await supabase
                        .from('courses')
                        .select('*, profiles:created_by(username, avatar_url)')
                        .in('created_by', followingIds)
                        .eq('status', 'published')
                        .limit(5)

                    data = courses
                }
            } else if (mode === 'similar' && contextId && contextType) {
                const table = contextType === 'course' ? 'courses' : 'learning_paths'
                const { data: currentItem } = await supabase
                    .from(table)
                    .select('uk, title')
                    .eq('id', contextId)
                    .single()

                if (currentItem) {
                    const { data: similar } = await supabase
                        .from(table)
                        .select('*')
                        .or(`uk.eq.${currentItem.uk},title.ilike.%${currentItem.title.split(' ')[0]}%`)
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

    if (loading) return <div className="animate-pulse h-20 bg-surface" />
    if (items.length === 0) return null

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-lg text-text-main">recommend</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-main">
                    {title || (mode === 'social' ? 'From your network' : 'You might also like')}
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <CardCourse
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        thumbnail_url={item.thumbnail_url}
                        summary={item.summary || item.description}
                        xp_reward={item.xp_reward}
                        instructor={item.profiles?.username}
                        variant="recommendation"
                        href={`/guild-hall/${contextType === 'path' || (!contextType && !item.path_id) ? 'expeditions' : 'quests'}/${item.id}`}
                    />
                ))}
            </div>
        </div>
    )
}
