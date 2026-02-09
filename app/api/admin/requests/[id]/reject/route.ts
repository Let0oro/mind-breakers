import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Get the request to reject
    const { data: adminRequest, error: fetchError } = await supabase
        .from('admin_requests')
        .select('user_id')
        .eq('id', id)
        .eq('status', 'pending')
        .single()

    if (fetchError || !adminRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('admin_requests')
        .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
        })
        .eq('id', id)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create notification for user
    await supabase.from('notifications').insert({
        user_id: adminRequest.user_id,
        title: 'Admin Request Update',
        message: 'Your request for admin access has been reviewed. Please contact support for more information.',
        type: 'admin_request_rejected',
        link: '/guild-hall/settings',
        read: false,
    })

    return NextResponse.json({ success: true })
}
