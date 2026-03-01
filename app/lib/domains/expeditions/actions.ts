import { SupabaseClient } from '@supabase/supabase-js'
import { ExpeditionListItem } from './schema'

/**
 * Expedition Domain Actions (Queries & Mutations)
 */

/**
 * Get validated expeditions
 */
export async function getValidatedExpeditions(
    supabase: SupabaseClient,
    limit?: number
): Promise<ExpeditionListItem[]> {
    const query = supabase
        .from('expeditions')
        .select(`
            id,
            title,
            summary,
            created_at,
            is_validated,
            organizations (id, name),
            quests (id)
        `)
        .eq('is_validated', true)
        .order('created_at', { ascending: false })

    if (limit) {
        query.limit(limit)
    }

    const { data } = await query
    return (data as unknown as ExpeditionListItem[]) || []
}

/**
 * Get a single expedition by ID
 */
export async function getExpeditionById(
    supabase: SupabaseClient,
    expeditionId: string
) {
    const { data, error } = await supabase
        .from('expeditions')
        .select(`
            *,
            organizations (id, name),
            quests (
                id,
                title,
                summary,
                thumbnail_url,
                xp_reward,
                order_index,
                status,
                is_validated  
            )
        `)
        .eq('id', expeditionId)
        .single()

    return { data, error }
}

/**
 * Get user's saved expedition IDs
 */
export async function getUserSavedExpeditionIds(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_expeditions')
        .select('expedition_id')
        .eq('user_id', userId)

    return data?.map(p => p.expedition_id) || []
}
