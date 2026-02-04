import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { FallbackImage } from '@/components/ui/FallbackImage'
import type { Course, PathResource } from '@/lib/types'

import RecommendedCourses from './RecommendedCourses'
import Recommendations from '@/components/features/Recommendations'
import PathResources from '@/components/features/PathResources'

export default async function PathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch Path Resources Server Side
  const { data: initialResources } = await supabase
    .from('path_resources')
    .select('*, profiles(username, avatar_url)')
    .eq('path_id', id)
    .order('created_at', { ascending: false }) as { data: PathResource[] }


  // Obtener el path con sus cursos
  const { data: path, error } = await supabase
    .from('learning_paths')
    .select(`
      *,
      organizations (name, website_url),
      courses (
        *,
        organizations (name),
        course_exercises (id),
        user_course_progress!user_course_progress_course_id_fkey (
          completed,
          xp_earned
        )
      )
    `)
    .eq('id', id)
    .eq('courses.user_course_progress.user_id', user.id)
    .order('order_index', { foreignTable: 'courses', ascending: true })
    .single()

  if (error || !path) notFound()

  // Block access if not validated and not owner
  const isOwner = path.created_by === user.id
  const isValidated = path.is_validated === true

  if (!isValidated && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="material-symbols-outlined text-6xl text-amber-500 mb-4">pending</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Contenido no disponible
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground max-w-md">
          Este learning path está pendiente de validación por un administrador.
          Vuelve más tarde.
        </p>
        <Link
          href="/dashboard/paths"
          className="mt-6 inline-flex items-center gap-2 text-brand hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver a paths
        </Link>
      </div>
    )
  }

  // Calcular progreso
  const totalCourses = path.courses?.length || 0
  const completedCourses = path.courses?.filter((c: Course) =>
    c.user_course_progress?.[0]?.completed
  ).length || 0

  // Verificar si está guardado
  const { data: savedPath } = await supabase
    .from('saved_paths')
    .select('*')
    .eq('user_id', user.id)
    .eq('path_id', path.id)
    .single()

  const isSaved = !!savedPath

  // Leaderboard Logic
  const pathCourseIds = path.courses?.map((c: Course) => c.id) || []
  let leaderboard: { userId: string; username: string; avatarUrl: string; totalXp: number; completedCount: number }[] = []

  if (pathCourseIds.length > 0) {
    // 1. Fetch all progress for these courses
    const { data: allProgress } = await supabase
      .from('user_course_progress')
      .select('user_id, xp_earned, completed')
      .in('course_id', pathCourseIds)

    if (allProgress) {
      // 2. Aggregate by user
      const statsByUser = new Map<string, { totalXp: number; completedCount: number }>()

      allProgress.forEach(p => {
        const current = statsByUser.get(p.user_id) || { totalXp: 0, completedCount: 0 }
        statsByUser.set(p.user_id, {
          totalXp: current.totalXp + (p.xp_earned || 0),
          completedCount: current.completedCount + (p.completed ? 1 : 0)
        })
      })

      // 3. Sort and take top 5
      const topUserIds = Array.from(statsByUser.entries())
        .sort((a, b) => b[1].totalXp - a[1].totalXp)
        .slice(0, 5)
        .map(entry => entry[0])

      if (topUserIds.length > 0) {
        // 4. Fetch profiles
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

  return (
    <>
      {/* Pending Validation Banner */}
      {!isValidated && isOwner && (
        <div className="mb-6 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500">pending</span>
          <div>
            <p className="font-medium text-amber-500">Pendiente de validación</p>
            <p className="text-sm text-amber-500/70">
              Este learning path solo es visible para ti hasta que un administrador lo apruebe.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 dark:text-muted-foreground hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver al dashboard
        </Link>

        <div className="flex items-start justify-between mt-2 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {path.title}
            </h1>
            {path.summary && (
              <p className="mt-2 text-lg text-gray-600 dark:text-muted-foreground">
                {path.summary}
              </p>
            )}
            {path.organizations && (
              <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
                Por {path.organizations.name}
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

                revalidatePath(`/dashboard/paths/${id}`)
                revalidatePath(`/dashboard/paths`)
              }}
            >
              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isSaved
                  ? 'bg-brand/20 text-brand hover:bg-brand/30'
                  : 'border border-gray-200 dark:border-sidebar-border text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50'
                  }`}
              >
                {isSaved ? '★ Guardado' : '☆ Guardar'}
              </button>
            </form>

            {/* Edit button visible to all - permissions handled in edit page */}
            <Link
              href={`/dashboard/paths/${path.id}/edit`}
              className="rounded-lg border border-gray-200 dark:border-sidebar-border px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors"
            >
              Editar
            </Link>
          </div>
        </div>

        {/* Progreso */}
        <div className="mt-6">
          <ProgressBar current={completedCourses} total={totalCourses} />
        </div>
      </header>

      {/* Contenido */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Descripción y detalles */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Acerca de este path
            </h2>
            {path.description ? (
              <p className="text-sm text-gray-600 dark:text-muted-foreground whitespace-pre-wrap">
                {path.description}
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-muted-foreground/70 italic">
                Sin descripción
              </p>
            )}

            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-muted-foreground">Total de cursos:</span>
                <span className="font-medium text-gray-900 dark:text-white">{totalCourses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-muted-foreground">Completados:</span>
                <span className="font-medium text-green-400">{completedCourses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-muted-foreground">XP total:</span>
                <span className="font-medium text-brand">
                  {path.courses?.reduce((sum: number, c: Course) => sum + c.xp_reward, 0)} XP
                </span>
              </div>
            </div>

            {path.created_by === user.id && (
              <Link
                href={`/dashboard/courses/new?pathId=${path.id}`}
                className="mt-6 block w-full rounded-lg bg-brand px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white hover:bg-brand/80 transition-colors"
              >
                + Agregar curso
              </Link>
            )}
          </div>

          {/* Leaderboard Section */}
          <div className="mt-6 rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-yellow-500">trophy</span>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Estudiantes
              </h2>
            </div>

            {leaderboard.length > 0 ? (
              <div className="flex flex-col gap-3">
                {leaderboard.map((student, index) => (
                  <Link
                    key={student.userId}
                    href={`/dashboard/users/${student.userId}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-sidebar-border/30 rounded-lg transition-colors"
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                          'text-gray-500'
                      }`}>
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <FallbackImage
                        as="img"
                        src={student.avatarUrl || ''}
                        alt={student.username}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {student.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.completedCount} cursos completados
                      </p>
                    </div>
                    <div className="text-sm font-bold text-brand">
                      {student.totalXp} XP
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Sé el primero en completar cursos de este path.
              </p>
            )}
          </div>

          {/* Path Resources */}
          <PathResources pathId={path.id} initialResources={initialResources || []} />
        </div>

        {/* Lista de cursos */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {path.courses && path.courses.length > 0 ? (
              path.courses.map((course: Course, index: number) => {
                const isCompleted = course.user_course_progress?.[0]?.completed

                return (
                  <Link
                    key={course.id}
                    href={`/dashboard/courses/${course.id}`}
                    className="block group"
                  >
                    <div className={`rounded-xl border-2 p-6 transition-all ${isCompleted
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-gray-200 dark:border-sidebar-border bg-white dark:bg-[#1a232e] hover:border-brand/50'
                      }`}>
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-sidebar-border">
                          <FallbackImage
                            as="img"
                            src={course.thumbnail_url || ''}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                          {!course.thumbnail_url && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="material-symbols-outlined h-10 w-10 text-gray-600 dark:text-muted-foreground">image</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-border text-sm font-medium text-gray-900 dark:text-white">
                                  {index + 1}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-brand transition-colors">
                                  {course.title}
                                </h3>
                              </div>

                              {course.summary && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
                                  {course.summary}
                                </p>
                              )}

                              <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-muted-foreground">
                                {course.organizations && (
                                  <span>📚 {course.organizations.name}</span>
                                )}
                                <span className="text-brand">⚡ {course.xp_reward} XP</span>
                                {course.course_exercises && course.course_exercises.length > 0 && (
                                  <span>✍️ {course.course_exercises.length} ejercicio(s)</span>
                                )}
                              </div>
                            </div>

                            {isCompleted && (
                              <div className="ml-4 flex items-center gap-2 text-green-400">
                                <span className="material-symbols-outlined h-6 w-6">check_circle</span>
                                <span className="text-sm font-medium">Completado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-sidebar-border">
                <p className="text-gray-600 dark:text-muted-foreground">
                  Este path aún no tiene cursos.
                </p>
                {path.created_by === user.id && (
                  <Link
                    href={`/dashboard/courses/new?pathId=${path.id}`}
                    className="mt-4 inline-block text-brand hover:text-brand/80"
                  >
                    Agrega el primer curso →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          <RecommendedCourses pathId={id} />
          <div className="mt-10">
            <Recommendations mode="similar" contextId={path.id} contextType="path" />
          </div>

          {/* Path Resources */}
          <div className="mt-10">
            <PathResources pathId={path.id} initialResources={initialResources || []} />
          </div>
        </div>
      </div >
    </>
  )
}
