import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

// PATCH - Approve or reject an edit request
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, rejection_reason } = body

    if (action === 'approve') {
        // Fetch the edit request
        const { data: editRequest } = await supabase
            .from('edit_requests')
            .select('*')
            .eq('id', id)
            .single()

        if (!editRequest) {
            return NextResponse.json({ error: 'Edit request not found' }, { status: 404 })
        }

        // Apply changes to the target resource
        const resourceType = editRequest.resource_type as string
        const resourceId = editRequest.resource_id as string
        const editData = editRequest.data as Record<string, unknown>

        let table: string
        if (resourceType === 'quest') {
            table = 'quests'
        } else if (resourceType === 'expedition') {
            table = 'expeditions'
        } else if (resourceType === 'organization') {
            table = 'organizations'
        } else {
            return NextResponse.json({ error: `Unknown resource type: ${resourceType}` }, { status: 400 })
        }

        // Apply the edit to the target resource
        const { error: applyError } = await supabase
            .from(table)
            .update(editData)
            .eq('id', resourceId)

        if (applyError) {
            return NextResponse.json({ error: applyError.message }, { status: 500 })
        }

        // Mark edit request as approved
        const { error: editError } = await supabase
            .from('edit_requests')
            .update({ status: 'approved' })
            .eq('id', id)

        if (editError) {
            return NextResponse.json({ error: editError.message }, { status: 500 })
        }

        revalidateTag(CACHE_TAGS.ADMIN, 'max')
        revalidateTag(CACHE_TAGS.QUESTS, 'max')
        revalidateTag(CACHE_TAGS.EXPEDITIONS, 'max')
        revalidateTag(CACHE_TAGS.ORGANIZATIONS, 'max')
        revalidatePath('/guild-hall/admin/validations')
        revalidatePath('/guild-hall/admin')

        return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
        if (!rejection_reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('edit_requests')
            .update({ status: 'rejected', rejection_reason })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        revalidateTag(CACHE_TAGS.ADMIN, 'max')
        revalidatePath('/guild-hall/admin/validations')
        revalidatePath('/guild-hall/admin')

        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE - Delete an edit request
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
        .from('edit_requests')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidateTag(CACHE_TAGS.ADMIN, 'max')
    revalidatePath('/guild-hall/admin/validations')
    revalidatePath('/guild-hall/admin')

    return NextResponse.json({ success: true })
}
