import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LevelBadge } from '@/components/LevelBadge'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Top 100 usuarios
  const { data: topUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('total_xp', { ascending: false })
    .limit(100)

  // Posición del usuario actual
  const { count: userRank } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_xp', topUsers?.find(u => u.id === user.id)?.total_xp || 0)

  const currentUserRank = (userRank || 0) + 1

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 inline-block"
              >
                ← Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🏆 Ranking Global
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Tu posición: #{currentUserRank}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    XP Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topUsers?.map((profile, index) => {
                  const isCurrentUser = profile.id === user.id
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null

                  return (
                    <tr
                      key={profile.id}
                      className={`${
                        isCurrentUser
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {medal && <span className="text-2xl">{medal}</span>}
                          <span className={`text-lg font-bold ${
                            isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                            {profile.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className={`font-medium ${
                              isCurrentUser ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white'
                            }`}>
                              {profile.username}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                                  (Tú)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-sm ${
                            profile.level < 5 ? 'bg-green-500' :
                            profile.level < 10 ? 'bg-blue-500' :
                            profile.level < 20 ? 'bg-purple-500' :
                            profile.level < 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}>
                            {profile.level}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Nivel {profile.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                          {profile.total_xp.toLocaleString()} XP
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
