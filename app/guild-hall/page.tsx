import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardQuest } from '@/components/ui/CardQuest'
import { CardExpedition } from '@/components/ui/CardExpedition'
import Recommendations from '@/components/features/Recommendations'
import { getLevelProgress } from '@/lib/gamification'
import type { ExpeditionListItem, UserQuestProgress } from '@/lib/types'
import {
  getUserProgressCached,
  getUserSavedQuestsCached,
  getUserSavedExpeditionsCached,
  getExpeditionIdsFromQuestProgressCached,
  getQuestsByIdsCached,
  getExpeditionsByIdsCached
} from '@/lib/cache'

interface QuestItem {
  id: string
  title: string
  summary?: string
  thumbnail_url?: string
  xp_reward: number
  is_validated?: boolean
  created_by: string
  status: 'draft' | 'published' | 'archived'
  organizations: { name: string }[] | null
  user_quest_progress: { completed: boolean, xp_earned: number }[]
  saved_quests: { user_id: string }[]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Parallel fetch of all cached user data
  const [
    profile,
    userProgress,
    savedQuestIds,
    savedExpeditionIds,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
    getUserProgressCached(supabase, user.id),
    getUserSavedQuestsCached(supabase, user.id),
    getUserSavedExpeditionsCached(supabase, user.id),
  ])

  const completedQuestIds = new Set(
    userProgress.filter((p: Pick<UserQuestProgress, 'completed' | 'quest_id'>) => p.completed).map((p: Pick<UserQuestProgress, 'quest_id'>) => p.quest_id)
  )

  const savedSetQuests = new Set(savedQuestIds)
  const savedSetExpeditions = new Set(savedExpeditionIds)

  // Get quest/expedition IDs
  const progressQuestIds = userProgress.map((p: Pick<UserQuestProgress, 'quest_id'>) => p.quest_id).filter(Boolean)
  const progressExpeditionIds = await getExpeditionIdsFromQuestProgressCached(supabase, user.id, progressQuestIds)

  const finalQuestIds = [...new Set([...progressQuestIds, ...savedQuestIds])]
  const finalExpeditionIds = [...new Set([...progressExpeditionIds, ...savedExpeditionIds])]

  // Fetch all to ensure they are sorted correctly by the database query, then slice to 4
  const [questsData, expeditionsData] = await Promise.all([
    getQuestsByIdsCached(supabase, user.id, finalQuestIds),
    getExpeditionsByIdsCached(supabase, user.id, finalExpeditionIds)
  ])

  const quests = (questsData as QuestItem[]).slice(0, 12)
  const expeditions = (expeditionsData as ExpeditionListItem[]).slice(0, 6)

  // Creator mappings for Quests
  const creatorIds = Array.from(new Set(quests.map(c => c.created_by).filter(Boolean)))
  let creatorMap = new Map<string, string>()

  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', creatorIds)

    if (creators) {
      creatorMap = new Map(creators.map(p => [p.id, p.username]))
    }
  }

  const progressMap = new Map(userProgress.map(p => [p.quest_id, p.completed]))

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
      </header>


      {/* Expeditions */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted text-sm">explore</span>
            <h2 className="text-xl font-header text-foreground italic">Expeditions</h2>
          </div>
          <Link
            href="/guild-hall/expeditions"
            className="text-[10px] uppercase tracking-[0.2em] text-muted hover:text-gold transition-colors"
          >
            Ver Todas las Expediciones →
          </Link>
        </div>

        {expeditions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {expeditions.map((expedition: ExpeditionListItem) => {
              const questCount = expedition.quests?.length || 0
              const completedCount = expedition.quests?.filter((c) =>
                completedQuestIds.has(c.id)
              ).length || 0
              const progressPercent = questCount > 0 ? (completedCount / questCount) * 100 : 0
              const isSaved = savedSetExpeditions.has(expedition.id)
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
                  organizationName={org?.name}
                  variant="card"
                />
              )
            })}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border text-center bg-background/30">
            <p className="text-muted italic mb-4">&quot;No expeditions currently charted in your logbook.&quot;</p>
            <Link href="/guild-hall/world-map?tab=expeditions" className="text-gold hover:text-gold/80 text-xs font-bold uppercase tracking-widest border-b border-gold/30 hover:border-gold pb-0.5 transition-all">
              Chart New Quest →
            </Link>
          </div>
        )}
      </section>

      {/* Quests */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted text-sm">assignment</span>
            <h2 className="text-xl font-header text-foreground italic">Quests</h2>
          </div>
          <Link
            href="/guild-hall/quests"
            className="text-[10px] uppercase tracking-[0.2em] text-muted hover:text-gold transition-colors"
          >
            Ver Todas las Quests →
          </Link>
        </div>

        {quests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {quests.map(quest => {
              const isCompleted = progressMap.get(quest.id) || false
              const isEnrolled = progressMap.has(quest.id)
              const isSaved = savedSetQuests.has(quest.id)
              const isPublished = quest.status === 'published'
              const isPending = isPublished && !quest.is_validated

              return (
                <CardQuest
                  key={quest.id}
                  id={quest.id}
                  title={quest.title}
                  thumbnail_url={quest.thumbnail_url}
                  xp_reward={quest.xp_reward}
                  summary={quest.summary}
                  status={isPending ? 'pending' : quest.status}
                  progress={isEnrolled ? (isCompleted ? 100 : 10) : 0}
                  isSaved={isSaved}
                  instructor={quest.organizations && quest.organizations.length > 0 ? quest.organizations[0].name : (creatorMap.get(quest.created_by) ? `by ${creatorMap.get(quest.created_by)}` : undefined)}
                  variant="grid"
                />
              )
            })}
          </div>
        ) : (
          <div className="border border-dashed border-border p-8 text-center bg-background/30">
            <p className="text-muted text-sm italic">No active quests in your logbook.</p>
            <Link
              href="/guild-hall/world-map"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-gold hover:underline"
            >
              Check Board →
            </Link>
          </div>
        )}
      </section>

      {/* Guild Recommendations */}
      <Recommendations mode="similar" />
    </div>
  )
}
