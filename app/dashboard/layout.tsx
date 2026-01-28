import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Breadcrumb from '@/components/breadcrumb'
import { NotificationBell } from '@/components/NotificationBell'
import { Sidebar } from './components/Sidebar'

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

            <Sidebar user={user} profile={profile} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-6">
                {/* Breadcrumb Navigation - Add spacing for mobile toggle */}
                <div className="md:mt-0 mt-8">
                    <Breadcrumb />
                </div>

                {children}
            </main>
        </div>
    )
}
