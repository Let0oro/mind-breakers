import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { YouTubePlayer } from '@/components/ui/YouTubePlayer'
import { QuestActions } from '@/components/features/QuestActions'
import Link from 'next/link'
import type { QuestExercise, ExerciseSubmission } from '@/lib/types'
import Recommendations from '@/components/features/Recommendations'
import {
  getQuestDetailCached,
  getUserQuestProgressCached,
  getUserExerciseSubmissionsCached,
  isQuestSavedCached
} from '@/lib/cache'

export default async function QuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Use cached query for quest data
  const { data: quest, error } = await getQuestDetailCached(supabase, id)

  if (error || !quest) notFound()

  const isOwner = quest.created_by === user.id
  const isValidated = quest.is_validated === true

  if (!isValidated && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="material-symbols-outlined text-5xl text-muted mb-4">pending</span>
        <h1 className="text-xl font-bold uppercase tracking-wide text-text-main mb-2">
          Content not available
        </h1>
        <p className="text-muted text-sm max-w-md">
          This quest is pending validation by an administrator.
        </p>
        <Link
          href="/guild-hall/quests"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to quests
        </Link>
      </div>
    )
  }

  // Get exercise IDs for submissions query
  const exerciseIds = quest.quest_exercises?.map((e: QuestExercise) => e.id) || []

  // Use cached queries for user-specific data
  const [progress, submissions, isSaved] = await Promise.all([
    getUserQuestProgressCached(supabase, user.id, id),
    getUserExerciseSubmissionsCached(supabase, user.id, exerciseIds),
    isQuestSavedCached(supabase, user.id, id)
  ])

  const isCompleted = progress?.completed || false

  const isYouTube = quest.link_url &&
    (quest.link_url.includes('youtube.com') || quest.link_url.includes('youtu.be'))

  const exercises = quest.quest_exercises || []
  const totalExercises = exercises.length
  const submittedExercisesCount = exercises.filter((e: QuestExercise) =>
    submissions?.some((s: ExerciseSubmission) => s.exercise_id === e.id)
  ).length

  const canComplete = totalExercises === 0 || submittedExercisesCount === totalExercises

  return (
    <>
      {/* Pending Banner */}
      {!isValidated && isOwner && (
        <div className="mb-6 border border-muted p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-muted">pending</span>
          <div>
            <p className="font-bold uppercase tracking-wide text-xs text-gold">Pending validation</p>
            <p className="text-xs text-muted">
              This quest is only visible to you until approved by an admin.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10">
        <Link
          href={`/guild-hall/expeditions/${quest.expeditions.id}`}
          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-gold mb-4 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to {quest.expeditions.title}
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mt-4 gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-black italic tracking-tight text-gold">
                {quest.title.toUpperCase()}
              </h1>
              {quest.status === 'published' && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-gold text-gold">
                  Published
                </span>
              )}
              {quest.status === 'draft' && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-muted text-muted">
                  Draft
                </span>
              )}
              {quest.status === 'archived' && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-muted text-muted">
                  Archived
                </span>
              )}
            </div>
            {quest.summary && (
              <p className="mt-2 text-muted text-sm">
                {quest.summary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              {quest.organizations && (
                <span>{quest.organizations.name}</span>
              )}
              <span className="font-bold text-gold">{quest.xp_reward} XP</span>
              {quest.quest_exercises?.length > 0 && (
                <span>{quest.quest_exercises.length} mission(s)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(isOwner || profile?.is_admin) && (
              <Link
                href={`/guild-hall/quests/${quest.id}/edit`}
                className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-gold hover:text-gold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </Link>
            )}

            <QuestActions
              questId={quest.id}
              status={quest.status}
              userId={user.id}
              isSaved={isSaved}
              isCompleted={isCompleted}
              progressId={progress?.id}
              xpReward={quest.xp_reward}
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
          {quest.link_url && isYouTube && (
            <div className="border border-border bg-main p-6">
              <YouTubePlayer url={quest.link_url} />
            </div>
          )}

          {/* External link */}
          {quest.link_url && !isYouTube && (
            <div className="border border-border bg-main p-6">
              <a
                href={quest.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border border-gold p-4 hover:bg-gold hover:text-main-alt transition-all group cursor-pointer"
              >
                <span className="font-bold text-xs uppercase tracking-widest text-gold group-hover:text-main-alt transition-colors">
                  Go to external quest
                </span>
                <span className="material-symbols-outlined text-lg text-gold group-hover:text-main-alt transition-colors">open_in_new</span>
              </a>
            </div>
          )}

          {/* Description */}
          <div className="border border-border bg-main p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">
              Description
            </h2>
            {quest.description ? (
              <div className="prose prose-sm max-w-none text-muted">
                <p className="whitespace-pre-wrap text-sm">{quest.description}</p>
              </div>
            ) : (
              <p className="text-muted text-xs italic">
                No description available
              </p>
            )}
          </div>

          {/* Exercises */}
          {quest.quest_exercises && quest.quest_exercises.length > 0 && (
            <div id="exercises" className="border border-border bg-main p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">
                Missions
              </h2>
              <div className="space-y-4">
                {quest.quest_exercises.map((exercise: QuestExercise) => {
                  const submission = submissions?.find((s: ExerciseSubmission) => s.exercise_id === exercise.id)

                  return (
                    <div
                      key={exercise.id}
                      className={`border p-4 ${submission?.status === 'approved'
                        ? 'border-gold bg-gold/5'
                        : submission
                          ? 'border-muted bg-surface'
                          : 'border-border bg-main'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm uppercase tracking-wide text-gold">
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
                          Submit mission →
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
          {/* Quest Status */}
          <div className="border border-border bg-main p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4">
              Quest Status
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
                  Complete this quest to earn <span className="font-bold text-text-main">{quest.xp_reward} XP</span>
                </p>
                {!canComplete && (
                  <div className="border border-muted p-4">
                    <p className="text-xs text-muted">
                      Submit all missions to complete this quest.
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
                <dt className="text-muted uppercase tracking-widest text-[10px]">Expedition</dt>
                <dd className="mt-1 font-bold text-text-main">
                  <Link
                    href={`/guild-hall/expeditions/${quest.expeditions.id}`}
                    className="hover:underline"
                  >
                    {quest.expeditions.title}
                  </Link>
                </dd>
              </div>
              {quest.organizations && (
                <div>
                  <dt className="text-muted uppercase tracking-widest text-[10px]">Organization</dt>
                  <dd className="mt-1 font-bold text-text-main">
                    {quest.organizations.website_url ? (
                      <a
                        href={quest.organizations.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {quest.organizations.name}
                      </a>
                    ) : (
                      quest.organizations.name
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted uppercase tracking-widest text-[10px]">XP Reward</dt>
                <dd className="mt-1 font-bold text-text-main">
                  {quest.xp_reward} XP
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
          <Recommendations mode="similar" contextId={quest.id} contextType="quest" />
        </Suspense>
      </div>
    </>
  )
}
