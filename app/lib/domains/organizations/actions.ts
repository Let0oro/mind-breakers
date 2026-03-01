import { SupabaseClient } from '@supabase/supabase-js'
import { OrganizationListItem } from './schema'

/**
 * Organization Domain Actions (Queries & Mutations)
 */

/**
 * Get validated organizations
 */
export async function getOrganizations(
    supabase: SupabaseClient,
    limit?: number
): Promise<OrganizationListItem[]> {
    const query = supabase
        .from('organizations')
        .select(`
            id,
            name,
            description,
            website_url,
            is_validated,
            expeditions (id),
            quests (id)
        `)
        .eq('is_validated', true)
        .order('name')

    if (limit) {
        query.limit(limit)
    }

    const { data } = await query
    return (data as unknown as OrganizationListItem[]) || []
}
