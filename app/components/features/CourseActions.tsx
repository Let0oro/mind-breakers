'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getLevelFromXp } from '@/lib/gamification'
import { levelUpEvent } from '@/lib/events'

interface CourseActionsProps {
  courseId: string
  userId: string
  isSaved: boolean
  isCompleted: boolean
  progressId?: string
  xpReward: number
  canComplete?: boolean
  status: string
}

export function CourseActions({
  courseId,
  userId,
  isSaved: initialIsSaved,
  isCompleted: initialIsCompleted,
  progressId,
  xpReward,
  canComplete = true,
  status,
}: CourseActionsProps) {
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
          .from('saved_courses')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId)
      } else {
        await supabase
          .from('saved_courses')
          .insert({ user_id: userId, course_id: courseId })
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
          .from('user_course_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: xpReward,
          })
          .eq('id', progressId)
      } else {
        await supabase
          .from('user_course_progress')
          .insert({
            user_id: userId,
            course_id: courseId,
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
          .from('user_course_progress')
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
        className={`h-10 px-4 text-xs cursor-pointer font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${isSaved
          ? 'bg-inverse text-inverse'
          : 'border border-border text-text-main hover:bg-surface'
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
              className="h-10 px-4 cursor-pointer bg-inverse text-inverse text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {loading ? 'Saving...' : 'Complete'}
            </button>
          ) : (
            <a
              href="#exercises"
              className="h-10 px-4 cursor-pointer bg-inverse text-inverse text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              Go to Exercises
            </a>
          )
        ) : (
          <button
            onClick={handleMarkIncomplete}
            disabled={loading}
            className="h-10 px-4 cursor-pointer border border-muted text-muted text-xs font-bold uppercase tracking-widest hover:border-text-main hover:text-text-main disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">undo</span>
            {loading ? 'Saving...' : 'Undo Complete'}
          </button>
        )
      )}
    </div>
  )
}
