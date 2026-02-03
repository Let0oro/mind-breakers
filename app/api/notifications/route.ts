import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        // .gt('expires_at', new Date().toISOString()) // Removed strict check to allow nulls, logic needs OR
        .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
        .order('created_at', { ascending: false })
        .limit(50)

    if (unreadOnly) {
        query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(notifications)
}
