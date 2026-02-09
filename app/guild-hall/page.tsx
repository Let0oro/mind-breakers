import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PartyHallSidebar } from '@/components/features/PartyHallSidebar'
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
        href: `/guild-hall/quests/${lastCourse.id}`,
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
              href: `/guild-hall/quests/${nextCourseInPath.id}`,
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
        href: `/guild-hall/quests/${firstIncompletePath.nextCourseId}`,
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
    <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 md:py-8 scroll-smooth">
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-end gap-6 mb-10">
        <h1 className="text-5xl font-header text-foreground tracking-tight">Guild Hall</h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted">Reputation</span>
            <span className="text-lg font-bold text-inverse">{profile?.total_xp?.toLocaleString() || 0} XP</span>
          </div>
          <div className="w-px h-8 bg-border/50 mx-2"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted">Chain</span>
            <span className="text-lg font-bold text-inverse italic">{profile?.streak_days || 0} Days</span>
          </div>
        </div>
        {resumeTarget && (
          <Link
            href={resumeTarget.href}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-foreground dark:bg-background text-background dark:text-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md"
          >
            <span>{resumeTarget.label.replace('Start:', 'Begin Quest:').replace('Resume:', 'Resume Quest:').replace('Continue:', 'Continue Campaign:')}</span>
          </Link>
        )}
      </header>


      {/* Monthly Featured Quests / Quests */}
      {/* <section className="mb-12 relative">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-gold material-symbols-outlined">verified</span>
          <h2 className="text-2xl font-header text-foreground italic">Monthly Featured Quests</h2>
        </div>

        <div className="relative p-8 md:p-12 border border-border bg-background/50 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="border border-destructive text-destructive px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest">S-Rank Bounty</span>
                <span className="text-xs text-muted uppercase tracking-widest">Urgent Quest</span>
              </div>
              <h3 className="text-4xl font-header text-foreground leading-tight">
                Slaying the Technical Debt Dragon
              </h3>
              <p className="text-muted italic font-serif text-lg leading-relaxed max-w-lg">
                &quot;The legacy codebase whispers of ancient errors and forgotten logic. Traverse the authentication modules and purge the inefficiencies that haunt our systems.&quot;
              </p>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-border pl-8 md:min-w-[200px]">
              <span className="text-[10px] uppercase tracking-widest text-muted mb-2">Completion Reward</span>
              <span className="text-3xl font-header text-gold mb-1">+500 XP</span>
              <span className="text-[10px] italic text-muted mb-6">Rare Badge: Void Walker</span>
              <button className="bg-forest hover:bg-forest/90 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors w-full">
                Accept Bounty
              </button>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-destructive"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold"></div>
        </div>
      </section> */}

      {/* Ongoing Expeditions (Learning Paths) */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted text-sm">explore</span>
            <h2 className="text-xl font-header text-foreground italic">Ongoing Expeditions</h2>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Logbook</span>
        </div>

        {learningPathsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
          <div className="p-8 border border-dashed border-border text-center bg-background/30">
            <p className="text-muted italic mb-4">&quot;No expeditions currently charted in your logbook.&quot;</p>
            <Link href="/guild-hall/expeditions" className="text-gold hover:text-gold/80 text-xs font-bold uppercase tracking-widest border-b border-gold/30 hover:border-gold pb-0.5 transition-all">
              Chart New Course →
            </Link>
          </div>
        )}
      </section>

      {/* Available Quests (Courses) */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-header text-foreground italic">Available Quests</h2>
          <Link
            href="/guild-hall/quests"
            className="text-xs font-bold uppercase tracking-widest text-muted hover:text-gold transition-colors"
          >
            View Quest Board →
          </Link>
        </div>
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {enrolledCourses.map(course => (
              <CardCourse
                key={course.id}
                id={course.id}
                title={course.title}
                organizationName={course.instructor || 'Unknown Guild'}
                progress={course.progress}
                xp_reward={course.xp_reward}
                thumbnail_url={course.thumbnail_url}
                status={course.status}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border p-8 text-center bg-background/30">
            <p className="text-muted text-sm italic">No quests posted yet.</p>
            <Link
              href="/guild-hall/quests"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-gold hover:underline"
            >
              Check Board →
            </Link>
          </div>
        )}
      </section>

      {/* Saved Archives (Library) */}
      {(savedCourses.length > 0 || savedPaths.length > 0) && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-header text-foreground italic">Saved Archives</h2>
            <Link
              href="/guild-hall/archives"
              className="text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors"
            >
              Enter Archives →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Combine logic or separate, keeping separate for now but cleaner */}
            {savedCourses.map(course => (
              <Link
                key={course.id}
                href={`/guild-hall/quests/${course.id}`}
                className="border border-border p-4 bg-background hover:border-gold transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gold/20 group-hover:bg-gold transition-colors"></div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Scroll</p>
                <p className="text-sm font-bold text-foreground truncate group-hover:text-gold transition-colors font-header">{course.title}</p>
              </Link>
            ))}
            {savedPaths.map(path => (
              <Link
                key={path.id}
                href={`/guild-hall/expeditions/${path.id}`}
                className="border border-border p-4 bg-background hover:border-forest transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-forest/20 group-hover:bg-forest transition-colors"></div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Map</p>
                <p className="text-sm font-bold text-foreground truncate group-hover:text-forest transition-colors font-header">{path.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Guild Recommendations */}
      <Recommendations mode="similar" />
    </div>
  )
}
