import { unstable_cache } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { getPublishedQuests, getQuestById, getQuestsByIds } from './actions'
import { CACHE_TAGS } from '../../cache' // Temporarily import from old cache for shared tags

/**
 * Quest Domain Caching Logic
 */

const CACHE_DURATION = {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
}

export const getPublishedQuestsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => getPublishedQuests(supabase, limit),
        [`published-quests-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS],
        }
    )()

export const getQuestCached = (supabase: SupabaseClient, questId: string) =>
    unstable_cache(
        async () => getQuestById(supabase, questId),
        [`quest-${questId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS, `quest-${questId}`],
        }
    )()

export const getQuestsByIdsCached = (supabase: SupabaseClient, userId: string, questIds: string[]) =>
    unstable_cache(
        async () => getQuestsByIds(supabase, questIds),
        [`quests-by-ids-${userId}-${questIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.QUESTS, `user-${userId}`],
        }
    )()
