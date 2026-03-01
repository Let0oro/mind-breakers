import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import type { ExpeditionListItem, UserQuestProgress } from '@/lib/types'
import { CardExpedition } from '@/components/ui/CardExpedition'
import {
  getUserSavedExpeditionsCached,
  getUserProgressCached,
  getUserCreatedExpeditionIdsCached,
  getExpeditionIdsFromQuestProgressCached,
  getExpeditionsByIdsCached
} from '@/lib/cache'

export const metadata = {
  title: 'Expeditions - MindBreaker',
  description: 'Browse and explore expeditions',
}

export default async function ExpeditionsListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use cached queries for all user data
  const [savedExpeditionIds, userProgress, createdExpeditionIds] = await Promise.all([
    getUserSavedExpeditionsCached(supabase, user.id),
    getUserProgressCached(supabase, user.id),
    getUserCreatedExpeditionIdsCached(supabase, user.id)
  ])

  const completedQuestIds = new Set(
    userProgress.filter((p: Pick<UserQuestProgress, 'completed' | 'quest_id'>) => p.completed).map((p: Pick<UserQuestProgress, 'quest_id'>) => p.quest_id)
  )
  const savedSet = new Set(savedExpeditionIds)

  // Get expedition IDs from user's quest progress (cached)
  const progressQuestIds = userProgress.map((p: Pick<UserQuestProgress, 'quest_id'>) => p.quest_id).filter(Boolean)
  const progressExpeditionIds = await getExpeditionIdsFromQuestProgressCached(supabase, user.id, progressQuestIds)

  // Combine all expedition IDs
  const expeditionIds = [...new Set([
    ...createdExpeditionIds,
    ...progressExpeditionIds,
    ...savedExpeditionIds
  ])]

  // Fetch expeditions by IDs (cached)
  const expeditions = await getExpeditionsByIdsCached(supabase, user.id, expeditionIds)

  return (
    <>
      <header className="mb-10">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-header text-foreground tracking-tight">expeditions</h1>
            <p className="text-muted text-sm">
              {expeditions.length} expeditions in your journey
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/guild-hall/world-map?tab=expeditions"
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
        {expeditions.length > 0 ? (
          expeditions.map((expedition: ExpeditionListItem) => {
            const questCount = expedition.quests?.length || 0
            const completedCount = expedition.quests?.filter((c) =>
              completedQuestIds.has(c.id)
            ).length || 0
            const progressPercent = questCount > 0 ? (completedCount / questCount) * 100 : 0
            const isSaved = savedSet.has(expedition.id)
            const isOwner = expedition.created_by === user.id

            const org = Array.isArray(expedition.organizations) ? expedition.organizations[0] : expedition.organizations

            return (
              <CardExpedition
                key={expedition.id}
                id={expedition.id}
                title={expedition.title}
                summary={expedition.summary}
                completedQuests={completedCount}
                totalQuests={questCount}
                progressPercent={progressPercent}
                isSaved={isSaved}
                isValidated={expedition.is_validated}
                isOwner={isOwner}
                organizationName={org?.name}
                variant="card"
              />
            )
          })
        ) : (
          <div className="col-span-full border border-border p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-muted mb-4 block">flag</span>
            <p className="text-muted text-sm mb-1">No Expeditions</p>
            <p className="text-muted text-xs mb-6">Start your journey by finding an expedition</p>
            <Link
              href="/guild-hall/world-map?tab=expeditions"
              className="inline-block px-4 py-2 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
            >
              Explore Expeditions
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
