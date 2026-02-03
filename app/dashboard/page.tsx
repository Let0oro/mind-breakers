import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardCourse } from '@/components/ui/CardCourse'
import { CardPath } from '@/components/ui/CardPath'

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

// Calculate XP required for next level
// Formula: Base XP * Level multiplier (escalates with level)
function getXpForNextLevel(level: number): number {
  const baseXP = 300
  const multiplier = 1.5
  return Math.round(baseXP * Math.pow(multiplier, level - 1))
}

// Get XP progress within current level
function getXpProgress(totalXp: number, level: number): { current: number; required: number; percentage: number } {
  // Calculate total XP needed to reach current level
  let xpForPreviousLevels = 0
  for (let i = 1; i < level; i++) {
    xpForPreviousLevels += getXpForNextLevel(i)
  }

  const xpInCurrentLevel = totalXp - xpForPreviousLevels
  const xpNeededForNextLevel = getXpForNextLevel(level)

  return {
    current: Math.max(0, xpInCurrentLevel),
    required: xpNeededForNextLevel,
    percentage: Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100))
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recentActivity } = await supabase
    .from('user_course_progress')
    .select(`
      course_id,
      completed,
      xp_earned,
      courses (
        id,
        title
      )
    `)
    .eq('user_id', user.id)
    .order('last_accessed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Supabase join types can be tricky. Safely cast or access.
  const lastCourse = recentActivity?.courses ? (Array.isArray(recentActivity.courses) ? recentActivity.courses[0] : recentActivity.courses) : null

  // Fetch Saved Paths for the dashboard summary
  // We prioritize saved paths to show active intent
  const { data: savedDashboardPaths } = await supabase
    .from('saved_paths')
    .select(`
      path:learning_paths (
        id,
        title,
        summary,
        courses (id, title, order_index)
      )
    `)
    .eq('user_id', user.id)
    .limit(5)

  // Handle Supabase relation returning array or object
  const learningPathsData = savedDashboardPaths?.map(p => Array.isArray(p.path) ? p.path[0] : p.path) || []

  // Calculate progress for paths
  // Note: accurate path progress calculation requires fetching all user progress which might be heavy. 
  // For now we will check simplified progress or mocking it to 0 if not easily available without N+1.
  // We can do a second query for cached progress if available or fetch user progress for all courses.
  const { data: allUserProgress } = await supabase.from('user_course_progress').select('course_id').eq('user_id', user.id)
  const completedCourseIds = new Set(allUserProgress?.map(p => p.course_id))

  const learningPathsList: DashboardLearningPath[] = learningPathsData?.map(path => {
    // Sort courses by order_index
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
      // Caso 1: Último curso visto no está completado -> Ir a ese curso
      resumeTarget = {
        href: `/dashboard/courses/${lastCourse.id}`,
        label: `Resume: ${lastCourse.title}`,
      }
    } else {
      // Caso 2: Último curso completado -> Buscar el siguiente del mismo path
      // Necesitamos saber el path_id del curso. 
      // Hacemos una query extra ligera para obtener el path y el siguiente curso.
      const { data: courseWithPath } = await supabase
        .from('courses')
        .select('path_id, order_index')
        .eq('id', lastCourse.id)
        .single()

      if (courseWithPath?.path_id) {
        // Buscar el siguiente curso en el path
        const { data: nextCourseInPath } = await supabase
          .from('courses')
          .select('id, title')
          .eq('path_id', courseWithPath.path_id)
          .gt('order_index', courseWithPath.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle()

        // Verificar si YA está completado (aunque sea "siguiente" en orden, podría haberlo hecho saltado? Asumimos linealidad normal)
        // Mejor verificar user_course_progress para ese nextCourse
        if (nextCourseInPath) {
          const { data: nextProgress } = await supabase
            .from('user_course_progress')
            .select('completed')
            .eq('user_id', user.id)
            .eq('course_id', nextCourseInPath.id)
            .single()

          if (!nextProgress?.completed) {
            resumeTarget = {
              href: `/dashboard/courses/${nextCourseInPath.id}`,
              label: `Start: ${nextCourseInPath.title}`,
            }
          }
        }
      }
    }
  }

  // Fallback: Si no hay resumeTarget aún, buscar en 'enrolled_paths' el primero incompleto.
  if (!resumeTarget) {
    const firstIncompletePath = learningPathsList.find(path => path.completedCourses < path.totalCourses && path.nextCourseId);
    if (firstIncompletePath) {
      resumeTarget = {
        href: `/dashboard/courses/${firstIncompletePath.nextCourseId}`,
        label: `Continue: ${firstIncompletePath.title}`
      }
    }
  }


  // Fetch enrolled courses with progress
  const { data: coursesWithProgress } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      thumbnail_url,
      xp_reward,
      status,
      organization:organizations(name),
      user_course_progress (
        completed,
        xp_earned
      )
    `)
    .eq('user_course_progress.user_id', user.id)
    .limit(3)


  const enrolledCourses: DashboardCourse[] = coursesWithProgress?.map((course: {
    id: string
    title: string
    thumbnail_url?: string | null
    xp_reward: number
    status: string
    organization: { name: string } | { name: string }[] | null
    user_course_progress: { completed: boolean }[]
  }) => ({
    id: course.id,
    title: course.title,
    thumbnail_url: course.thumbnail_url || undefined,
    xp_reward: course.xp_reward || 100,
    status: course.status,
    progress: course.user_course_progress?.[0]?.completed ? 100 : 0,
    duration: '8h',
    instructor: Array.isArray(course.organization) ? course.organization[0]?.name : course.organization?.name || 'Unknown Organization',
  })) || []




  // Fetch user's drafts
  const { data: drafts } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url, xp_reward, summary, status, updated_at')
    .eq('created_by', user.id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(3)

  // Fetch saved courses
  // The schema showed 'saved_courses' table.
  const { data: savedCoursesData } = await supabase
    .from('saved_courses')
    .select(`
      course_id,
      courses (
        id,
        title,
        thumbnail_url,
        xp_reward,
        status,
        organizations (name)
      )
    `)
    .eq('user_id', user.id)
    .limit(5)

  const savedCourses: DashboardSavedCourse[] = savedCoursesData?.map((item) => {
    const course = item.courses?.[0] || item.courses
    return {
      id: course?.id || '',
      title: course?.title || '',
      thumbnail_url: course?.thumbnail_url || undefined,
      xp_reward: course?.xp_reward || 100,
      status: course?.status || 'published',
      instructor: course?.organizations?.[0]?.name || 'Unknown Organization',
      duration: '8h'
    }
  }) || []

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">Welcome back, {profile?.username?.split(' ')[0] || 'Scholar'}!</h2>
          <p className="text-gray-600 dark:text-[#b0bfcc] text-base">{profile?.level || 1} level active! Keep up your learning momentum!</p>
        </div>
        {resumeTarget && (
          <Link
            href={resumeTarget.href}
            className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-gray-900 dark:text-white font-bold transition-all hover:bg-[#137fec]/80"
          >
            <span className="material-symbols-outlined w-5 h-5">play_arrow</span>
            <span>{resumeTarget.label}</span>
          </Link>
        )}
      </header>

      {/* Stats & Leveling Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* XP Card */}
        <div className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-xl border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined w-8 h-8 text-[#137fec]">star</span>
              <div>
                <p className="text-gray-900 dark:text-white text-sm font-medium">Level {profile?.level || 1} - {profile?.title || 'Scholar'}</p>
                <p className="text-gray-600 dark:text-[#b0bfcc] text-xs">
                  {(() => {
                    const xpProgress = getXpProgress(profile?.total_xp || 0, profile?.level || 1)
                    return `${xpProgress.required - xpProgress.current} XP to Level ${(profile?.level || 1) + 1}`
                  })()}
                </p>
              </div>
            </div>
            <p className="text-gray-900 dark:text-white font-bold">
              {(() => {
                const xpProgress = getXpProgress(profile?.total_xp || 0, profile?.level || 1)
                return `${xpProgress.current} / ${xpProgress.required} XP`
              })()}
            </p>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-[#3b4754] overflow-hidden">
            <div
              className="h-full bg-[#137fec] rounded-full shadow-[0_0_10px_rgba(19,127,236,0.5)]"
              style={{
                width: `${getXpProgress(profile?.total_xp || 0, profile?.level || 1).percentage}%`
              }}
            ></div>
          </div>
          {profile?.daily_xp && <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#34d399]">
              <span className="material-symbols-outlined w-4 h-4">trending_up</span>
              <span>+{profile?.daily_xp} XP today</span>
            </div>
          </div>}
        </div>

        {/* Streak Stats */}
        <div className="flex flex-col justify-between p-6 rounded-xl border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e]">
          <div className="flex justify-between items-start">
            <p className="text-gray-600 dark:text-[#b0bfcc] text-sm font-medium uppercase tracking-wider">Current Streak</p>
            <span className="material-symbols-outlined w-6 h-6 text-orange-500">local_fire_department</span>
          </div>
          <div>
            <p className="text-gray-900 dark:text-white text-4xl font-black">{profile?.streak_days || 0} Days</p>
            <p className="text-[#34d399] text-sm font-medium mt-1">Keep it up!</p>
          </div>
        </div>
      </div>

      {/* Dashboard Modules */}
      <div className="grid grid-cols-1 gap-10">
        {/* My Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">library_books</span>
              My Enrolled Courses
            </h3>
            <Link className="text-[#137fec] text-sm font-medium hover:underline" href="/dashboard/courses">View All</Link>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <CardCourse
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  thumbnail_url={course.thumbnail_url}
                  xp_reward={course.xp_reward}
                  progress={course.progress}
                  status={course.status}
                  instructor={course.instructor}
                  duration={course.duration}
                  variant="grid"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-8 text-center">
              <p className="text-gray-600 dark:text-[#b0bfcc] mb-4">You haven&apos;t enrolled in any courses yet.</p>
              <Link href="/dashboard/explore?tab=courses" className="inline-block px-4 py-2 bg-[#137fec] text-gray-900 dark:text-white rounded-lg font-bold text-sm hover:bg-[#137fec]/80 transition-colors">Browse Courses</Link>
            </div>
          )}
        </section>

        {/* My Drafts Section */}
        {drafts && drafts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="material-symbols-outlined w-6 h-6 text-yellow-500">edit_document</span>
                My Drafts
              </h3>
              <Link className="text-[#137fec] text-sm font-medium hover:underline" href="/dashboard/drafts">View All</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {drafts.slice(0, 3).map((draft) => (
                <CardCourse
                  key={draft.id}
                  id={draft.id}
                  title={draft.title}
                  thumbnail_url={draft.thumbnail_url}
                  xp_reward={draft.xp_reward}
                  summary={draft.summary || undefined}
                  status={draft.status}
                  variant="draft"
                  href={`/dashboard/drafts/${draft.id}/edit`}
                />
              ))}
            </div>
          </section>
        )}

        {/* My Learning Paths Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">hub</span>
              Learning Paths
            </h3>
            <Link className="text-[#137fec] text-sm font-medium hover:underline" href="/dashboard/paths">View All</Link>
          </div>
          {learningPathsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningPathsList.map((path) => (
                <CardPath
                  key={path.id}
                  id={path.id}
                  title={path.title}
                  completedCourses={path.completedCourses}
                  totalCourses={path.totalCourses}
                  nextCourse={path.nextCourse}
                  color={path.color}
                  variant="hero"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-8 text-center">
              <p className="text-gray-600 dark:text-[#b0bfcc] mb-4">You haven&apos;t started any learning paths yet.</p>
              <Link href="/dashboard/explore?tab=paths" className="inline-block px-4 py-2 bg-[#137fec] text-gray-900 dark:text-white rounded-lg font-bold text-sm hover:bg-[#137fec]/80 transition-colors">Browse Paths</Link>
            </div>
          )}
        </section>

        {/* Saved Courses Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">bookmark</span>
              Saved for Later
            </h3>
          </div>
          {savedCourses.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedCourses.map((course) => (
                <CardCourse
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  thumbnail_url={course.thumbnail_url}
                  xp_reward={course.xp_reward}
                  variant="compact"
                />
              ))}
              <div className="p-3 border border-dashed border-gray-200 dark:border-[#3b4754] rounded-lg flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white/5">
                <span className="material-symbols-outlined w-6 h-6 text-[#3b4754] mb-1">add</span>
                <Link href="/dashboard/explore" className="text-[11px] text-gray-600 dark:text-[#b0bfcc]">Explore More</Link>
              </div>
            </div>) : (
            <p className="text-gray-600 dark:text-[#b0bfcc] text-sm italic">You haven&apos;t saved any courses yet.</p>
          )}
        </section>
      </div>
    </>
  )
}

