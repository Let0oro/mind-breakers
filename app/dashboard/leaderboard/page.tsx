import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'


export const metadata = {
  title: 'Leaderboard - MindBreaker',
  description: 'Top learners and rankings',
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Fetch top users by XP
  const { data: topUsers } = await supabase
    .from('profiles')
    .select('id, username, level, total_xp')
    .order('total_xp', { ascending: false })
    .limit(50)

  // Get current user rank
  const currentUserIndex = topUsers?.findIndex(u => u.id === user.id) ?? -1
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap justify-between items-end gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Leaderboard</h2>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
              Top {topUsers?.length || 0} learners ranked by experience
            </p>
          </div>
          {currentUserRank && (
            <div className="bg-[#137fec]/20 border border-[#137fec]/30 rounded-lg px-4 py-2">
              <p className="text-[#137fec] text-sm font-bold">Your Rank: #{currentUserRank}</p>
            </div>
          )}
        </div>
      </header>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#283039]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-[#b0bfcc] uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-[#b0bfcc] uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-[#b0bfcc] uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-[#b0bfcc] uppercase tracking-wider">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b4754]">
              {topUsers && topUsers.length > 0 ? (
                topUsers.map((profile, index) => {
                  const rank = index + 1
                  const isCurrentUser = profile.id === user.id

                  return (
                    <tr
                      key={profile.id}
                      className={`transition-colors ${isCurrentUser
                        ? 'bg-[#137fec]/10 border-l-2 border-[#137fec]'
                        : 'hover:bg-gray-50 dark:hover:bg-[#283039]'
                        }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {rank <= 3 ? (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                              rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                'bg-orange-700/20 text-orange-700'
                              }`}>
                              {rank}
                            </div>
                          ) : (
                            <span className="text-gray-600 dark:text-[#b0bfcc] font-medium">#{rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Player */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#137fec]/20 flex items-center justify-center">
                            <span className="text-[#137fec] font-bold">
                              {profile.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-bold text-sm">
                              {profile.username || 'Anonymous'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-[#137fec]">(You)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined w-5 h-5 text-[#137fec]">star</span>
                          <span className="text-gray-900 dark:text-white font-medium">Level {profile.level}</span>
                        </div>
                      </td>

                      {/* Total XP */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-white font-bold">
                          {profile.total_xp?.toLocaleString() || 0} XP
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-gray-600 dark:text-[#b0bfcc]">No data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {topUsers && topUsers.length >= 3 && (
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          {/* 2nd Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="w-16 h-16 rounded-full bg-gray-400/20 border-4 border-gray-400 flex items-center justify-center mb-3">
              <span className="text-gray-400 text-2xl font-bold">2</span>
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-sm text-center truncate w-full">
              {topUsers[1]?.username || 'Anonymous'}
            </p>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">{topUsers[1]?.total_xp?.toLocaleString()} XP</p>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-4 border-yellow-500 flex items-center justify-center mb-3 relative">
              <span className="text-yellow-500 text-3xl font-bold">1</span>
              <div className="absolute -top-8">
                <span className="material-symbols-outlined w-8 h-8 text-yellow-500">star</span>
              </div>
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-base text-center truncate w-full">
              {topUsers[0]?.username || 'Anonymous'}
            </p>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-sm">{topUsers[0]?.total_xp?.toLocaleString()} XP</p>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center pt-16">
            <div className="w-14 h-14 rounded-full bg-orange-700/20 border-4 border-orange-700 flex items-center justify-center mb-3">
              <span className="text-orange-700 text-xl font-bold">3</span>
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-sm text-center truncate w-full">
              {topUsers[2]?.username || 'Anonymous'}
            </p>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">{topUsers[2]?.total_xp?.toLocaleString()} XP</p>
          </div>
        </div>
      )}
    </>
  )
}
