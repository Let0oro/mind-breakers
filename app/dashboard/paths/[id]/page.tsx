import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ProgressBar } from '@/components/ProgressBar'
import Link from 'next/link'
import type { PathWithCourses, Course } from '@/lib/types'
import Image from 'next/image'
import RecommendedCourses from './RecommendedCourses'

export default async function PathDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 dark:text-[#b0bfcc] hover:text-[#137fec] mb-4 inline-flex items-center gap-1 transition-colors"
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
              <p className="mt-2 text-lg text-gray-600 dark:text-[#b0bfcc]">
                {path.summary}
              </p>
            )}
            {path.organizations && (
              <p className="mt-2 text-sm text-gray-600 dark:text-[#b0bfcc]">
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
              }}
            >
              <button
                type="submit"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isSaved
                  ? 'bg-[#137fec]/20 text-[#137fec] hover:bg-[#137fec]/30'
                  : 'border border-gray-200 dark:border-[#3b4754] text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50'
                  }`}
              >
                {isSaved ? '★ Guardado' : '☆ Guardar'}
              </button>
            </form>

            {path.created_by === user.id && (
              <Link
                href={`/dashboard/paths/${path.id}/edit`}
                className="rounded-lg border border-gray-200 dark:border-[#3b4754] px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
              >
                Editar
              </Link>
            )}
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
          <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Acerca de este path
            </h2>
            {path.description ? (
              <p className="text-sm text-gray-600 dark:text-[#b0bfcc] whitespace-pre-wrap">
                {path.description}
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-[#b0bfcc]/70 italic">
                Sin descripción
              </p>
            )}

            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#b0bfcc]">Total de cursos:</span>
                <span className="font-medium text-gray-900 dark:text-white">{totalCourses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#b0bfcc]">Completados:</span>
                <span className="font-medium text-green-400">{completedCourses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#b0bfcc]">XP total:</span>
                <span className="font-medium text-[#137fec]">
                  {path.courses?.reduce((sum: number, c: Course) => sum + c.xp_reward, 0)} XP
                </span>
              </div>
            </div>

            {path.created_by === user.id && (
              <Link
                href={`/dashboard/courses/new?pathId=${path.id}`}
                className="mt-6 block w-full rounded-lg bg-[#137fec] px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white hover:bg-[#137fec]/80 transition-colors"
              >
                + Agregar curso
              </Link>
            )}
          </div>
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
                      : 'border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] hover:border-[#137fec]/50'
                      }`}>
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            width={160}
                            height={96}
                            className="h-24 w-40 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg bg-[#3b4754] text-gray-600 dark:text-[#b0bfcc]">
                            <span className="material-symbols-outlined h-10 w-10">image</span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b4754] text-sm font-medium text-gray-900 dark:text-white">
                                  {index + 1}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#137fec] transition-colors">
                                  {course.title}
                                </h3>
                              </div>

                              {course.summary && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-[#b0bfcc]">
                                  {course.summary}
                                </p>
                              )}

                              <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-[#b0bfcc]">
                                {course.organizations && (
                                  <span>📚 {course.organizations.name}</span>
                                )}
                                <span className="text-[#137fec]">⚡ {course.xp_reward} XP</span>
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
              <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-[#3b4754]">
                <p className="text-gray-600 dark:text-[#b0bfcc]">
                  Este path aún no tiene cursos.
                </p>
                {path.created_by === user.id && (
                  <Link
                    href={`/dashboard/courses/new?pathId=${path.id}`}
                    className="mt-4 inline-block text-[#137fec] hover:text-[#137fec]/80"
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
        </div>
      </div>
    </>
  )
}
