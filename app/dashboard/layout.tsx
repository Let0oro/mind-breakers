import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Breadcrumb from '@/components/breadcrumb'
import { NotificationBell } from '@/components/NotificationBell'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="dark flex h-screen overflow-hidden bg-[#101922]">
            <style>{`
        :root {
          --primary: #137fec;
          --background-light: #f6f7f8;
          --background-dark: #101922;
        }
      `}</style>

            {/* Side Navigation */}
            <aside className="w-64 flex flex-col justify-between border-r border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] p-4">
                <div className="flex flex-col gap-8">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-10 w-10 rounded-full bg-cover bg-center border-2 border-[#137fec]" style={{ backgroundImage: `url("https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}")` }} />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold text-black dark:text-white truncate">{profile?.username || user.email}</h1>
                            <p className="text-[#9dabb9] text-xs">Scholar • Lvl {profile?.level || 1}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1">
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#283039] text-white" href="/dashboard">
                            <span className="material-symbols-outlined w-6 h-6">home</span>
                            <span className="text-sm font-medium">Home</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/explore">
                            <span className="material-symbols-outlined w-6 h-6">explore</span>
                            <span className="text-sm font-medium">Explore</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/courses">
                            <span className="material-symbols-outlined w-6 h-6">school</span>
                            <span className="text-sm font-medium">Courses</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/paths">
                            <span className="material-symbols-outlined w-6 h-6">route</span>
                            <span className="text-sm font-medium">Learning Paths</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/exercises">
                            <span className="material-symbols-outlined w-6 h-6">assignment</span>
                            <span className="text-sm font-medium">Exercises</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/leaderboard">
                            <span className="material-symbols-outlined w-6 h-6">leaderboard</span>
                            <span className="text-sm font-medium">Leaderboard</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/organizations">
                            <span className="material-symbols-outlined w-6 h-6">business</span>
                            <span className="text-sm font-medium">Organizations</span>
                        </Link>

                        <div className="h-px bg-[#3b4754] my-4"></div>

                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/settings">
                            <span className="material-symbols-outlined w-6 h-6">settings</span>
                            <span className="text-sm font-medium">Settings</span>
                        </Link>

                        {profile?.is_admin && (
                            <>
                                <div className="h-px bg-[#3b4754] my-4"></div>
                                <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/admin/requests">
                                    <span className="material-symbols-outlined w-6 h-6">admin_panel_settings</span>
                                    <span className="text-sm font-medium">Admin Panel</span>
                                </Link>
                            </>
                        )}

                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/profile">
                            <span className="material-symbols-outlined w-6 h-6">person</span>
                            <span className="text-sm font-medium">Profile</span>
                        </Link>
                        <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/5 transition-colors" href="/dashboard/settings">
                            <span className="material-symbols-outlined w-6 h-6">settings</span>
                            <span className="text-sm font-medium">Settings</span>
                        </Link>
                    </nav>
                </div>

                {/* Create Course Button */}
                <Link href="/dashboard/courses/new" className="flex w-full items-center justify-center gap-2 rounded-lg h-11 bg-[#137fec] text-white text-sm font-bold transition-transform hover:bg-[#137fec]/90 active:scale-95">
                    <span className="material-symbols-outlined w-5 h-5">add_circle</span>
                    <span>Create New Course</span>
                </Link>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-8 py-6">
                {/* Breadcrumb Navigation */}
                <Breadcrumb />

                {children}
            </main>
        </div>
    )
}
