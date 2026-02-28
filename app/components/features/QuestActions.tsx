'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getLevelFromXp } from '@/lib/gamification'
import { levelUpEvent } from '@/lib/events'

interface QuestActionsProps {
  questId: string
  userId: string
  isSaved: boolean
  isCompleted: boolean
  progressId?: string
  xpReward: number
  canComplete?: boolean
  status: string
}

export function QuestActions({
  questId,
  userId,
  isSaved: initialIsSaved,
  isCompleted: initialIsCompleted,
  progressId,
  xpReward,
  canComplete = true,
  status,
}: QuestActionsProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggleSave = async () => {
    try {
      setLoading(true)

      if (isSaved) {
        await supabase
          .from('saved_quests')
          .delete()
          .eq('user_id', userId)
          .eq('quest_id', questId)
      } else {
        await supabase
          .from('saved_quests')
          .insert({ user_id: userId, quest_id: questId })
      }

      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error toggling save:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    try {
      setLoading(true)

      if (progressId) {
        await supabase
          .from('user_quest_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: xpReward,
          })
          .eq('id', progressId)
      } else {
        await supabase
          .from('user_quest_progress')
          .insert({
            user_id: userId,
            quest_id: questId,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: xpReward,
          })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', userId)
        .single()

      if (profile) {
        const newTotalXp = profile.total_xp + xpReward
        const newLevel = getLevelFromXp(newTotalXp)

        await supabase
          .from('profiles')
          .update({
            total_xp: newTotalXp,
            level: newLevel,
          })
          .eq('id', userId)

        if (newLevel > profile.level) {
          levelUpEvent.emit(newLevel)
        }
      }

      setIsCompleted(true)
      router.refresh()
    } catch (error) {
      console.error('Error marking complete:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkIncomplete = async () => {
    try {
      setLoading(true)

      if (progressId) {
        await supabase
          .from('user_quest_progress')
          .update({
            completed: false,
            completed_at: null,
            xp_earned: 0,
          })
          .eq('id', progressId)

        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp, level')
          .eq('id', userId)
          .single()

        if (profile) {
          const newTotalXp = Math.max(0, profile.total_xp - xpReward)
          const newLevel = getLevelFromXp(newTotalXp)

          await supabase
            .from('profiles')
            .update({
              total_xp: newTotalXp,
              level: newLevel,
            })
            .eq('id', userId)
        }

        setIsCompleted(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error reverting complete:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={handleToggleSave}
        disabled={loading}
        className={`h-10 px-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer ${isSaved
          ? 'bg-gold text-main-alt'
          : 'border border-gold text-gold hover:bg-gold/10'
          } disabled:opacity-50`}
      >
        <span className="material-symbols-outlined text-sm">
          {isSaved ? 'bookmark' : 'bookmark_border'}
        </span>
        {isSaved ? 'Saved' : 'Save'}
      </button>

      {status === 'published' && (
        !isCompleted ? (
          canComplete ? (
            <button
              onClick={handleMarkComplete}
              disabled={loading}
              className="h-10 px-4 bg-gold text-main-alt text-xs font-bold uppercase tracking-widest hover:bg-gold/90 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {loading ? 'Saving...' : 'Complete'}
            </button>
          ) : (
            <a
              href="#exercises"
              className="h-10 px-4 bg-gold text-main-alt text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              Go to Exercises
            </a>
          )
        ) : (
          <button
            onClick={handleMarkIncomplete}
            disabled={loading}
            className="h-10 px-4 border border-muted text-muted text-xs font-bold uppercase tracking-widest hover:border-gold hover:text-gold disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">undo</span>
            {loading ? 'Saving...' : 'Undo Complete'}
          </button>
        )
      )}
    </div>
  )
}
