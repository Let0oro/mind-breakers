import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { PathListItem } from '@/lib/types'
import { CardPath } from '@/components/ui/CardPath'
import {
  getUserSavedPathsCached,
  getUserProgressCached,
  getUserCreatedPathIdsCached,
  getPathIdsFromCourseProgressCached,
  getPathsByIdsCached
} from '@/lib/cache'

export const metadata = {
  title: 'Learning Paths - MindBreaker',
  description: 'Browse and explore learning paths',
}

export default async function PathsListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use cached queries for all user data
  const [savedPathIds, userProgress, createdPathIds] = await Promise.all([
    getUserSavedPathsCached(supabase, user.id),
    getUserProgressCached(supabase, user.id),
    getUserCreatedPathIdsCached(supabase, user.id)
  ])

  const completedCourseIds = new Set(
    userProgress.filter(p => p.completed).map(p => p.course_id)
  )
  const savedSet = new Set(savedPathIds)

  // Get path IDs from user's course progress (cached)
  const progressCourseIds = userProgress.map(p => p.course_id).filter(Boolean)
  const progressPathIds = await getPathIdsFromCourseProgressCached(supabase, user.id, progressCourseIds)

  // Combine all path IDs
  const pathIds = [...new Set([
    ...createdPathIds,
    ...progressPathIds,
    ...savedPathIds
  ])]

  // Fetch paths by IDs (cached)
  const paths = await getPathsByIdsCached(supabase, pathIds)

  return (
    <>
      <header className="mb-10">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-text-main text-4xl font-black italic tracking-tight">expeditions</h1>
            <p className="text-muted text-sm">
              {paths.length} expeditions in your journey
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/guild-hall/world-map?tab=paths"
              className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-text-main hover:text-text-main transition-all"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span>Explore</span>
            </Link>
            <Link
              href="/guild-hall/expeditions/new"
              className="flex items-center gap-2 px-4 py-2 border border-text-main bg-inverse text-main-alt text-xs font-bold uppercase tracking-widest hover:bg-text-main transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Create</span>
            </Link>
          </div>
        </div>
      </header>

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
          <div className="col-span-full border border-border p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-muted mb-4 block">route</span>
            <p className="text-muted text-sm mb-1">No learning paths</p>
            <p className="text-muted text-xs mb-6">Start your journey by finding a learning path</p>
            <Link
              href="/guild-hall/world-map?tab=paths"
              className="inline-block px-4 py-2 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
            >
              Explore Paths
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
