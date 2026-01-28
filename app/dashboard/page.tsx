import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

interface DashboardCourse {
  id: string
  title: string
  organization?: string
  instructor?: string
  duration?: string
  progress: number
  thumbnail_url?: string
  xp_reward: number
}

interface DashboardLearningPath {
  id: string
  title: string
  completedCourses: number
  totalCourses: number
  nextCourse: string
  color: string
  summary?: string
}

interface DashboardSavedCourse {
  id: string
  title: string
  xp_reward: number
  thumbnail_url?: string
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

  // Fetch enrolled courses with progress
  const { data: coursesWithProgress } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      thumbnail_url,
      xp_reward,
      user_course_progress (
        completed,
        xp_earned
      )
    `)
    .eq('user_course_progress.user_id', user.id)
    .limit(3)

  const enrolledCourses: DashboardCourse[] = coursesWithProgress?.map(course => ({
    id: course.id,
    title: course.title,
    thumbnail_url: course.thumbnail_url,
    xp_reward: course.xp_reward || 100,
    progress: course.user_course_progress?.[0]?.completed ? 100 : 0,
    duration: '8h',
    instructor: 'Course Instructor',
  })) || [
      {
        id: '1',
        title: 'Advanced UI Systems & Logic',
        instructor: 'Sarah Drasner',
        duration: '8.5 HOURS',
        progress: 65,
        thumbnail_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
        xp_reward: 150,
      },
      {
        id: '2',
        title: 'Mastering Tailwind CSS v4',
        instructor: 'Adam Wathan',
        duration: '12 HOURS',
        progress: 22,
        thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
        xp_reward: 200,
      },
      {
        id: '3',
        title: 'Data Visualization Principles',
        instructor: 'Edward Tufte',
        duration: '4.2 HOURS',
        progress: 89,
        thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        xp_reward: 100,
      },
    ]

  // Fetch learning paths
  const { data: learningPathsData } = await supabase
    .from('learning_paths')
    .select(`
      id,
      title,
      summary,
      courses (id)
    `)
    .limit(2)

  const learningPathsList: DashboardLearningPath[] = learningPathsData?.map(path => ({
    id: path.id,
    title: path.title,
    summary: path.summary,
    completedCourses: 3,
    totalCourses: path.courses?.length || 5,
    nextCourse: 'Prototyping Systems',
    color: 'primary',
  })) || [
      {
        id: '1',
        title: 'Full-Stack UX Architect',
        completedCourses: 3,
        totalCourses: 5,
        nextCourse: 'Prototyping Systems',
        color: 'primary',
      },
      {
        id: '2',
        title: 'Behavioral Economics',
        completedCourses: 1,
        totalCourses: 4,
        nextCourse: 'Choice Architecture',
        color: 'purple',
      },
    ]

  // Fetch saved courses
  const { data: savedCoursesData } = await supabase
    .from('saved_courses')
    .select(`
      course_id,
      courses (
        id,
        title,
        thumbnail_url,
        xp_reward
      )
    `)
    .eq('user_id', user.id)
    .limit(5)

  const savedCourses: DashboardSavedCourse[] = savedCoursesData?.map((item: any) => ({
    id: item.courses?.id || item.id,
    title: item.courses?.title || item.title,
    thumbnail_url: item.courses?.thumbnail_url || item.thumbnail_url,
    xp_reward: item.courses?.xp_reward || item.xp_reward || 100,
  })) || [
      { id: '1', title: 'Business Strategy 101', xp_reward: 150, thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop' },
      { id: '2', title: 'React Server Components', xp_reward: 200, thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&h=200&fit=crop' },
      { id: '3', title: 'Microbiology Intro', xp_reward: 120, thumbnail_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=200&fit=crop' },
    ]

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-wrap justify-between items-end gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-3xl font-black tracking-tight">Welcome back, {profile?.username?.split(' ')[0] || 'Scholar'}!</h2>
          <p className="text-[#9dabb9] text-base">{profile?.level || 0} level active! Keep up your learning momentum!</p>
        </div>
        <button className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-white font-bold transition-all hover:bg-[#137fec]/80">
          <span className="material-symbols-outlined w-5 h-5">play_arrow</span>
          <span>Resume: Advanced UI Design</span>
        </button>
      </header>

      {/* Stats & Leveling Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* XP Card */}
        <div className="lg:col-span-2 flex flex-col gap-4 p-6 rounded-xl border border-[#3b4754] bg-[#1a232e]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined w-8 h-8 text-[#137fec]">star</span>
              <div>
                <p className="text-white text-sm font-medium">Level {profile?.level || 1} - {profile?.title || 'Scholar'}</p>
                <p className="text-[#9dabb9] text-xs">{(profile?.xp_for_next_level || 300) - (profile?.total_xp || 0)} XP to Level {(profile?.level || 1) + 1}</p>
              </div>
            </div>
            <p className="text-white font-bold">{profile?.total_xp || 0} / {profile?.xp_for_next_level || 1500} XP</p>
          </div>
          <div className="h-3 w-full rounded-full bg-[#3b4754] overflow-hidden">
            <div className="h-full bg-[#137fec] rounded-full shadow-[0_0_10px_rgba(19,127,236,0.5)]" style={{ width: `${Math.min(((profile?.total_xp || 0) / (profile?.xp_for_next_level || 1500)) * 100, 100)}%` }}></div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#0bda5b]">
              <span className="material-symbols-outlined w-4 h-4">trending_up</span>
              <span>+{profile?.daily_xp || 150} XP today</span>
            </div>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="flex flex-col justify-between p-6 rounded-xl border border-[#3b4754] bg-[#1a232e]">
          <div className="flex justify-between items-start">
            <p className="text-[#9dabb9] text-sm font-medium uppercase tracking-wider">Current Streak</p>
            <span className="material-symbols-outlined w-6 h-6 text-orange-500">local_fire_department</span>
          </div>
          <div>
            <p className="text-white text-4xl font-black">{profile?.streak_days || 0} Days</p>
            <p className="text-[#0bda5b] text-sm font-medium mt-1">+{(profile?.streak_days || 0) - (profile?.average_streak || 0)} days from average</p>
          </div>
        </div>
      </div>

      {/* Dashboard Modules */}
      <div className="grid grid-cols-1 gap-10">
        {/* My Courses Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">library_books</span>
              My Enrolled Courses
            </h3>
            <a className="text-[#137fec] text-sm font-medium hover:underline" href="#">View All</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <div key={course.id} className="group bg-[#1a232e] rounded-xl overflow-hidden border border-[#3b4754] hover:border-[#137fec]/50 transition-all cursor-pointer">
                <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${course.thumbnail_url || 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop'})` }}>
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white">{course.duration}</div>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <h4 className="font-bold text-sm line-clamp-1 text-white group-hover:text-[#137fec] transition-colors">{course.title}</h4>
                  <p className="text-[#9dabb9] text-xs">Instructor: {course.instructor}</p>
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px] text-[#9dabb9]">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#3b4754] rounded-full overflow-hidden">
                      <div className="h-full bg-[#137fec]" style={{ width: `${course.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* My Learning Paths Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">hub</span>
              Learning Paths
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningPathsList.map((path) => (
              <div key={path.id} className="p-6 rounded-xl bg-gradient-to-br from-[#1a232e] to-[#111827] border border-[#3b4754] flex gap-6 items-center">
                <div className={`h-20 w-20 shrink-0 rounded-lg ${path.color === 'primary' ? 'bg-[#137fec]/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
                  {path.color === 'primary' ? (
                    <span className="material-symbols-outlined w-8 h-8 text-[#137fec]">workspace_premium</span>
                  ) : (
                    <span className="material-symbols-outlined w-8 h-8 text-purple-400">workspace_premium</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-white mb-1">{path.title}</h4>
                  <p className="text-[#9dabb9] text-xs mb-4">Path {path.completedCourses} of {path.totalCourses} courses completed</p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(path.completedCourses)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border border-[#111827]">
                          <span className="material-symbols-outlined w-3 h-3 text-white">check</span>
                        </div>
                      ))}
                      <div className="w-6 h-6 rounded-full bg-[#137fec] flex items-center justify-center border border-[#111827] animate-pulse">
                        <span className="material-symbols-outlined w-3 h-3 text-white">play_arrow</span>
                      </div>
                      {[...Array(path.totalCourses - path.completedCourses - 1)].map((_, i) => (
                        <div key={`empty-${i}`} className="w-6 h-6 rounded-full bg-[#3b4754] border border-[#111827]"></div>
                      ))}
                    </div>
                    <span className="text-[10px] text-[#9dabb9] ml-2">Next: {path.nextCourse}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Saved Courses Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined w-6 h-6 text-[#137fec]">bookmark</span>
              Saved for Later
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedCourses.map((course) => (
              <div key={course.id} className="p-3 bg-[#1a232e] rounded-lg border border-[#3b4754] hover:bg-[#283039] transition-colors cursor-pointer group">
                <div className="aspect-video rounded bg-cover mb-2" style={{ backgroundImage: `url(${course.thumbnail_url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'})` }}></div>
                <p className="text-xs font-bold text-white truncate group-hover:text-[#137fec]">{course.title}</p>
                <p className="text-[10px] text-[#9dabb9]">{course.xp_reward} XP</p>
              </div>
            ))}
            <div className="p-3 border border-dashed border-[#3b4754] rounded-lg flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white/5">
              <span className="material-symbols-outlined w-6 h-6 text-[#3b4754] mb-1">add</span>
              <p className="text-[10px] text-[#9dabb9]">Explore More</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
