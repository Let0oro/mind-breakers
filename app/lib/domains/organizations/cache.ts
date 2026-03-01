import { unstable_cache } from 'next/cache'
import { SupabaseClient } from '@supabase/supabase-js'
import { getOrganizations } from './actions'
import { CACHE_TAGS } from '../../cache'

/**
 * Organization Domain Caching Logic
 */

const CACHE_DURATION = {
    LONG: 3600,
}

export const getOrganizationsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => getOrganizations(supabase, limit),
        ['organizations-list'],
        {
            revalidate: CACHE_DURATION.LONG,
            tags: [CACHE_TAGS.ORGANIZATIONS],
        }
    )()
