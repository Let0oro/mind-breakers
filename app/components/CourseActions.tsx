'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface CourseActionsProps {
  courseId: string
  userId: string
  isSaved: boolean
  isCompleted: boolean
  progressId?: string
  xpReward: number
}

export function CourseActions({
  courseId,
  userId,
  isSaved: initialIsSaved,
  isCompleted: initialIsCompleted,
  progressId,
  xpReward,
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
        const newLevel = Math.floor(newTotalXp / 1000) + 1

        await supabase
          .from('profiles')
          .update({
            total_xp: newTotalXp,
            level: newLevel,
          })
          .eq('id', userId)
      }

      setIsCompleted(true)
      router.refresh()
    } catch (error) {
      console.error('Error marking complete:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggleSave}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isSaved
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        {isSaved ? '★ Guardado' : '☆ Guardar'}
      </button>

      {!isCompleted && (
        <button
          onClick={handleMarkComplete}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : '✓ Completar'}
        </button>
      )}
    </div>
  )
}
