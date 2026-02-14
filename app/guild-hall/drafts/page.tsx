import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardCourse } from '@/components/ui/CardCourse'

export const metadata = {
    title: 'My Drafts - MindBreaker',
    description: 'Manage your course drafts',
}

export default async function DraftsPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    const { data: drafts } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            summary,
            thumbnail_url,
            xp_reward,
            status,
            created_by,
            organizations (name),
            created_at
        `)
        .eq('created_by', user.id)
        .or('status.eq.draft,status.eq.pending')
        .order('created_at', { ascending: false })

    return (
        <>
            <header className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-text-main text-4xl font-black italic tracking-tight">DRAFTS</h1>
                        <p className="text-muted text-sm">
                            {drafts?.length || 0} drafts in progress
                        </p>
                    </div>
                </div>
            </header>

            {/* Drafts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {drafts && drafts.length > 0 ? (
                    drafts.map((course) => (
                        <CardCourse
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            thumbnail_url={course.thumbnail_url}
                            xp_reward={course.xp_reward}
                            summary={course.summary || undefined}
                            status={course.status}
                            variant="draft"
                            href={`/guild-hall/drafts/${course.id}/edit`}
                        />
                    ))
                ) : (
                    <div className="col-span-full border border-border p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-muted mb-4 block">post_add</span>
                        <p className="text-muted text-sm mb-1">No drafts found</p>
                        <p className="text-muted text-xs mb-6">Start creating your first quest.</p>
                        <Link
                            href="/guild-hall/quests/new"
                            className="inline-block px-4 py-2 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
                        >
                            Start a New Quest
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
