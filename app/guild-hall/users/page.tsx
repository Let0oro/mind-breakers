import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Community - MindBreaker',
    description: 'Connect with other learners and creators',
}

export default async function UsersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                    <span className="material-symbols-outlined text-8xl text-brand relative z-10">groups</span>
                </div>

                <h1 className="text-4xl font-bold text-text-main dark:text-text-main">
                    Community Coming Soon
                </h1>

                <p className="text-xl text-muted dark:text-muted max-w-lg">
                    We are building a place for you to connect, compete, and collaborate with friends and fellow learners.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-3xl text-left">
                    <div className="p-6 bg-main dark:bg-surface rounded-xl border border-border dark:border-border">
                        <span className="material-symbols-outlined text-3xl text-yellow-500 mb-4">leaderboard</span>
                        <h3 className="font-bold text-lg text-text-main dark:text-text-main mb-2">Leaderboards</h3>
                        <p className="text-sm text-muted dark:text-muted">Compete with friends for top spots on expedition leaderboards.</p>
                    </div>

                    <div className="p-6 bg-main dark:bg-surface rounded-xl border border-border dark:border-border">
                        <span className="material-symbols-outlined text-3xl text-green-500 mb-4">person_add</span>
                        <h3 className="font-bold text-lg text-text-main dark:text-text-main mb-2">Connect</h3>
                        <p className="text-sm text-muted dark:text-muted">Follow creators and friends to see their latest activities.</p>
                    </div>

                    <div className="p-6 bg-main dark:bg-surface rounded-xl border border-border dark:border-border">
                        <span className="material-symbols-outlined text-3xl text-purple-500 mb-4">handshake</span>
                        <h3 className="font-bold text-lg text-text-main dark:text-text-main mb-2">Collaborate</h3>
                        <p className="text-sm text-muted dark:text-muted">Work together on creating expeditions and quests.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
