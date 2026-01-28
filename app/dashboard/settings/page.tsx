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

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Check for existing admin request
    const { data: existingRequest } = await supabase
        .from('admin_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    return (
        <>
            {/* Header */}
            <header className="mb-8">
                <h2 className="text-white text-3xl font-black tracking-tight mb-2">Settings</h2>
                <p className="text-[#9dabb9] text-base">
                    Manage your account and preferences
                </p>
            </header>

            <div className="max-w-3xl space-y-6">
                {/* Profile Section */}
                <SettingsForm user={user} profile={profile} />

                {/* Admin Request Section - Only show if not admin */}
                {!profile?.is_admin && (
                    <section className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6">
                        <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#137fec]">admin_panel_settings</span>
                            Request Admin Access
                        </h3>

                        {existingRequest ? (
                            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                                    <span className="material-symbols-outlined">pending</span>
                                    <span className="font-bold">Request Pending</span>
                                </div>
                                <p className="text-white text-sm mb-2">
                                    Your admin access request is currently being reviewed.
                                </p>
                                <p className="text-[#9dabb9] text-xs">
                                    <strong>Reason:</strong> {existingRequest.reason}
                                </p>
                                <p className="text-[#9dabb9] text-xs mt-1">
                                    <strong>Submitted:</strong> {new Date(existingRequest.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-[#9dabb9] mb-4">
                                    Request administrator privileges to manage content and approve submissions.
                                </p>
                                <AdminRequestForm />
                            </>
                        )}
                    </section>
                )}

                {/* Danger Zone */}
                <section className="bg-red-500/10 rounded-xl border border-red-500/30 p-6">
                    <h3 className="text-red-500 text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined">warning</span>
                        Danger Zone
                    </h3>

                    <p className="text-white text-sm mb-4">
                        Once you delete your account, there is no going back. This action is permanent.
                    </p>

                    <button
                        disabled
                        className="h-12 px-6 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500 font-bold opacity-50 cursor-not-allowed"
                    >
                        Delete Account (Coming Soon)
                    </button>
                </section>
            </div>
        </>
    )
}
