
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current profile streak info
        // note: using maybeSingle in case profile doesn't exist (shouldn't happen for auth user but safety first)
        // We assume 'streak_days' and 'last_streak_at' columns exist.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, streak_days, last_streak_at')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Error fetching profile for streak:', profileError)
            return NextResponse.json({ error: 'Profile fetch failed' }, { status: 500 })
        }

        const now = new Date()
        const lastStreak = profile.last_streak_at ? new Date(profile.last_streak_at) : null

        // Normalize dates to midnight to compare "days"
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)

        let lastDate = null
        if (lastStreak) {
            lastDate = new Date(lastStreak)
            lastDate.setHours(0, 0, 0, 0)
        }

        let newStreak = profile.streak_days || 0
        let shouldUpdate = false

        if (!lastDate) {
            // First time streak
            newStreak = 1
            shouldUpdate = true
        } else {
            const diffTime = Math.abs(today.getTime() - lastDate.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays === 0) {
                // Already updated today, do nothing or just return success
                return NextResponse.json({ message: 'Streak already updated today', streak: newStreak }, { status: 200 })
            } else if (diffDays === 1) {
                // Consecutive day
                newStreak += 1
                shouldUpdate = true
            } else {
                // Broken streak
                newStreak = 1
                shouldUpdate = true
            }
        }

        if (shouldUpdate) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    streak_days: newStreak,
                    last_streak_at: now.toISOString()
                })
                .eq('id', user.id)

            if (updateError) {
                console.error('Failed to update streak:', updateError)
                return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 })
            }
        }

        return NextResponse.json({ message: 'Streak updated', streak: newStreak }, { status: 200 })

    } catch (error) {
        console.error('Internal server error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
