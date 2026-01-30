import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EditCourseForm } from '../../../courses/[id]/edit/EditCourseForm'

export default async function EditDraftPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify ownership and draft status
    const { data: course, error } = await supabase
        .from('courses')
        .select('id, created_by, status')
        .eq('id', id)
        .eq('created_by', user.id)
        .single()

    if (error || !course) notFound()

    // Allow editing drafts here (status doesn't need to be draft, but we came from drafts route)
    // The EditCourseForm handles all the logic

    return <EditCourseForm courseId={id} />
}
