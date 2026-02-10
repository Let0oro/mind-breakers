import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
                    <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block">block</span>
                    <h1 className="text-text-main dark:text-text-main text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted dark:text-muted mb-6">
                        You need administrator privileges to access this page.
                    </p>
                    <a
                        href="/guild-hall"
                        className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-brand text-text-main dark:text-text-main font-bold hover:bg-brand/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
