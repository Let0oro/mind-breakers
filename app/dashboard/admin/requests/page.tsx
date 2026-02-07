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

    // Fetch all admin requests with user info
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
                <h2 className="text-text-main dark:text-text-main text-3xl font-black tracking-tight mb-2">Admin Requests</h2>
                <p className="text-muted dark:text-muted text-base">
                    Review and manage administrator access requests
                </p>
            </header>

            <AdminRequestsClient initialRequests={requests || []} />
        </>
    )
}
