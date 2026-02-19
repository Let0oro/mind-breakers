import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'

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
        if (validationType === 'courses') {
            // Check if this course has a pending draft edit
            const { data: course } = await supabase
                .from('courses')
                .select('draft_data, is_validated')
                .eq('id', id)
                .single()

            if (course?.draft_data) {
                // It's a shadow draft: merge draft fields into the main course, clear draft_data.
                // IMPORTANT: exclude Supabase-managed / meta columns from the update.
                const EXCLUDED_FIELDS = new Set([
                    'id', 'created_at', 'updated_at', 'edit_reason',
                    'is_validated', 'status', 'author_id', 'draft_data'
                ])
                const draft = course.draft_data as Record<string, unknown>
                const mergeData: Record<string, unknown> = { draft_data: null }
                for (const [key, value] of Object.entries(draft)) {
                    if (!EXCLUDED_FIELDS.has(key) && value !== undefined) {
                        mergeData[key] = value
                    }
                }

                const { error } = await supabase
                    .from('courses')
                    .update(mergeData)
                    .eq('id', id)

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 500 })
                }

                revalidateTag(CACHE_TAGS.ADMIN, 'max')
                revalidateTag(CACHE_TAGS.QUESTS, 'max')
                revalidatePath('/guild-hall/admin/validations')
                revalidatePath('/guild-hall/admin')
                return NextResponse.json({ success: true })
            }
        }

        // Standard approve: set is_validated = true
        const { error } = await supabase
            .from(table)
            .update({ is_validated: true })
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        revalidateTag(CACHE_TAGS.ADMIN, 'max')
        revalidateTag(CACHE_TAGS.QUESTS, 'max')
        revalidateTag(CACHE_TAGS.PATHS, 'max')
        revalidateTag(CACHE_TAGS.ORGANIZATIONS, 'max')
        revalidatePath('/guild-hall/admin/validations')
        revalidatePath('/guild-hall/admin')

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

        revalidateTag(CACHE_TAGS.ADMIN, 'max')
        revalidateTag(CACHE_TAGS.QUESTS, 'max')
        revalidateTag(CACHE_TAGS.PATHS, 'max')
        revalidateTag(CACHE_TAGS.ORGANIZATIONS, 'max')
        revalidatePath('/guild-hall/admin/validations')
        revalidatePath('/guild-hall/admin')

        return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
        const { rejection_reason } = body

        if (!rejection_reason) {
            return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
        }

        if (validationType === 'courses') {
            // Check if it's a Shadow Draft or New Course
            const { data: course } = await supabase
                .from('courses')
                .select('draft_data, is_validated')
                .eq('id', id)
                .single()

            if (!course) {
                return NextResponse.json({ error: 'Course not found' }, { status: 404 })
            }

            if (course.draft_data) {
                // It's a Shadow Draft: Clear draft_data and set reason
                const { error } = await supabase
                    .from('courses')
                    .update({
                        draft_data: null,
                        rejection_reason: rejection_reason
                    })
                    .eq('id', id)

                if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            } else {
                // It's a New Course: Archive and set reason
                const { error } = await supabase
                    .from('courses')
                    .update({
                        status: 'archived',
                        rejection_reason: rejection_reason,
                        archived_at: new Date().toISOString()
                    })
                    .eq('id', id)

                if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            }
        } else {
            // For other types, just delete? Or maybe just ignore for now as not requested.
            // But we can fallback to DELETE logic or just error.
            // Let's implement Soft Delete (Archiving) if possible, or Hard Delete if no archive column.
            // Or just Hard Delete as before for non-courses.
            // But ValidationPanel calls DELETE for non-courses (via handleDelete).
            // So if I call PATCH with reject, it's specific to my new Modal which is mainly for Courses.
            // If I opened the modal for an Organization, it would fail here.
            // I should probably support it or return error.
            // Given the schema only added rejection_reason to Courses, I will return error for others.
            return NextResponse.json({ error: 'Rejection with reason is only supported for Courses' }, { status: 400 })
        }

        revalidateTag(CACHE_TAGS.ADMIN, 'max')
        revalidateTag(CACHE_TAGS.QUESTS, 'max')
        revalidatePath('/guild-hall/admin/validations')
        revalidatePath('/guild-hall/admin')
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

    revalidateTag(CACHE_TAGS.ADMIN, 'max')
    revalidateTag(CACHE_TAGS.QUESTS, 'max')
    revalidateTag(CACHE_TAGS.PATHS, 'max')
    revalidateTag(CACHE_TAGS.ORGANIZATIONS, 'max')

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

    revalidateTag(CACHE_TAGS.ADMIN, 'max')
    revalidateTag(CACHE_TAGS.QUESTS, 'max')
    revalidateTag(CACHE_TAGS.PATHS, 'max')
    revalidateTag(CACHE_TAGS.ORGANIZATIONS, 'max')

    return NextResponse.json({ success: true })
}
