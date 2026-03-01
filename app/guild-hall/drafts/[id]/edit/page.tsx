import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EditQuestForm } from '@/guild-hall/quests/[id]/edit/EditQuestForm'

export default async function EditDraftPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify ownership and draft status
    const { data: quest, error } = await supabase
        .from('quests')
        .select('id, created_by, status')
        .eq('id', id)
        .eq('created_by', user.id)
        .single()

    if (error || !quest) notFound()

    // Allow editing drafts here (status doesn't need to be draft, but we came from drafts route)
    // The EditQuestForm handles all the logic

    return <EditQuestForm questId={id} />
}
