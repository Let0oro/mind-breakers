import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { CardCourse } from '@/components/ui/CardCourse'
import type { Course, PathResource } from '@/lib/types'

import RecommendedCourses from './RecommendedCourses'
import Recommendations from '@/components/features/Recommendations'
import PathResources from '@/components/features/PathResources'
import {
  getPathDetailCached,
  getPathResourcesCached,
  isPathSavedCached,
  getUserCoursesProgressCached
} from '@/lib/cache'

export default async function PathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch path data and resources (cached)
  const [
    { data: path, error },
    initialResources
  ] = await Promise.all([
    getPathDetailCached(supabase, id),
    getPathResourcesCached(supabase, id) as Promise<PathResource[]>
  ])

  if (error || !path) notFound()

  const isOwner = path.created_by === user.id
  const isValidated = path.is_validated === true

  if (!isValidated && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="material-symbols-outlined text-5xl text-muted mb-4">pending</span>
        <h1 className="text-xl font-bold uppercase tracking-wide text-text-main mb-2">
          Content not available
        </h1>
        <p className="text-muted text-sm max-w-md">
          This learning path is pending validation by an administrator.
        </p>
        <Link
          href="/guild-hall/paths"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main hover:underline"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to paths
        </Link>
      </div>
    )
  }

  // Get course IDs for progress query
  const courseIds = path.courses?.map((c: Course) => c.id) || []

  // Fetch user-specific data (cached)
  const [isSaved, userProgress] = await Promise.all([
    isPathSavedCached(supabase, user.id, id),
    getUserCoursesProgressCached(supabase, user.id, courseIds)
  ])

  // Create a map of course progress
  const progressMap = new Map(userProgress.map(p => [p.course_id, p]))

  const totalCourses = path.courses?.length || 0
  const completedCourses = path.courses?.filter((c: Course) =>
    progressMap.get(c.id)?.completed
  ).length || 0

  // Leaderboard
  const pathCourseIds = path.courses?.map((c: Course) => c.id) || []
  let leaderboard: { userId: string; username: string; avatarUrl: string; totalXp: number; completedCount: number }[] = []

  if (pathCourseIds.length > 0) {
    const { data: allProgress } = await supabase
      .from('user_course_progress')
      .select('user_id, xp_earned, completed')
      .in('course_id', pathCourseIds)

    if (allProgress) {
      const statsByUser = new Map<string, { totalXp: number; completedCount: number }>()

      allProgress.forEach(p => {
        const current = statsByUser.get(p.user_id) || { totalXp: 0, completedCount: 0 }
        statsByUser.set(p.user_id, {
          totalXp: current.totalXp + (p.xp_earned || 0),
          completedCount: current.completedCount + (p.completed ? 1 : 0)
        })
      })

      const topUserIds = Array.from(statsByUser.entries())
        .sort((a, b) => b[1].totalXp - a[1].totalXp)
        .slice(0, 5)
        .map(entry => entry[0])

      if (topUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', topUserIds)

        const profileMap = new Map(profiles?.map(p => [p.id, p])) || new Map()

        leaderboard = topUserIds.map(userId => {
          const stats = statsByUser.get(userId)!
          const profile = profileMap.get(userId)
          return {
            userId,
            username: profile?.username || 'Unknown',
            avatarUrl: profile?.avatar_url || '',
            totalXp: stats.totalXp,
            completedCount: stats.completedCount
          }
        })
      }
    }
  }

  const totalXp = path.courses?.reduce((sum: number, c: Course) => sum + c.xp_reward, 0) || 0

  return (
    <>
      {/* Pending Banner */}
      {!isValidated && isOwner && (
        <div className="mb-6 border border-muted p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-muted">pending</span>
          <div>
            <p className="font-bold uppercase tracking-wide text-xs text-text-main">Pending validation</p>
            <p className="text-xs text-muted">
              This path is only visible to you until approved by an admin.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10">
        <Link
          href="/guild-hall/paths"
          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to paths
        </Link>

        <div className="flex items-start justify-between mt-4 gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-black italic tracking-tight text-text-main">
              {path.title.toUpperCase()}
            </h1>
            {path.summary && (
              <p className="mt-2 text-muted text-sm">
                {path.summary}
              </p>
            )}
            {path.organizations && (
              <p className="mt-2 text-xs text-muted uppercase tracking-wider">
                By {path.organizations.name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <form
              action={async () => {
                'use server'
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (isSaved) {
                  await supabase
                    .from('saved_paths')
                    .delete()
                    .eq('user_id', user!.id)
                    .eq('path_id', id)
                } else {
                  await supabase
                    .from('saved_paths')
                    .insert({ user_id: user!.id, path_id: id })
                }

                revalidatePath(`/guild-hall/paths/${id}`)
                revalidatePath(`/guild-hall/paths`)
              }}
            >
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${isSaved
                  ? 'border border-text-main bg-inverse text-main-alt'
                  : 'border border-border text-muted hover:border-text-main hover:text-text-main'
                  }`}
              >
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </form>

            <Link
              href={`/guild-hall/paths/${path.id}/edit`}
              className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-text-main hover:text-text-main transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <ProgressBar current={completedCourses} total={totalCourses} />
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col md:grid gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* About */}
          <div className="border border-border bg-main p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">
              About this path
            </h2>
            {path.description ? (
              <p className="text-xs text-muted whitespace-pre-wrap">
                {path.description}
              </p>
            ) : (
              <p className="text-xs text-muted italic">
                No description
              </p>
            )}

            <div className="mt-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Total courses:</span>
                <span className="font-bold text-text-main">{totalCourses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Completed:</span>
                <span className="font-bold text-text-main">{completedCourses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total XP:</span>
                <span className="font-bold text-text-main">{totalXp} XP</span>
              </div>
            </div>

            {path.created_by === user.id && (
              <Link
                href={`/guild-hall/quests/new?pathId=${path.id}`}
                className="mt-6 block w-full px-4 py-2 text-center text-xs font-bold uppercase tracking-widest border border-text-main text-text-main hover:bg-inverse hover:text-main-alt transition-all"
              >
                + Add course
              </Link>
            )}
          </div>

          {/* Leaderboard */}
          <div className="border border-border bg-main p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-lg text-text-main">leaderboard</span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">
                Top Students
              </h2>
            </div>

            {leaderboard.length > 0 ? (
              <div className="flex flex-col gap-3">
                {leaderboard.map((student, index) => (
                  <Link
                    key={student.userId}
                    href={`/guild-hall/users/${student.userId}`}
                    className="flex items-center gap-3 p-2 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center justify-center w-5 h-5 text-[10px] font-bold border border-border text-muted">
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 bg-surface-dark overflow-hidden grayscale">
                      <FallbackImage
                        as="img"
                        src={student.avatarUrl || ''}
                        alt={student.username}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main truncate uppercase tracking-wide">
                        {student.username}
                      </p>
                      <p className="text-[10px] text-muted">
                        {student.completedCount} courses
                      </p>
                    </div>
                    <div className="text-xs font-bold text-text-main">
                      {student.totalXp} XP
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">
                Be the first to complete courses in this path.
              </p>
            )}
          </div>

          {/* Resources */}
          <PathResources pathId={path.id} initialResources={initialResources || []} />
        </div>

        {/* Course Timeline */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-gold">dashboard</span>
            <h2 className="text-xl font-header text-foreground italic">Mission Board</h2>
          </div>{path.courses && path.courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 grid-cols-1fr p-4 md:p-8 bg-main border border-border/50 min-h-[400px]">
              {/* Board Title / Decor (Optional, maybe implied by the container) */}

              {path.courses.map((course: Course, index: number) => {
                const courseProgress = progressMap.get(course.id)
                const isCompleted = courseProgress?.completed
                const hasProgress = courseProgress !== undefined
                const progress = isCompleted ? 100 : (hasProgress ? 50 : 0)

                return (
                  <CardCourse
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    summary={course.summary || undefined}
                    xp_reward={course.xp_reward}
                    variant="board"
                    organizationName={course.organizations?.name}
                    exercisesCount={course.course_exercises?.length || 0}
                    progress={progress}
                    status={course.status}
                    index={index}
                  />
                )
              })}
            </div>
          ) : (
            <div className="border border-border p-12 text-center bg-background/30">
              <p className="text-muted text-sm italic">
                &quot;The quest board is currently empty.&quot;
              </p>
              {path.created_by === user.id && (
                <Link
                  href={`/guild-hall/quests/new?pathId=${path.id}`}
                  className="mt-6 inline-block px-6 py-3 border border-dashed border-border text-xs font-bold uppercase tracking-widest text-text-main hover:bg-surface hover:border-gold transition-all"
                >
                  Post a new quest
                </Link>
              )}
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          <RecommendedCourses pathId={id} />
          <div className="mt-10">
            <Recommendations mode="similar" contextId={path.id} contextType="path" />
          </div>
        </div>
      </div>
    </>
  )
}
