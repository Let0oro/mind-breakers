import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileTabs from './ProfileTabs'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch User Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) notFound()

    // 2. Fetch Created Courses
    const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', id)
        .eq('status', 'published') // Only show published courses publicly
        .order('created_at', { ascending: false })

    // 3. Fetch Created Paths (Optional, if we want to show them)
    const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('created_by', id)
        .eq('is_validated', true)
        .order('created_at', { ascending: false })

    // Verify current user for "Edit" or "Follow" buttons logic
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isOwnProfile = currentUser?.id === id

    // Social & Follow Logic
    let isFollowing = false
    let followerCount = 0
    let followingCount = 0

    if (currentUser) {
        // Check if following
        const { data: follow } = await supabase
            .from('user_follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .single()
        isFollowing = !!follow

        // Get stats
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

    // Calculate Next Level (Simplified logic for demo)
    const currentLevel = profile.level || 1
    const currentLevelXp = (profile.total_xp || 0) % 1000
    const progressPercent = Math.min((currentLevelXp / 1000) * 100, 100)

    return (
        <div className="flex flex-1 justify-center py-8">
            <div className="layout-content-container flex flex-col max-w-[1024px] flex-1 px-4 sm:px-10">

                {/* Profile Header Section */}
                <div className="flex p-4 @container bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] mb-6 shadow-sm">
                    <div className="flex w-full flex-col gap-6 md:flex-row md:justify-between md:items-center">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative">
                                <div className="aspect-square rounded-xl min-h-32 w-32 border-4 border-white dark:border-[#1a232e] shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={profile.username || 'User'}
                                            width={128}
                                            height={128}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                                            {profile.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-[#137fec] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-white dark:border-[#1a232e]">
                                    <span className="material-symbols-outlined text-xs">star</span> LVL {currentLevel}
                                </div>
                            </div>

                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
                                        {profile.username || 'Anonymous User'}
                                    </h1>
                                    <span className="material-symbols-outlined text-[#137fec] text-xl" title="Verified Creator">verified</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal whitespace-pre-wrap">
                                    {profile.bio || 'Learning Enthusiast • Community Member'}
                                </p>

                                {/* Social Links */}
                                {profile.social_links && Object.values(profile.social_links).some(link => link) && (
                                    <div className="flex items-center gap-3 mt-2">
                                        {profile.social_links.twitter && (
                                            <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                                                <span className="material-symbols-outlined text-xl">flutter_dash</span> {/* Using flutter_dash as bird/twitter proxy */}
                                            </a>
                                        )}
                                        {profile.social_links.github && (
                                            <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-xl">code</span>
                                            </a>
                                        )}
                                        {profile.social_links.linkedin && (
                                            <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-colors">
                                                <span className="material-symbols-outlined text-xl">work</span>
                                            </a>
                                        )}
                                        {profile.social_links.website && (
                                            <a href={profile.social_links.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#137fec] transition-colors">
                                                <span className="material-symbols-outlined text-xl">language</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

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
                                        className={`flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 text-sm font-bold leading-normal tracking-[0.015em] transition-all shadow-lg ${isFollowing
                                            ? 'bg-gray-100 dark:bg-[#3b4754] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3b4754]/80'
                                            : 'bg-[#137fec] text-white hover:opacity-90 shadow-[#137fec]/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined mr-2 text-base">{isFollowing ? 'person_remove' : 'person_add'}</span>
                                        <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                                    </button>
                                </form>
                            ) : (
                                <Link href="/dashboard/settings" className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-gray-100 dark:bg-[#3b4754] text-gray-900 dark:text-white text-sm font-bold leading-normal hover:bg-gray-200 dark:hover:bg-[#3b4754]/80 transition-colors">
                                    <span className="material-symbols-outlined mr-2 text-base">edit</span>
                                    <span>Edit Profile</span>
                                </Link>
                            )}

                            {/* <button className="flex items-center justify-center rounded-lg h-11 w-11 bg-gray-100 dark:bg-[#3b4754] text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3b4754]/80 transition-colors border border-gray-200 dark:border-[#3b4754]">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button> */}
                        </div>
                    </div>
                </div>

                {/* XP and Social Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 flex flex-col gap-3 p-6 bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] shadow-sm">
                        <div className="flex gap-6 justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#137fec]/10 rounded-lg">
                                    <span className="material-symbols-outlined text-[#137fec]">trending_up</span>
                                </div>
                                <div>
                                    <p className="text-gray-900 dark:text-white text-base font-semibold leading-normal">Next Milestone: Level {currentLevel + 1}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                                        {1000 - currentLevelXp} XP remaining to level up
                                    </p>
                                </div>
                            </div>
                            <p className="text-[#137fec] text-lg font-bold leading-normal">{Math.round(progressPercent)}%</p>
                        </div>
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 h-3 w-full overflow-hidden mt-2">
                            <div className="h-full rounded-full bg-[#137fec]" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[100px] flex flex-col gap-1 rounded-xl border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] p-4 items-start shadow-sm">
                            <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">
                                {profile.total_xp?.toLocaleString() || 0}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Total XP</p>
                        </div>
                        {/* Placeholders for Social Stats */}
                        <div className="flex-1 min-w-[100px] flex flex-col gap-1 rounded-xl border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] p-4 items-start shadow-sm">
                            <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">{followerCount}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Followers</p>
                        </div>
                        <div className="flex-1 min-w-[100px] flex flex-col gap-1 rounded-xl border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] p-4 items-start shadow-sm">
                            <p className="text-gray-900 dark:text-white tracking-light text-2xl font-bold leading-tight">{followingCount}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Following</p>
                        </div>
                    </div>
                </div>

                <ProfileTabs courses={courses} paths={paths} />

            </div>
        </div>
    )
}
