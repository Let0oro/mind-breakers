import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { YouTubePlayer } from '@/components/ui/YouTubePlayer'
import { CourseActions } from '@/components/features/CourseActions'
import Link from 'next/link'
import type { CourseExercise } from '@/lib/types'
import Recommendations from '@/components/features/Recommendations'
import {
  getQuestDetailCached,
  getUserCourseProgressCached,
  getUserExerciseSubmissionsCached,
  isCourseSavedCached
} from '@/lib/cache'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile for admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  // Use cached query for course data
  const { data: course, error } = await getQuestDetailCached(supabase, id)

  if (error || !course) notFound()

  const isOwner = course.created_by === user.id
  const isValidated = course.is_validated === true

  if (!isValidated && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="material-symbols-outlined text-5xl text-muted mb-4">pending</span>
        <h1 className="text-xl font-bold uppercase tracking-wide text-text-main mb-2">
          Content not available
        </h1>
        <p className="text-muted text-sm max-w-md">
          This course is pending validation by an administrator.
        </p>
        <Link
          href="/guild-hall/quests"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-main hover:underline"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to courses
        </Link>
      </div>
    )
  }

  // Get exercise IDs for submissions query
  const exerciseIds = course.course_exercises?.map((e: CourseExercise) => e.id) || []

  // Use cached queries for user-specific data
  const [progress, submissions, isSaved] = await Promise.all([
    getUserCourseProgressCached(supabase, user.id, id),
    getUserExerciseSubmissionsCached(supabase, user.id, exerciseIds),
    isCourseSavedCached(supabase, user.id, id)
  ])

  const isCompleted = progress?.completed || false

  const isYouTube = course.link_url &&
    (course.link_url.includes('youtube.com') || course.link_url.includes('youtu.be'))

  const exercises = course.course_exercises || []
  const totalExercises = exercises.length
  const submittedExercisesCount = exercises.filter((e: CourseExercise) =>
    submissions?.some(s => s.exercise_id === e.id)
  ).length

  const canComplete = totalExercises === 0 || submittedExercisesCount === totalExercises

  return (
    <>
      {/* Pending Banner */}
      {!isValidated && isOwner && (
        <div className="mb-6 border border-muted p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-muted">pending</span>
          <div>
            <p className="font-bold uppercase tracking-wide text-xs text-text-main">Pending validation</p>
            <p className="text-xs text-muted">
              This course is only visible to you until approved by an admin.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10">
        <Link
          href={`/guild-hall/paths/${course.learning_paths.id}`}
          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to {course.learning_paths.title}
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mt-4 gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-black italic tracking-tight text-text-main">
                {course.title.toUpperCase()}
              </h1>
              {course.status === 'published' && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-text-main text-text-main">
                  Published
                </span>
              )}
              {course.status === 'draft' && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-muted text-muted">
                  Draft
                </span>
              )}
              {course.status === 'archived' && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-muted text-muted">
                  Archived
                </span>
              )}
            </div>
            {course.summary && (
              <p className="mt-2 text-muted text-sm">
                {course.summary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              {course.organizations && (
                <span>{course.organizations.name}</span>
              )}
              <span className="font-bold text-text-main">{course.xp_reward} XP</span>
              {course.course_exercises?.length > 0 && (
                <span>{course.course_exercises.length} exercise(s)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isOwner || profile?.is_admin) && (
              <Link
                href={`/guild-hall/quests/${course.id}/edit`}
                className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-text-main hover:text-text-main transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </Link>
            )}

            <CourseActions
              courseId={course.id}
              status={course.status}
              userId={user.id}
              isSaved={isSaved}
              isCompleted={isCompleted}
              progressId={progress?.id}
              xpReward={course.xp_reward}
              canComplete={canComplete}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video player */}
          {course.link_url && isYouTube && (
            <div className="border border-border bg-main p-6">
              <YouTubePlayer url={course.link_url} />
            </div>
          )}

          {/* External link */}
          {course.link_url && !isYouTube && (
            <div className="border border-border bg-main p-6">
              <a
                href={course.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-text-main p-4 hover:bg-inverse hover:text-main-alt transition-all"
              >
                <span className="font-bold text-xs uppercase tracking-widest text-text-main">
                  Go to external course
                </span>
                <span className="material-symbols-outlined text-lg text-text-main">open_in_new</span>
              </a>
            </div>
          )}

          {/* Description */}
          <div className="border border-border bg-main p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">
              Description
            </h2>
            {course.description ? (
              <div className="prose prose-sm max-w-none text-muted">
                <p className="whitespace-pre-wrap text-sm">{course.description}</p>
              </div>
            ) : (
              <p className="text-muted text-xs italic">
                No description available
              </p>
            )}
          </div>

          {/* Exercises */}
          {course.course_exercises && course.course_exercises.length > 0 && (
            <div id="exercises" className="border border-border bg-main p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">
                Exercises
              </h2>
              <div className="space-y-4">
                {course.course_exercises.map((exercise: CourseExercise) => {
                  const submission = submissions?.find(s => s.exercise_id === exercise.id)

                  return (
                    <div
                      key={exercise.id}
                      className={`border p-4 ${submission?.status === 'approved'
                        ? 'border-text-main bg-inverse/5'
                        : submission
                          ? 'border-muted bg-surface'
                          : 'border-border bg-main'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm uppercase tracking-wide text-text-main">
                            {exercise.title}
                          </h3>
                          {exercise.description && (
                            <p className="mt-1 text-xs text-muted">
                              {exercise.description}
                            </p>
                          )}
                          {exercise.requirements && (
                            <div className="mt-2 text-xs">
                              <span className="font-bold uppercase tracking-widest text-muted">Requirements:</span>
                              <p className="text-muted mt-1 whitespace-pre-wrap">
                                {exercise.requirements}
                              </p>
                            </div>
                          )}
                        </div>

                        {submission ? (
                          <div className="ml-4">
                            {submission.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-text-main text-text-main">
                                ✓ Approved
                              </span>
                            ) : submission.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-muted text-muted">
                                ✗ Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-muted text-muted">
                                ⏱ Pending
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {!submission && (
                        <Link
                          href={`/guild-hall/missions/${exercise.id}/submit`}
                          className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-text-main hover:underline"
                        >
                          Submit exercise →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Course Status */}
          <div className="border border-border bg-main p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">
              Course Status
            </h3>

            {isCompleted ? (
              <div className="space-y-3">
                <div className="border border-text-main p-4 text-center">
                  <span className="material-symbols-outlined text-3xl text-text-main block mb-2">check_circle</span>
                  <p className="font-bold uppercase tracking-wide text-xs text-text-main">
                    Completed!
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Earned {progress?.xp_earned} XP
                  </p>
                </div>
                {progress?.completed_at && (
                  <p className="text-[10px] text-center text-muted uppercase tracking-widest">
                    Completed {new Date(progress.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Complete this course to earn <span className="font-bold text-text-main">{course.xp_reward} XP</span>
                </p>
                {!canComplete && (
                  <div className="border border-muted p-4">
                    <p className="text-xs text-muted">
                      Submit all exercises to complete this course.
                    </p>
                    <p className="mt-2 text-[10px] text-muted">
                      Your submission will be reviewed by an administrator.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="border border-border bg-main p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">
              Information
            </h3>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-muted uppercase tracking-widest text-[10px]">Learning Path</dt>
                <dd className="mt-1 font-bold text-text-main">
                  <Link
                    href={`/guild-hall/paths/${course.learning_paths.id}`}
                    className="hover:underline"
                  >
                    {course.learning_paths.title}
                  </Link>
                </dd>
              </div>
              {course.organizations && (
                <div>
                  <dt className="text-muted uppercase tracking-widest text-[10px]">Organization</dt>
                  <dd className="mt-1 font-bold text-text-main">
                    {course.organizations.website_url ? (
                      <a
                        href={course.organizations.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {course.organizations.name}
                      </a>
                    ) : (
                      course.organizations.name
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted uppercase tracking-widest text-[10px]">XP Reward</dt>
                <dd className="mt-1 font-bold text-text-main">
                  {course.xp_reward} XP
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Suspense fallback={
          <div className="animate-pulse border border-border bg-main p-6">
            <div className="h-4 w-40 bg-surface rounded mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-surface rounded" />
              ))}
            </div>
          </div>
        }>
          <Recommendations mode="similar" contextId={course.id} contextType="course" />
        </Suspense>
      </div>
    </>
  )
}
