import { unstable_cache } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { getValidatedExpeditions, getExpeditionById } from './actions'
import { CACHE_TAGS } from '../../cache'

/**
 * Expedition Domain Caching Logic
 */

const CACHE_DURATION = {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
}

export const getValidatedExpeditionsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => getValidatedExpeditions(supabase, limit),
        [`validated-expeditions-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.EXPEDITIONS],
        }
    )()

export const getExpeditionCached = (supabase: SupabaseClient, expeditionId: string) =>
    unstable_cache(
        async () => getExpeditionById(supabase, expeditionId),
        [`expedition-${expeditionId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.EXPEDITIONS, `expedition-${expeditionId}`],
        }
    )()
