import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { LevelBadge } from '@/components/LevelBadge'
import Link from 'next/link'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import type { SavedPathItem, RecentProgressItem } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Obtener paths guardados
  const { data: savedPaths } = await supabase
    .from('saved_paths')
    .select(`
      path_id,
      learning_paths (
        id,
        title,
        summary,
        created_at,
        organizations (name)
      )
    `)
    .eq('user_id', user.id)

  // Obtener progreso reciente
  const { data: recentProgress } = await supabase
    .from('user_course_progress')
    .select(`
      *,
      courses (
        title,
        learning_paths (title)
      )
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Learning Tracker
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/paths"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Explorar Paths
              </Link>
              <Link
                href="/dashboard/leaderboard"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                🏆 Ranking
              </Link>
              <NotificationBell userId={user.id} />
              <ThemeToggle />
              <form action="/auth/signout" method="post">
                <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Perfil y nivel */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {profile?.username || user.email}
              </h2>
              <LevelBadge 
                level={profile?.level || 1} 
                xp={profile?.total_xp || 0} 
              />
              
              <div className="mt-6 space-y-3">
                <Link
                  href="/dashboard/paths/new"
                  className="block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Crear nuevo Path
                </Link>
                <Link
                  href="/dashboard/courses/new"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Agregar curso
                </Link>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Paths guardados */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mis Paths
                </h2>
                <Link
                  href="/dashboard/paths"
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Ver todos
                </Link>
              </div>
              
              {savedPaths && savedPaths.length > 0 ? (
                <div className="space-y-3">
                  {savedPaths.map((item) => {
                    const typedItem = item as unknown as SavedPathItem
                    return (
                      <Link
                        key={typedItem.path_id}
                        href={`/dashboard/paths/${typedItem.path_id}`}
                        className="block rounded-lg border p-4 hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:bg-gray-700"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {typedItem.learning_paths.title}
                        </h3>
                        {typedItem.learning_paths.summary && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {typedItem.learning_paths.summary}
                          </p>
                        )}
                        {typedItem.learning_paths.organizations && (
                          <p className="mt-2 text-xs text-gray-500">
                            Por {typedItem.learning_paths.organizations.name}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tienes paths guardados aún.{' '}
                  <Link href="/dashboard/paths" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    Explora paths
                  </Link>
                </p>
              )}
            </div>

            {/* Progreso reciente */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Progreso reciente
              </h2>
              
              {recentProgress && recentProgress.length > 0 ? (
                <div className="space-y-3">
                  {recentProgress.map((progress) => {
                    const typedProgress = progress as unknown as RecentProgressItem
                    return (
                      <div
                        key={typedProgress.id}
                        className="flex items-start justify-between border-l-4 border-green-500 bg-green-50 p-3 rounded dark:bg-green-900/20"
                      >
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {typedProgress.courses.title}
                          </p>
                          {typedProgress.courses.learning_paths && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {typedProgress.courses.learning_paths.title}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          +{typedProgress.xp_earned} XP
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aún no has completado ningún curso. ¡Empieza ahora!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
