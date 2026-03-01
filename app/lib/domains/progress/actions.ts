import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Progress & Stats Actions
 */

/**
 * Get user's exercise stats
 */
export async function getUserExerciseStats(
    supabase: SupabaseClient,
    userId: string
) {
    const { data: enrolledQuests } = await supabase
        .from('user_quest_progress')
        .select('quest_id')
        .eq('user_id', userId)

    if (!enrolledQuests || enrolledQuests.length === 0) {
        return { total: 0, completed: 0, pending: 0 }
    }

    const { count: totalExercises } = await supabase
        .from('quest_exercises')
        .select('id', { count: 'exact' })
        .in('quest_id', enrolledQuests.map(c => c.quest_id))

    const { data: submissions } = await supabase
        .from('exercise_submissions')
        .select('status')
        .eq('user_id', userId)

    const completed = submissions?.filter(s => s.status === 'approved').length || 0
    const pending = submissions?.filter(s => s.status === 'pending').length || 0

    return { total: totalExercises || 0, completed, pending }
}
