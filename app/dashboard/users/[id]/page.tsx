import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileTabs from './ProfileTabs'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) notFound()

    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

    const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('created_by', id)
        .eq('is_validated', true)
        .order('created_at', { ascending: false })

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isOwnProfile = currentUser?.id === id

    let isFollowing = false
    let followerCount = 0
    let followingCount = 0

    if (currentUser) {
        const { data: follow } = await supabase
            .from('user_follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .single()
        isFollowing = !!follow

        const { count: followers } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', id)
        followerCount = followers || 0

        const { count: following } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', id)
        followingCount = following || 0
    }

    const currentLevel = profile.level || 1
    const currentLevelXp = (profile.total_xp || 0) % 1000
    const progressPercent = Math.min((currentLevelXp / 1000) * 100, 100)

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="border border-border bg-main p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 border border-border overflow-hidden bg-surface grayscale hover:grayscale-0 transition-all">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username || 'User'}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted">
                                    {profile.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-inverse text-inverse text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                            LVL {currentLevel}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-text-main">
                                {profile.username || 'Anonymous'}
                            </h1>
                            <span className="material-symbols-outlined text-text-main text-lg">verified</span>
                        </div>
                        <p className="text-muted text-sm mb-3">
                            {profile.bio || 'Learning Enthusiast'}
                        </p>

                        {/* Social Links */}
                        {profile.social_links && Object.values(profile.social_links).some(link => link) && (
                            <div className="flex items-center gap-3 mb-3">
                                {profile.social_links.github && (
                                    <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-text-main transition-colors">
                                        <span className="material-symbols-outlined text-lg">code</span>
                                    </a>
                                )}
                                {profile.social_links.linkedin && (
                                    <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-text-main transition-colors">
                                        <span className="material-symbols-outlined text-lg">work</span>
                                    </a>
                                )}
                                {profile.social_links.website && (
                                    <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-text-main transition-colors">
                                        <span className="material-symbols-outlined text-lg">language</span>
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-muted text-xs">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {!isOwnProfile ? (
                            <form
                                action={async () => {
                                    'use server'
                                    const supabase = await createClient()
                                    const { data: { user } } = await supabase.auth.getUser()
                                    if (!user) return

                                    if (isFollowing) {
                                        await supabase.from('user_follows')
                                            .delete()
                                            .eq('follower_id', user.id)
                                            .eq('following_id', id)
                                    } else {
                                        await supabase.from('user_follows')
                                            .insert({ follower_id: user.id, following_id: id })
                                    }
                                    redirect(`/dashboard/users/${id}`)
                                }}
                            >
                                <button
                                    type="submit"
                                    className={`h-10 px-6 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isFollowing
                                            ? 'border border-border text-text-main hover:bg-surface'
                                            : 'bg-inverse text-inverse hover:opacity-90'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {isFollowing ? 'person_remove' : 'person_add'}
                                    </span>
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                            </form>
                        ) : (
                            <Link
                                href="/dashboard/settings"
                                className="h-10 px-6 border border-border text-text-main text-xs font-bold uppercase tracking-widest hover:bg-surface transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Edit
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="border border-border p-4">
                    <p className="text-2xl font-black text-text-main">{profile.total_xp?.toLocaleString() || 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Total XP</p>
                </div>
                <div className="border border-border p-4">
                    <p className="text-2xl font-black text-text-main">{followerCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Followers</p>
                </div>
                <div className="border border-border p-4">
                    <p className="text-2xl font-black text-text-main">{followingCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Following</p>
                </div>
                <div className="border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted">Level {currentLevel + 1}</p>
                        <p className="text-xs font-bold text-text-main">{Math.round(progressPercent)}%</p>
                    </div>
                    <div className="h-1 bg-surface-dark w-full">
                        <div className="h-full bg-text-main" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            <ProfileTabs courses={courses} paths={paths} />
        </div>
    )
}
