import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length < 10) {
        return NextResponse.json(
            { error: 'Please provide a reason (at least 10 characters)' },
            { status: 400 }
        )
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
        .from('admin_requests')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    if (existingRequest) {
        return NextResponse.json(
            { error: 'You already have a pending admin request' },
            { status: 400 }
        )
    }

    // Create admin request
    const { data: adminRequest, error: requestError } = await supabase
        .from('admin_requests')
        .insert({
            user_id: user.id,
            reason: reason.trim(),
            status: 'pending',
        })
        .select()
        .single()

    if (requestError) {
        return NextResponse.json({ error: requestError.message }, { status: 500 })
    }

    // Get all admins
    const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_admin', true)

    // Create notifications for all admins
    if (admins && admins.length > 0) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()

        const notifications = admins.map(admin => ({
            user_id: admin.id,
            title: 'New Admin Request',
            message: `${profile?.username || 'A user'} has requested admin access`,
            type: 'new_admin_request' as const,
            link: '/guild-hall/admin/requests',
            read: false,
        }))

        await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({ success: true, request: adminRequest })
}
