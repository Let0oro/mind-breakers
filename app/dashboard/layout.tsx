import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

import Breadcrumb from '@/components/ui/breadcrumb'
import { NotificationBell } from '@/components/features/NotificationBell'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LevelUpModal } from '@/components/features/LevelUpModal'

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
        <div className="flex h-screen overflow-hidden bg-background-alt dark:bg-background-alt">
            {/* Sidebar matches standardized Background Alt */}
            <Sidebar user={user} profile={profile} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-6 scroll-smooth">
                {/* Breadcrumb Navigation - Add spacing for mobile toggle */}
                <div className="flex flex-wrap justify-between md:mt-0 mt-8">
                    <Breadcrumb />
                    <div className='flex gap-2 items-center justify-end'>
                        <NotificationBell userId={user.id} />
                        <ThemeToggle />
                    </div>
                </div>

                {children}
                <LevelUpModal />
            </main>
        </div>
    )
}
