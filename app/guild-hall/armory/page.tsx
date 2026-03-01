import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AdminRequestForm } from './AdminRequestForm'
import { SettingsForm } from './SettingsForm'

export const metadata = {
    title: 'Settings - MindBreaker',
    description: 'Manage your account settings',
}

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: existingRequest } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    return (
        <>
            <header className="mb-8">
                <h1 className="text-5xl font-header text-foreground tracking-tight mb-1">
                    Armory
                </h1>
                <p className="text-muted text-sm">
                    Manage your account and preferences
                </p>
            </header>

            <div className="max-w-3xl space-y-6">
                {/* Profile Section */}
                <SettingsForm user={user} profile={profile} />

                {/* Admin Request Section */}
                {!profile?.is_admin && (
                    <section className="border border-border bg-main p-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                            Request Admin Access
                        </h3>

                        {existingRequest ? (
                            <div className="p-4 border border-muted">
                                <div className="flex items-center gap-2 text-muted mb-2">
                                    <span className="material-symbols-outlined text-sm">pending</span>
                                    <span className="text-xs font-bold uppercase tracking-widest">Request Pending</span>
                                </div>
                                <p className="text-text-main text-sm mb-2">
                                    Your admin access request is currently being reviewed.
                                </p>
                                <p className="text-muted text-xs">
                                    <strong>Reason:</strong> {existingRequest.reason}
                                </p>
                                <p className="text-muted text-xs mt-1">
                                    <strong>Submitted:</strong> {new Date(existingRequest.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-muted text-sm mb-4">
                                    Request administrator privileges to manage content and approve submissions.
                                </p>
                                <AdminRequestForm />
                            </>
                        )}
                    </section>
                )}

                {/* Danger Zone */}
                <section className="border border-muted p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">warning</span>
                        Danger Zone
                    </h3>

                    <p className="text-muted text-sm mb-4">
                        Once you delete your account, there is no going back. This action is permanent.
                    </p>

                    <button
                        disabled
                        className="px-4 py-2 border border-muted text-muted text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed"
                    >
                        Delete Account (Coming Soon)
                    </button>
                </section>
            </div>
        </>
    )
}
