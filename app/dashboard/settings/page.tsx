import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AdminRequestForm } from './AdminRequestForm'

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
                <section className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6">
                    <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#137fec]">person</span>
                        Profile Information
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                                Username
                            </label>
                            <div className="h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] flex items-center text-white">
                                {profile?.username || 'Not set'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                                Email
                            </label>
                            <div className="h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] flex items-center text-white">
                                {user.email}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                                    Level
                                </label>
                                <div className="h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] flex items-center text-white font-bold">
                                    Level {profile?.level || 1}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                                    Total XP
                                </label>
                                <div className="h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] flex items-center text-[#137fec] font-bold">
                                    {profile?.total_xp || 0} XP
                                </div>
                            </div>
                        </div>

                        {profile?.is_admin && (
                            <div className="mt-4 p-4 rounded-lg bg-[#137fec]/10 border border-[#137fec]/30">
                                <div className="flex items-center gap-2 text-[#137fec]">
                                    <span className="material-symbols-outlined">admin_panel_settings</span>
                                    <span className="font-bold">Admin Account</span>
                                </div>
                                <p className="text-white text-sm mt-1">
                                    You have administrator privileges
                                </p>
                            </div>
                        )}
                    </div>
                </section>

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

                {/* Account Section */}
                <section className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6">
                    <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#137fec]">security</span>
                        Account Security
                    </h3>

                    <div className="space-y-3">
                        <a
                            href="/auth/reset-password"
                            className="flex items-center justify-between h-12 px-4 rounded-lg border border-[#3b4754] hover:border-[#137fec]/50 text-white hover:bg-[#283039] transition-colors"
                        >
                            <span>Change Password</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </a>
                    </div>
                </section>

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
