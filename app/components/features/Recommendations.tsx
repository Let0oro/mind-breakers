'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Quest, Expedition, ExpeditionResource } from '@/lib/types'
import { CardQuest } from '@/components/ui/CardQuest'

interface RecommendationsProps {
    mode: 'social' | 'similar'
    contextId?: string
    contextType?: 'quest' | 'expedition'
    title?: string
}

type Item = Quest & Expedition & ExpeditionResource & {
    profiles?: { username: string; avatar_url: string };
    expeditions?: { title: string } | { title: string }[];
}

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
                    let query = supabase
                        .from('quests')
                        .select('*, profiles:created_by(username, avatar_url), expeditions(title)')
                        .in('created_by', followingIds)
                        .eq('status', 'published')

                    if (contextType === 'quest' && contextId) {
                        query = query.neq('id', contextId)
                    }

                    const { data: quests } = await query.limit(10)
                    data = quests as Item[]
                }
            } else if (mode === 'similar' && contextId && contextType) {
                const table = contextType === 'quest' ? 'quests' : 'expeditions'
                const { data: currentItem } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', contextId)
                    .single()

                if (currentItem) {
                    let query = supabase
                        .from(table)
                        .select(contextType === 'quest' ? '*, expeditions(title)' : '*')
                        .or(`uk.eq.${currentItem.uk},title.ilike.%${currentItem.title.split(' ')[0]}%`)
                        .neq('id', contextId)

                    if (contextType === 'quest' && currentItem.expedition_id) {
                        query = query.neq('expedition_id', currentItem.expedition_id)
                    }

                    const { data: similar } = await query.limit(10)
                    data = similar as unknown as Item[]
                }
            }

            if (data) {
                // Shuffle and limit to 3 random items
                const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 3)
                setItems(shuffled)
            }
            setLoading(false)
        }

        fetchRecommendations()
    }, [mode, contextId, contextType, supabase])

    if (loading) return (
        <div className="animate-pulse border border-border bg-main p-6 mt-8">
            <div className="h-4 w-40 bg-surface rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-surface rounded" />
                ))}
            </div>
        </div>
    )
    if (items.length === 0) return null

    return (
        <div className="mt-8 border border-border bg-main p-6">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-lg text-gold">recommend</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold mt-1">
                    {title || (mode === 'social' ? 'From your network' : 'You might also like')}
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <CardQuest
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        thumbnail_url={item.thumbnail_url}
                        summary={item.summary || item.description}
                        xp_reward={item.xp_reward}
                        instructor={item.profiles?.username}
                        expeditionName={Array.isArray(item.expeditions) ? item.expeditions[0]?.title : item.expeditions?.title}
                        variant="recommendation"
                        href={`/guild-hall/${contextType === 'expedition' || (!contextType && !item.expedition_id) ? 'expeditions' : 'quests'}/${item.id}`}
                    />
                ))}
            </div>
        </div>
    )
}
