import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ProgressBar } from '@/components/ProgressBar'
import Link from 'next/link'
import type { PathWithCourses, Course } from '@/lib/types'
import Image from 'next/image'

export default async function PathDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

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
    .eq('id', params.id)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
              >
                ← Volver al dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {path.title}
              </h1>
              {path.summary && (
                <p className="mt-2 text-lg text-gray-600">
                  {path.summary}
                </p>
              )}
              {path.organizations && (
                <p className="mt-2 text-sm text-gray-500">
                  Por {path.organizations.name}
                </p>
              )}
            </div>

            <div className="ml-4 flex gap-2">
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
                      .eq('path_id', params.id)
                  } else {
                    await supabase
                      .from('saved_paths')
                      .insert({ user_id: user!.id, path_id: params.id })
                  }
                }}
              >
                <button
                  type="submit"
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${isSaved
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {isSaved ? '★ Guardado' : '☆ Guardar'}
                </button>
              </form>

              {path.created_by === user.id && (
                <Link
                  href={`/dashboard/paths/${path.id}/edit`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Descripción y detalles */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acerca de este path
              </h2>
              {path.description ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {path.description}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin descripción
                </p>
              )}

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de cursos:</span>
                  <span className="font-medium">{totalCourses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completados:</span>
                  <span className="font-medium text-green-600">{completedCourses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP total:</span>
                  <span className="font-medium text-indigo-600">
                    {path.courses?.reduce((sum: number, c: Course) => sum + c.xp_reward, 0)} XP
                  </span>
                </div>
              </div>

              {path.created_by === user.id && (
                <Link
                  href={`/dashboard/courses/new?pathId=${path.id}`}
                  className="mt-6 block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
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
                      className="block"
                    >
                      <div className={`rounded-lg border-2 p-6 transition-all hover:shadow-lg ${isCompleted
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-indigo-300'
                        }`}>
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          {course.thumbnail_url ? (
                            <Image
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="h-24 w-40 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded bg-gray-200 text-gray-400">
                              <span className="material-symbols-outlined h-10 w-10">image</span>
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                                    {index + 1}
                                  </span>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {course.title}
                                  </h3>
                                </div>

                                {course.summary && (
                                  <p className="mt-2 text-sm text-gray-600">
                                    {course.summary}
                                  </p>
                                )}

                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                  {course.organizations && (
                                    <span>📚 {course.organizations.name}</span>
                                  )}
                                  <span>⚡ {course.xp_reward} XP</span>
                                  {course.course_exercises && course.course_exercises.length > 0 && (
                                    <span>✍️ {course.course_exercises.length} ejercicio(s)</span>
                                  )}
                                </div>
                              </div>

                              {isCompleted && (
                                <div className="ml-4 flex items-center gap-2 text-green-600">
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
                <div className="rounded-lg bg-white p-12 text-center shadow">
                  <p className="text-gray-500">
                    Este path aún no tiene cursos.
                  </p>
                  {path.created_by === user.id && (
                    <Link
                      href={`/dashboard/courses/new?pathId=${path.id}`}
                      className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
                    >
                      Agrega el primer curso →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
