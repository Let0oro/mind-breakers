import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { PathListItem } from '@/lib/types'

export const metadata = {
  title: 'Learning Paths - MindBreaker',
  description: 'Browse and explore learning paths',
}

export default async function PathsListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all paths with related data
  const { data: paths } = await supabase
    .from('learning_paths')
    .select(`
      id,
      title,
      summary,
      description,
      created_at,
      organizations (id, name),
      courses (id),
      saved_paths!saved_paths_path_id_fkey (user_id)
    `)
    .order('created_at', { ascending: false })

  // Fetch user progress
  const { data: userProgress } = await supabase
    .from('user_course_progress')
    .select('course_id, completed')
    .eq('user_id', user.id)
    .eq('completed', true)

  const completedCourseIds = new Set(userProgress?.map(p => p.course_id) || [])

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Learning Paths</h2>
          <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
            {paths?.length || 0} learning paths available
          </p>
        </div>
        <Link
          href="/dashboard/paths/new"
          className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-gray-900 dark:text-white font-bold transition-all hover:bg-[#137fec]/80"
        >
          <span className="material-symbols-outlined w-5 h-5">add_circle</span>
          <span>Create Path</span>
        </Link>
      </header>

      {/* Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths && paths.length > 0 ? (
          paths.map((path: PathListItem) => {
            const courseCount = path.courses?.length || 0
            const completedCount = path.courses?.filter((c) =>
              completedCourseIds.has(c.id)
            ).length || 0
            const progressPercent = courseCount > 0 ? (completedCount / courseCount) * 100 : 0
            const isSaved = path.saved_paths?.some(sp => sp.user_id === user.id) || false

            // Supabase returns organizations as an array, get first one
            const org = Array.isArray(path.organizations) ? path.organizations[0] : path.organizations

            return (
              <Link
                key={path.id}
                href={`/dashboard/paths/${path.id}`}
                className="group bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/50 transition-all p-6 flex flex-col gap-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg group-hover:text-[#137fec] transition-colors line-clamp-2">
                      {path.title}
                    </h3>
                    {org && (
                      <p className="text-gray-600 dark:text-[#b0bfcc] text-sm mt-1">
                        by {org.name}
                      </p>
                    )}
                  </div>
                  {isSaved && (
                    <span className="material-symbols-outlined text-[#137fec]">
                      bookmark
                    </span>
                  )}
                </div>

                {/* Summary */}
                {path.summary && (
                  <p className="text-gray-600 dark:text-[#b0bfcc] text-sm line-clamp-2">
                    {path.summary}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-[#b0bfcc]">
                    <span className="material-symbols-outlined text-base">school</span>
                    <span>{courseCount} courses</span>
                  </div>
                  {progressPercent > 0 && (
                    <div className="flex items-center gap-1 text-green-500">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>{completedCount} completed</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {courseCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-[#b0bfcc]">Progress</span>
                      <span className="text-gray-900 dark:text-white font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-[#3b4754] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#137fec] rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })
        ) : (
          <div className="col-span-full bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-[#3b4754] mb-4 block">
              route
            </span>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-lg mb-2">No learning paths yet</p>
            <p className="text-gray-600 dark:text-[#b0bfcc] text-sm mb-4">Create your first learning path</p>
            <Link
              href="/dashboard/paths/new"
              className="inline-block bg-[#137fec] hover:bg-[#137fec]/80 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Create Path
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
