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

    // Get the request to approve
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
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
        })
        .eq('id', id)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Grant admin access to user
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', adminRequest.user_id)

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Create notification for user
    await supabase.from('notifications').insert({
        user_id: adminRequest.user_id,
        title: 'Admin Request Approved! 🎉',
        message: 'Your request for admin access has been approved. You now have administrator privileges.',
        type: 'admin_request_approved',
        link: '/dashboard/admin/requests',
        read: false,
    })

    return NextResponse.json({ success: true })
}
