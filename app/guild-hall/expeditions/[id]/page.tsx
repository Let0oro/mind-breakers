import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import { CardQuest } from '@/components/ui/CardQuest'
import type { Quest, ExpeditionResource } from '@/lib/types'

import RecommendedQuests from './RecommendedQuests'
import Recommendations from '@/components/features/Recommendations'
import ExpeditionResources from '@/components/features/ExpeditionResources'
import {
  getExpeditionDetailCached,
  getExpeditionResourcesCached,
  isExpeditionSavedCached,
  getUserQuestsProgressCached
} from '@/lib/cache'
import { afterProgressChange } from '@/lib/cache-actions'

export default async function ExpeditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch expedition data and resources (cached)
  const [
    { data: expedition, error },
    initialResources
  ] = await Promise.all([
    getExpeditionDetailCached(supabase, id),
    getExpeditionResourcesCached(supabase, id) as Promise<ExpeditionResource[]>
  ])

  if (error || !expedition) notFound()

  const isOwner = expedition.created_by === user.id
  const isValidated = expedition.is_validated === true

  if (!isValidated && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="material-symbols-outlined text-5xl text-muted mb-4">pending</span>
        <h1 className="text-xl font-bold uppercase tracking-wide text-gold mb-2">
          Content not available
        </h1>
        <p className="text-muted text-sm max-w-md">
          This expedition is pending validation by an administrator.
        </p>
        <Link
          href="/guild-hall/expeditions"
          className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to expeditions
        </Link>
      </div>
    )
  }

  // Get quest IDs for progress query
  const questIds = expedition.quests?.map((c: Quest) => c.id) || []

  // Fetch user-specific data (cached)
  const [isSaved, userProgress] = await Promise.all([
    isExpeditionSavedCached(supabase, user.id, id),
    getUserQuestsProgressCached(supabase, user.id, questIds)
  ])

  // Create a map of quest progress
  const progressMap = new Map(userProgress.map(p => [p.quest_id, p]))

  const totalQuests = expedition.quests?.length || 0
  const completedQuests = expedition.quests?.filter((c: Quest) =>
    progressMap.get(c.id)?.completed
  ).length || 0

  // Leaderboard
  const expeditionQuestIds = expedition.quests?.map((c: Quest) => c.id) || []
  let leaderboard: { userId: string; username: string; avatarUrl: string; totalXp: number; completedCount: number }[] = []

  if (expeditionQuestIds.length > 0) {
    const { data: allProgress } = await supabase
      .from('user_quest_progress')
      .select('user_id, xp_earned, completed')
      .in('quest_id', expeditionQuestIds)

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

  const totalAvailableXp = expedition.quests?.reduce((sum: number, c: Quest) => sum + c.xp_reward, 0) || 0
  const userEarnedXp = Array.from(progressMap.values()).reduce((sum: number, p: { xp_earned: number }) => sum + (p.xp_earned || 0), 0)

  return (
    <>
      {/* Pending Banner */}
      {!isValidated && isOwner && (
        <div className="mb-6 border border-muted p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-muted">pending</span>
          <div>
            <p className="font-bold uppercase tracking-wide text-xs text-gold">Pending validation</p>
            <p className="text-xs text-muted">
              This expedition is only visible to you until approved by an admin.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10">
        <Link
          href="/guild-hall/expeditions"
          className="text-xs font-bold uppercase tracking-widest text-muted hover:text-gold mb-4 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to expeditions
        </Link>

        <div className="flex items-start justify-between mt-4 gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-black italic tracking-tight text-gold">
              {expedition.title.toUpperCase()}
            </h1>
            {expedition.summary && (
              <p className="mt-2 text-muted text-sm">
                {expedition.summary}
              </p>
            )}
            {expedition.organizations && (
              <p className="mt-2 text-xs text-muted uppercase tracking-wider">
                By {expedition.organizations.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <form
              className={progressMap.size === 0 && expedition.quests && expedition.quests.length > 0 ? "block" : "hidden"}
              action={async () => {
                'use server'
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                  await supabase
                    .from('user_quest_progress')
                    .upsert({
                      user_id: user.id,
                      quest_id: expedition.quests[0].id,
                      completed: false,
                      xp_earned: 0
                    }, { onConflict: 'user_id,quest_id' })

                  await afterProgressChange(user.id)
                  await afterProgressChange(user.id)
                  revalidatePath('/', 'layout')
                }
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 border border-gold bg-gold text-main-alt text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-colors cursor-pointer"
              >
                Start Expedition
              </button>
            </form>

            <form
              className={progressMap.size > 0 && userEarnedXp === 0 ? "block" : "hidden"}
              action={async () => {
                'use server'
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user && expedition.quests && expedition.quests.length > 0) {
                  // Solo borramos el phantom progress
                  const { error } = await supabase
                    .from('user_quest_progress')
                    .delete()
                    .eq('user_id', user.id)
                    .in('quest_id', expedition.quests.map((q: Quest) => q.id))

                  if (error) {
                    console.error("ERROR deleting progress on abandon:", error)
                  }

                  await afterProgressChange(user.id)
                  await afterProgressChange(user.id)
                  revalidatePath('/', 'layout')
                }
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 border border-destructive text-destructive bg-transparent hover:bg-destructive hover:text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Abandon
              </button>
            </form>

            <form
              action={async () => {
                'use server'
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (isSaved) {
                  await supabase
                    .from('saved_expeditions')
                    .delete()
                    .eq('user_id', user!.id)
                    .eq('expedition_id', id)
                } else {
                  await supabase
                    .from('saved_expeditions')
                    .insert({ user_id: user!.id, expedition_id: id })
                }

                revalidatePath(`/guild-hall/expeditions/${id}`)
                revalidatePath(`/guild-hall/expeditions`)
              }}
            >
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${isSaved
                  ? 'border border-gold bg-gold text-main-alt'
                  : 'border border-border text-muted hover:border-gold hover:text-gold'
                  }`}
              >
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </form>

            <Link
              href={`/guild-hall/expeditions/${expedition.id}/edit`}
              className="px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-gold hover:text-gold transition-colors cursor-pointer"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <ProgressBar current={completedQuests} total={totalQuests} />
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col md:grid gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* About */}
          <div className="border border-border bg-main p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">
              About this expedition
            </h2>
            {expedition.description ? (
              <p className="text-xs text-muted whitespace-pre-wrap">
                {expedition.description}
              </p>
            ) : (
              <p className="text-xs text-muted italic">
                No description
              </p>
            )}

            <div className="mt-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Total quests:</span>
                <span className="font-bold text-gold">{totalQuests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Completed:</span>
                <span className="font-bold text-gold">{completedQuests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total XP:</span>
                <span className="font-bold text-gold">{totalAvailableXp} XP</span>
              </div>
            </div>

            {expedition.created_by === user.id && (
              <Link
                href={`/guild-hall/quests/new?expeditionId=${expedition.id}`}
                className="mt-6 block w-full px-4 py-2 text-center text-xs font-bold uppercase tracking-widest border border-gold text-gold hover:bg-gold hover:text-main-alt transition-all cursor-pointer"
              >
                + Add quest
              </Link>
            )}
          </div>

          {/* Leaderboard */}
          <div className="border border-border bg-main p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-lg text-gold">leaderboard</span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold">
                Top Adventurers
              </h2>
            </div>

            {leaderboard.length > 0 ? (
              <div className="flex flex-col gap-3">
                {leaderboard.map((student, index) => (
                  <Link
                    key={student.userId}
                    href={`/guild-hall/users/${student.userId}`}
                    className="flex items-center gap-3 p-2 hover:bg-surface transition-colors cursor-pointer"
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
                      <p className="text-xs font-bold text-gold truncate uppercase tracking-wide">
                        {student.username}
                      </p>
                      <p className="text-[10px] text-muted">
                        {student.completedCount} quests
                      </p>
                    </div>
                    <div className="text-xs font-bold text-gold">
                      {student.totalXp} XP
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">
                Be the first to complete quests in this expedition.
              </p>
            )}
          </div>

          {/* Resources */}
          <ExpeditionResources expeditionId={expedition.id} initialResources={initialResources || []} />
        </div>

        {/* Quest Timeline */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-gold">dashboard</span>
            <h2 className="text-xl font-header text-foreground italic">Mission Board</h2>
          </div>{expedition.quests && expedition.quests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 grid-cols-1fr p-4 md:p-8 bg-main border border-border/50 min-h-[400px]">
              {/* Board Title / Decor (Optional, maybe implied by the container) */}

              {expedition.quests.map((quest: Quest, index: number) => {
                const questProgress = progressMap.get(quest.id)
                const isCompleted = questProgress?.completed
                const hasProgress = questProgress !== undefined
                const progress = isCompleted ? 100 : (hasProgress ? 50 : 0)

                return (
                  <CardQuest
                    key={quest.id}
                    id={quest.id}
                    title={quest.title}
                    summary={quest.summary || undefined}
                    xp_reward={quest.xp_reward}
                    variant="board"
                    organizationName={quest.organizations?.name}
                    exercisesCount={quest.quest_exercises?.length || 0}
                    progress={progress}
                    status={quest.status}
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
              {expedition.created_by === user.id && (
                <Link
                  href={`/guild-hall/quests/new?expeditionId=${expedition.id}`}
                  className="mt-6 inline-block px-6 py-3 border border-dashed border-border text-xs font-bold uppercase tracking-widest text-gold hover:bg-surface hover:border-gold transition-all cursor-pointer"
                >
                  Post a new quest
                </Link>
              )}
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          <Suspense fallback={
            <div className="animate-pulse border border-border bg-main p-6">
              <div className="h-4 w-44 bg-surface rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-surface rounded" />
                ))}
              </div>
            </div>
          }>
            <RecommendedQuests expeditionId={id} />
          </Suspense>
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
              <Recommendations mode="similar" contextId={expedition.id} contextType="expedition" />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}
