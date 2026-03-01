import { SupabaseClient } from '@supabase/supabase-js'
import { QuestListItem, questListItemSchema } from './schema'

/**
 * Quest Domain Actions (Queries & Mutations)
 */

/**
 * Get published and validated quests
 */
export async function getPublishedQuests(
    supabase: SupabaseClient,
    limit?: number
): Promise<QuestListItem[]> {
    const query = supabase
        .from('quests')
        .select(`
            id,
            title,
            summary,
            thumbnail_url,
            xp_reward,
            is_validated,
            created_by,
            status,
            organizations (name)
        `)
        .eq('status', 'published')
        .eq('is_validated', true)
        .order('created_at', { ascending: false })

    if (limit) {
        query.limit(limit)
    }

    const { data } = await query
    return (data as unknown as QuestListItem[]) || []
}

/**
 * Get a single quest by ID
 */
export async function getQuestById(
    supabase: SupabaseClient,
    questId: string
) {
    const { data, error } = await supabase
        .from('quests')
        .select(`
            *,
            organizations (id, name),
            quest_exercises (*)
        `)
        .eq('id', questId)
        .single()

    return { data, error }
}

/**
 * Get user's saved quest IDs
 */
export async function getUserSavedQuestIds(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_quests')
        .select('quest_id')
        .eq('user_id', userId)

    return data?.map(c => c.quest_id) || []
}

/**
 * Get quests by an array of IDs
 */
export async function getQuestsByIds(
    supabase: SupabaseClient,
    questIds: string[]
): Promise<QuestListItem[]> {
    if (questIds.length === 0) return []

    const { data } = await supabase
        .from('quests')
        .select(`
            id,
            title,
            summary,
            thumbnail_url,
            xp_reward,
            is_validated,
            created_by,
            status,
            organizations (name)
        `)
        .in('id', questIds)
        .order('created_at', { ascending: false })

    return (data as unknown as QuestListItem[]) || []
}
