import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PathCard } from '@/components/PathCard'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import Link from 'next/link'
import type { PathListItem } from '@/lib/types'

export default async function PathsListPage({
  searchParams,
}: {
  searchParams: { q?: string; org?: string; sort?: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const query = searchParams.q || ''
  const orgFilter = searchParams.org || ''
  const sortBy = searchParams.sort || 'recent'

  // Query base
  let pathsQuery = supabase
    .from('learning_paths')
    .select(`
      *,
      organizations (id, name),
      courses (id),
      saved_paths!saved_paths_path_id_fkey (user_id)
    `)

  // Filtro de búsqueda
  if (query) {
    pathsQuery = pathsQuery.or(`title.ilike.%${query}%,summary.ilike.%${query}%,description.ilike.%${query}%`)
  }

  // Filtro de organización
  if (orgFilter) {
    pathsQuery = pathsQuery.eq('author_id', orgFilter)
  }

  // Ordenamiento
  if (sortBy === 'popular') {
    // Ordenar por número de cursos (más cursos = más popular)
    pathsQuery = pathsQuery.order('created_at', { ascending: false })
  } else if (sortBy === 'name') {
    pathsQuery = pathsQuery.order('title', { ascending: true })
  } else {
    pathsQuery = pathsQuery.order('created_at', { ascending: false })
  }

  const { data: paths } = await pathsQuery

  // Obtener organizaciones para el filtro
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name')

  // Obtener progreso del usuario
  const { data: userProgress } = await supabase
    .from('user_course_progress')
    .select('course_id, completed')
    .eq('user_id', user.id)
    .eq('completed', true)

  const completedCourseIds = new Set(userProgress?.map(p => p.course_id) || [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2 inline-block"
              >
                ← Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Explorar Learning Paths
              </h1>
            </div>
            <Link
              href="/dashboard/paths/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Crear nuevo path
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SearchAndFilter organizations={organizations || []} />

        {paths && paths.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {paths.length} path{paths.length !== 1 ? 's' : ''} encontrado{paths.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paths.map((path: PathListItem) => {
                const courseCount = path.courses?.length || 0
                const completedCount = path.courses?.filter((c) => 
                  completedCourseIds.has(c.id)
                ).length || 0

                return (
                  <PathCard
                    key={path.id}
                    id={path.id}
                    title={path.title}
                    summary={path.summary}
                    organization={path.organizations?.name}
                    courseCount={courseCount}
                    completedCount={completedCount}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No se encontraron paths con esos criterios.
            </p>
            <Link
              href="/dashboard/paths"
              className="inline-block text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Limpiar filtros →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
