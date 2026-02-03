import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { PathListItem } from '@/lib/types'
import { CardPath } from '@/components/ui/CardPath'

export const metadata = {
  title: 'Learning Paths - MindBreaker',
  description: 'Browse and explore learning paths',
}

export default async function PathsListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user-related paths
  // 1. Paths created by user
  const { data: createdPaths } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('created_by', user.id)

  // 2. Paths with progress (via courses)
  const { data: progressPaths } = await supabase
    .from('user_course_progress')
    .select(`
            courses (
                path_id
            )
        `)
    .eq('user_id', user.id)

  // Extract path IDs
  const progressPathIds = progressPaths?.map((p: { courses: { path_id: string }[] | null }) => p.courses?.[0]?.path_id).filter(Boolean) || []

  // 3. Saved paths
  const { data: savedPaths } = await supabase
    .from('saved_paths')
    .select('path_id')
    .eq('user_id', user.id)

  // Combine all IDs
  const pathIds = new Set([
    ...(createdPaths?.map(p => p.id) || []),
    ...progressPathIds,
    ...(savedPaths?.map(p => p.path_id) || [])
  ])

  let paths: PathListItem[] = []

  if (pathIds.size > 0) {
    const { data } = await supabase
      .from('learning_paths')
      .select(`
                id,
                title,
                summary,
                description,
                created_at,
                is_validated,
                created_by,
                organizations (id, name),
                courses (id),
                saved_paths!saved_paths_path_id_fkey (user_id)
            `)
      .in('id', Array.from(pathIds))
      .order('created_at', { ascending: false })

    paths = data || []
  }

  // Fetch user progress for all paths (to calculate completion)
  const { data: userProgress } = await supabase
    .from('user_course_progress')
    .select('course_id, completed')
    .eq('user_id', user.id)
    .eq('completed', true)

  const completedCourseIds = new Set(userProgress?.map(p => p.course_id) || [])
  const savedSet = new Set(savedPaths?.map(s => s.path_id) || [])

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">My Learning Paths</h2>
          <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
            {paths.length} paths in your journey
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/explore?tab=paths"
            className="flex items-center gap-2 h-11 px-6 rounded-lg border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white font-medium transition-all hover:bg-gray-50 dark:hover:bg-[#283039]"
          >
            <span className="material-symbols-outlined w-5 h-5">search</span>
            <span>Explore Paths</span>
          </Link>
          <Link
            href="/dashboard/paths/new"
            className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-gray-900 dark:text-white font-bold transition-all hover:bg-[#137fec]/80"
          >
            <span className="material-symbols-outlined w-5 h-5">add_circle</span>
            <span>Create Path</span>
          </Link>
        </div>
      </header>

      {/* Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.length > 0 ? (
          paths.map((path: PathListItem) => {
            const courseCount = path.courses?.length || 0
            const completedCount = path.courses?.filter((c) =>
              completedCourseIds.has(c.id)
            ).length || 0
            const progressPercent = courseCount > 0 ? (completedCount / courseCount) * 100 : 0
            const isSaved = savedSet.has(path.id)
            const isOwner = path.created_by === user.id

            // Supabase returns organizations as an array, get first one
            const org = Array.isArray(path.organizations) ? path.organizations[0] : path.organizations

            return (
              <CardPath
                key={path.id}
                id={path.id}
                title={path.title}
                summary={path.summary}
                completedCourses={completedCount}
                totalCourses={courseCount}
                progressPercent={progressPercent}
                isSaved={isSaved}
                isValidated={path.is_validated}
                isOwner={isOwner}
                organizationName={org?.name}
                variant="card"
              />
            )
          })
        ) : (
          <div className="col-span-full bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[#3b4754] mb-4 block mx-auto">
              route
            </span>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-lg mb-2">No active learning paths</p>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-sm mb-4">Start your journey by finding a learning path</p>
            <Link
              href="/dashboard/explore?tab=paths"
              className="inline-block bg-[#137fec] hover:bg-[#137fec]/80 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Explore Paths
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
