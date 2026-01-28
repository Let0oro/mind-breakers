import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

type ValidationType = 'organizations' | 'courses' | 'paths'

const tableMap: Record<ValidationType, string> = {
    organizations: 'organizations',
    courses: 'courses',
    paths: 'learning_paths',
}

const nameFieldMap: Record<ValidationType, string> = {
    organizations: 'name',
    courses: 'title',
    paths: 'title',
}

// PATCH - Update or approve item
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const supabase = await createClient()
    const { type, id } = await params

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

    // Validate type
    if (!['organizations', 'courses', 'paths'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const validationType = type as ValidationType
    const table = tableMap[validationType]
    const nameField = nameFieldMap[validationType]

    const body = await request.json()
    const { action, name, description, website_url } = body

    if (action === 'approve') {
        // Just approve without changes
        const { error } = await supabase
            .from(table)
            .update({ is_validated: true })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    }

    if (action === 'update') {
        // Update and approve
        const updateData: Record<string, unknown> = {
            is_validated: true,
            [nameField]: name,
        }

        if (validationType === 'organizations') {
            if (description !== undefined) updateData.description = description
            if (website_url !== undefined) updateData.website_url = website_url
        } else {
            if (description !== undefined) updateData.summary = description
        }

        const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// POST - Merge with existing item
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const supabase = await createClient()
    const { type, id } = await params

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

    // Validate type
    if (!['organizations', 'courses', 'paths'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const validationType = type as ValidationType
    const body = await request.json()
    const { action, targetId } = body

    if (action !== 'merge' || !targetId) {
        return NextResponse.json({ error: 'Invalid merge request' }, { status: 400 })
    }

    // For organizations, update all references then delete
    if (validationType === 'organizations') {
        // Update courses that reference this org
        await supabase
            .from('courses')
            .update({ organization_id: targetId })
            .eq('organization_id', id)

        // Update learning_paths that reference this org
        await supabase
            .from('learning_paths')
            .update({ organization_id: targetId })
            .eq('organization_id', id)

        // Delete the duplicate org
        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    // For courses, update references then delete
    if (validationType === 'courses') {
        // Update user_course_progress
        await supabase
            .from('user_course_progress')
            .update({ course_id: targetId })
            .eq('course_id', id)

        // Update saved_courses
        await supabase
            .from('saved_courses')
            .update({ course_id: targetId })
            .eq('course_id', id)

        // Update course_exercises
        await supabase
            .from('course_exercises')
            .update({ course_id: targetId })
            .eq('course_id', id)

        // Delete the duplicate course
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    // For paths, update references then delete
    if (validationType === 'paths') {
        // Update courses that belong to this path
        await supabase
            .from('courses')
            .update({ path_id: targetId })
            .eq('path_id', id)

        // Update saved_paths
        await supabase
            .from('saved_paths')
            .update({ path_id: targetId })
            .eq('path_id', id)

        // Delete the duplicate path
        const { error } = await supabase
            .from('learning_paths')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
    }

    return NextResponse.json({ success: true })
}

// DELETE - Delete item
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const supabase = await createClient()
    const { type, id } = await params

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

    // Validate type
    if (!['organizations', 'courses', 'paths'].includes(type)) {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const validationType = type as ValidationType
    const table = tableMap[validationType]

    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
