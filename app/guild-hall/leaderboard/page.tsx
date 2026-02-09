import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'


export const metadata = {
  title: 'Leaderboard - MindBreaker',
  description: 'Top learners and rankings',
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: topUsers } = await supabase
    .from('profiles')
    .select('id, username, level, total_xp')
    .order('total_xp', { ascending: false })
    .limit(50)

  const currentUserIndex = topUsers?.findIndex(u => u.id === user.id) ?? -1
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null

  return (
    <>
      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-wrap justify-between items-end gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-text-main text-4xl font-black italic tracking-tight">LEADERBOARD</h1>
            <p className="text-muted text-sm">
              Top {topUsers?.length || 0} learners ranked by experience
            </p>
          </div>
          {currentUserRank && (
            <div className="px-4 py-2 border border-text-main">
              <p className="text-text-main text-xs font-bold uppercase tracking-widest">Your Rank: #{currentUserRank}</p>
            </div>
          )}
        </div>
      </header>

      {/* Leaderboard Table */}
      <div className="border border-border bg-main overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-dark">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">Player</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">Level</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topUsers && topUsers.length > 0 ? (
                topUsers.map((profile, index) => {
                  const rank = index + 1
                  const isCurrentUser = profile.id === user.id

                  return (
                    <tr
                      key={profile.id}
                      className={`transition-colors ${isCurrentUser
                        ? 'bg-inverse/5 border-l-2 border-text-main'
                        : 'hover:bg-surface'
                        }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {rank <= 3 ? (
                            <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm border ${rank === 1 ? 'border-text-main text-text-main' :
                              rank === 2 ? 'border-muted text-muted' :
                                'border-muted text-muted'
                              }`}>
                              {rank}
                            </div>
                          ) : (
                            <span className="text-muted text-sm">#{rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Player */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/guild-hall/users/${profile.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-surface-dark flex items-center justify-center">
                              <span className="text-text-main font-bold text-xs uppercase">
                                {profile.username?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-text-main font-bold text-xs uppercase tracking-wide">
                                {profile.username || 'Anonymous'}
                                {isCurrentUser && (
                                  <span className="ml-2 text-muted">(You)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-text-main text-xs font-bold">Level {profile.level}</span>
                      </td>

                      {/* Total XP */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-text-main font-bold text-xs">
                          {profile.total_xp?.toLocaleString() || 0} XP
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-muted text-sm">No data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {topUsers && topUsers.length >= 3 && (
        <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="w-14 h-14 border-2 border-muted flex items-center justify-center mb-3">
              <span className="text-muted text-xl font-bold">2</span>
            </div>
            <p className="text-text-main font-bold text-xs uppercase tracking-wide text-center truncate w-full">
              {topUsers[1]?.username || 'Anonymous'}
            </p>
            <p className="text-muted text-xs">{topUsers[1]?.total_xp?.toLocaleString()} XP</p>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-2 border-text-main flex items-center justify-center mb-3 relative">
              <span className="text-text-main text-2xl font-bold">1</span>
              <div className="absolute -top-6">
                <span className="material-symbols-outlined text-2xl text-text-main">workspace_premium</span>
              </div>
            </div>
            <p className="text-text-main font-bold text-sm uppercase tracking-wide text-center truncate w-full">
              {topUsers[0]?.username || 'Anonymous'}
            </p>
            <p className="text-muted text-xs">{topUsers[0]?.total_xp?.toLocaleString()} XP</p>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-16">
            <div className="w-12 h-12 border-2 border-muted flex items-center justify-center mb-3">
              <span className="text-muted text-lg font-bold">3</span>
            </div>
            <p className="text-text-main font-bold text-xs uppercase tracking-wide text-center truncate w-full">
              {topUsers[2]?.username || 'Anonymous'}
            </p>
            <p className="text-muted text-xs">{topUsers[2]?.total_xp?.toLocaleString()} XP</p>
          </div>
        </div>
      )}
    </>
  )
}
