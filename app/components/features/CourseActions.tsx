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
        // Actualizar progreso existente
        await supabase
          .from('user_course_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: xpReward,
          })
          .eq('id', progressId)
      } else {
        // Crear nuevo progreso
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

      // Actualizar XP del usuario
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

        // Check for level up
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
        // Revertir progreso
        await supabase
          .from('user_course_progress')
          .update({
            completed: false,
            completed_at: null,
            xp_earned: 0,
          })
          .eq('id', progressId)

        // Revertir XP del usuario
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
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isSaved
          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          } disabled:opacity-50`}
      >
        {isSaved ? 'Guardado' : 'Guardar'}
      </button>

      {status === 'published' && (
        !isCompleted ? (
          canComplete ? (
            <button
              onClick={handleMarkComplete}
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Completar'}
            </button>
          ) : (
            <a
              href="#exercises"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
            >
              Vamos con el proyecto final!
            </a>
          )
        ) : (
          <button
            onClick={handleMarkIncomplete}
            disabled={loading}
            className="rounded-lg border border-red-200 bg-red-50 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'No completado'}
          </button>
        )
      )}

    </div>
  )
}
