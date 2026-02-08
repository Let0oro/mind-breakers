import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardCourse } from '@/components/ui/CardCourse'
import { CardPath } from '@/components/ui/CardPath'
import Recommendations from '@/components/features/Recommendations'
import { getLevelProgress } from '@/lib/gamification'
import {
  getUserProgressCached,
  getUserSavedQuestsCached,
  getUserSavedPathsCached,
  getUserRecentActivityCached,
  getUserSavedPathsWithCoursesCached,
  getPublishedCoursesWithOrgsCached,
  getSavedCoursesByIdsCached
} from '@/lib/cache'

interface DashboardCourse {
  id: string
  title: string
  organization?: string
  instructor?: string
  duration?: string
  progress: number
  thumbnail_url?: string
  xp_reward: number
  status: string
}

interface DashboardLearningPath {
  id: string
  title: string
  completedCourses: number
  totalCourses: number
  nextCourse: string
  nextCourseId?: string
  color: string
  summary?: string
}

interface DashboardSavedCourse {
  id: string
  title: string
  xp_reward: number
  thumbnail_url?: string
}

interface DashboardSavedPath {
  id: string
  title: string
  xp_reward: number
  thumbnail_url?: string
}



export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Parallel fetch of all cached user data
  const [
    profile,
    userProgress,
    savedCourseIds,
    savedPathIds,
    recentActivity,
    savedDashboardPaths,
    publishedCourses
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
    getUserProgressCached(supabase, user.id),
    getUserSavedQuestsCached(supabase, user.id),
    getUserSavedPathsCached(supabase, user.id),
    getUserRecentActivityCached(supabase, user.id),
    getUserSavedPathsWithCoursesCached(supabase, user.id, 5),
    getPublishedCoursesWithOrgsCached(supabase, 3)
  ])

  const completedCourseIds = new Set(userProgress.filter(p => p.completed).map(p => p.course_id))

  const lastCourse = recentActivity?.courses ? (Array.isArray(recentActivity.courses) ? recentActivity.courses[0] : recentActivity.courses) : null

  const learningPathsData = savedDashboardPaths?.map(p => Array.isArray(p.path) ? p.path[0] : p.path) || []

  const learningPathsList: DashboardLearningPath[] = learningPathsData?.map(path => {
    const sortedCourses = [...(path.courses || [])].sort((a: { order_index: number }, b: { order_index: number }) => (a.order_index || 0) - (b.order_index || 0))
    const totalCourses = sortedCourses.length
    const completedCourses = sortedCourses.filter((c: { id: string }) => completedCourseIds.has(c.id)).length
    const nextCourseData = sortedCourses.find((c: { id: string, title: string }) => !completedCourseIds.has(c.id))

    return {
      id: path.id,
      title: path.title,
      summary: path.summary,
      completedCourses,
      totalCourses,
      nextCourse: nextCourseData?.title || (completedCourses === totalCourses ? '✓ Completed!' : 'Start Path'),
      nextCourseId: nextCourseData?.id,
      color: 'primary',
    }
  }) || []

  // --- Resume Logic ---
  let resumeTarget = null

  if (lastCourse) {
    if (!recentActivity!.completed) {
      resumeTarget = {
        href: `/dashboard/quests/${lastCourse.id}`,
        label: `Resume: ${lastCourse.title}`,
      }
    } else {
      const { data: courseWithPath } = await supabase
        .from('courses')
        .select('path_id, order_index')
        .eq('id', lastCourse.id)
        .single()

      if (courseWithPath?.path_id) {
        const { data: nextCourseInPath } = await supabase
          .from('courses')
          .select('id, title')
          .eq('path_id', courseWithPath.path_id)
          .gt('order_index', courseWithPath.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (nextCourseInPath) {
          const isNextCompleted = completedCourseIds.has(nextCourseInPath.id)
          if (!isNextCompleted) {
            resumeTarget = {
              href: `/dashboard/quests/${nextCourseInPath.id}`,
              label: `Start: ${nextCourseInPath.title}`,
            }
          }
        }
      }
    }
  }

  if (!resumeTarget) {
    const firstIncompletePath = learningPathsList.find(path => path.completedCourses < path.totalCourses && path.nextCourseId);
    if (firstIncompletePath) {
      resumeTarget = {
        href: `/dashboard/quests/${firstIncompletePath.nextCourseId}`,
        label: `Continue: ${firstIncompletePath.title}`
      }
    }
  }

  // Combine progress with published courses
  const progressMap = new Map(userProgress.map(p => [p.course_id, p]))
  const enrolledCourses: DashboardCourse[] = publishedCourses?.map((course: {
    id: string
    title: string
    thumbnail_url?: string | null
    xp_reward: number
    status: string
    organizations: { name: string } | { name: string }[] | null
  }) => ({
    id: course.id,
    title: course.title,
    thumbnail_url: course.thumbnail_url || undefined,
    xp_reward: course.xp_reward || 100,
    status: course.status,
    progress: progressMap.get(course.id)?.completed ? 100 : 0,
    duration: '8h',
    instructor: Array.isArray(course.organizations) ? course.organizations[0]?.name : course.organizations?.name || 'Unknown Organization',
  })) || []

  // Fetch saved courses using cached function
  const savedCoursesData = savedCourseIds.length > 0
    ? await getSavedCoursesByIdsCached(supabase, savedCourseIds, 5)
    : []

  const savedCourses: DashboardSavedCourse[] = savedCoursesData?.map((course) => ({
    id: course.id,
    title: course.title,
    thumbnail_url: course.thumbnail_url || undefined,
    xp_reward: course.xp_reward || 100,
  })) || []

  const xpProgress = getLevelProgress(profile?.total_xp || 0, profile?.level || 1)

const savedPathsData = savedPathIds.length > 0
    ? await getSavedCoursesByIdsCached(supabase, savedPathIds, 5)
    : []

  const savedPaths: DashboardSavedPath[] = savedPathsData?.map((path) => ({
    id: path.id,
    title: path.title,
    thumbnail_url: path.thumbnail_url || undefined,
    xp_reward: path.xp_reward || 100,
  })) || []


  return (
    <>
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-end gap-6 mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main text-4xl font-black italic tracking-tight">DASHBOARD</h1>
          <p className="text-muted text-sm">Level {profile?.level || 1} • {profile?.username?.split(' ')[0] || 'Scholar'}</p>
        </div>
        {resumeTarget && (
          <Link
            href={resumeTarget.href}
            className="flex items-center gap-2 px-6 py-3 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
          >
            <span>{resumeTarget.label}</span>
          </Link>
        )}
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        {/* XP Progress Card */}
        <div className="lg:col-span-3 p-6 border border-border bg-main">
          <div className="flex items-center gap-4 mb-4">
            <span className="material-symbols-outlined text-3xl text-text-main">star</span>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Level {profile?.level || 1}</p>
              <p className="text-2xl font-black text-text-main">{profile?.total_xp?.toLocaleString() || 0} XP</p>
            </div>
          </div>
          <div className="w-full bg-surface h-2 mb-2">
            <div
              className="bg-text-main h-2 transition-all duration-500"
              style={{ width: `${xpProgress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {xpProgress.current} / {xpProgress.required} XP to Level {(profile?.level || 1) + 1}
          </p>
        </div>

        {/* Stats Card */}
        <div className="lg:col-span-1 p-6 border border-border bg-main">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted">Courses</span>
              <span className="text-lg font-black text-text-main">{userProgress.filter(p => p.completed).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted">Paths</span>
              <span className="text-lg font-black text-text-main">{learningPathsList.filter(p => p.completedCourses === p.totalCourses && p.totalCourses > 0).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted">🔥 Streak</span>
              <span className="text-lg font-black text-text-main">{profile?.streak_days || 0}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-text-main uppercase tracking-wide">Continue Learning</h2>
          <Link
            href="/dashboard/quests"
            className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
          >
            Browse Courses →
          </Link>
        </div>
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map(course => (
              <CardCourse
                key={course.id}
                id={course.id}
                title={course.title}
                organizationName={course.instructor || 'Unknown Organization'}
                progress={course.progress}
                xp_reward={course.xp_reward}
                thumbnail_url={course.thumbnail_url}
                status={course.status}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-muted p-8 text-center">
            <p className="text-muted text-sm">No courses yet. Start exploring!</p>
            <Link
              href="/dashboard/quests"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-text-main hover:underline"
            >
              Browse Courses →
            </Link>
          </div>
        )}
      </section>

      {/* Learning Paths Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-text-main uppercase tracking-wide">Learning Paths</h2>
          <Link
            href="/dashboard/paths"
            className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
          >
            Explore Paths →
          </Link>
        </div>
        {learningPathsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPathsList.map(path => (
              <CardPath
                key={path.id}
                id={path.id}
                title={path.title}
                summary={path.summary}
                totalCourses={path.totalCourses}
                completedCourses={path.completedCourses}
                variant="card"
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-muted p-8 text-center">
            <p className="text-muted text-sm">No learning paths saved yet.</p>
            <Link
              href="/dashboard/paths"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-text-main hover:underline"
            >
              Explore Paths →
            </Link>
          </div>
        )}
      </section>

      {/* Saved Courses Section */}
      {savedCourses.length > 0 && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-main uppercase tracking-wide">Saved Courses</h2>
            <Link
              href="/dashboard/library"
              className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
            >
              View Library →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {savedCourses.map(course => (
              <Link
                key={course.id}
                href={`/dashboard/quests/${course.id}`}
                className="border border-border p-3 hover:border-text-main transition-colors group"
              >
                <p className="text-sm font-bold text-text-main truncate group-hover:underline">{course.title}</p>
                <p className="text-xs text-muted mt-1">{course.xp_reward} XP</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Saved Paths Section */}
      {savedPaths.length > 0 && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text-main uppercase tracking-wide">Saved Paths</h2>
            <Link
              href="/dashboard/library"
              className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
            >
              View Library →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {savedPaths.map(path => (
              <Link
                key={path.id}
                href={`/dashboard/paths/${path.id}`}
                className="border border-border p-3 hover:border-text-main transition-colors group"
              >
                <p className="text-sm font-bold text-text-main truncate group-hover:underline">{path.title}</p>
                <p className="text-xs text-muted mt-1">{path.xp_reward} XP</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations Section */}
      <Recommendations mode="similar" />
    </>
  )
}
