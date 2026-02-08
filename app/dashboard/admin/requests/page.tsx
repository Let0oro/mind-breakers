import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AdminRequestsClient } from './AdminRequestsClient'

export const metadata = {
    title: 'Admin Requests - MindBreaker',
    description: 'Manage admin access requests',
}

export default async function AdminRequestsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: requests } = await supabase
        .from('admin_requests')
        .select(`
      *,
      profiles:user_id (
        id,
        username
      )
    `)
        .order('created_at', { ascending: false })

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-text-main mb-1">
                    Admin Requests
                </h1>
                <p className="text-muted text-sm">
                    Review and manage administrator access requests
                </p>
            </header>

            <AdminRequestsClient initialRequests={requests || []} />
        </>
    )
}
