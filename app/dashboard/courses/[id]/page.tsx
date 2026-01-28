import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { YouTubePlayer } from '@/components/YouTubePlayer'
import { CourseActions } from '@/components/CourseActions'
import Link from 'next/link'
import type { CourseExercise } from '@/lib/types'

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener el curso con toda su información
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      learning_paths (id, title),
      organizations (name, website_url),
      course_exercises (*),
      user_course_progress!user_course_progress_course_id_fkey (
        id,
        completed,
        completed_at,
        xp_earned
      )
    `)
    .eq('id', params.id)
    .eq('user_course_progress.user_id', user.id)
    .single()

  if (error || !course) notFound()

  const progress = course.user_course_progress?.[0]
  const isCompleted = progress?.completed || false

  // Obtener submissions del usuario para los ejercicios
  const { data: submissions } = await supabase
    .from('exercise_submissions')
    .select('*, course_exercises (*)')
    .eq('user_id', user.id)
    .in('exercise_id', course.course_exercises?.map((e: CourseExercise) => e.id) || [])

  // Verificar si está guardado
  const { data: savedCourse } = await supabase
    .from('saved_courses')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  const isSaved = !!savedCourse

  const isYouTube = course.link_url &&
    (course.link_url.includes('youtube.com') || course.link_url.includes('youtu.be'))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href={`/dashboard/paths/${course.learning_paths.id}`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Volver a {course.learning_paths.title}
          </Link>

          <div className="flex items-start justify-between mt-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {course.title}
              </h1>
              {course.summary && (
                <p className="mt-2 text-lg text-gray-600">
                  {course.summary}
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                {course.organizations && (
                  <span>📚 {course.organizations.name}</span>
                )}
                <span>⚡ {course.xp_reward} XP</span>
                {course.course_exercises?.length > 0 && (
                  <span>✍️ {course.course_exercises.length} ejercicio(s)</span>
                )}
              </div>
            </div>

            <CourseActions
              courseId={course.id}
              userId={user.id}
              isSaved={isSaved}
              isCompleted={isCompleted}
              progressId={progress?.id}
              xpReward={course.xp_reward}
            />
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video/Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video player */}
            {course.link_url && isYouTube && (
              <div className="rounded-lg bg-white p-6 shadow">
                <YouTubePlayer url={course.link_url} />
              </div>
            )}

            {/* Enlace externo si no es YouTube */}
            {course.link_url && !isYouTube && (
              <div className="rounded-lg bg-white p-6 shadow">
                <a
                  href={course.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border-2 border-indigo-300 bg-indigo-50 p-4 hover:bg-indigo-100"
                >
                  <span className="font-medium text-indigo-900">
                    🔗 Ir al curso externo
                  </span>
                  <span className="material-symbols-outlined h-5 w-5 text-indigo-600">open_in_new</span>
                </a>
              </div>
            )}

            {/* Descripción */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Descripción
              </h2>
              {course.description ? (
                <div className="prose prose-sm max-w-none text-gray-600">
                  <p className="whitespace-pre-wrap">{course.description}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin descripción disponible
                </p>
              )}
            </div>

            {/* Ejercicios */}
            {course.course_exercises && course.course_exercises.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Ejercicios prácticos
                </h2>
                <div className="space-y-4">
                  {course.course_exercises.map((exercise: CourseExercise) => {
                    const submission = submissions?.find(s => s.exercise_id === exercise.id)

                    return (
                      <div
                        key={exercise.id}
                        className={`rounded-lg border-2 p-4 ${submission?.status === 'approved'
                            ? 'border-green-300 bg-green-50'
                            : submission
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {exercise.title}
                            </h3>
                            {exercise.description && (
                              <p className="mt-1 text-sm text-gray-600">
                                {exercise.description}
                              </p>
                            )}
                            {exercise.requirements && (
                              <div className="mt-2 text-sm">
                                <span className="font-medium text-gray-700">Requisitos:</span>
                                <p className="text-gray-600 whitespace-pre-wrap">
                                  {exercise.requirements}
                                </p>
                              </div>
                            )}
                          </div>

                          {submission ? (
                            <div className="ml-4">
                              {submission.status === 'approved' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                  ✓ Aprobado
                                </span>
                              ) : submission.status === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                                  ✗ Rechazado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                                  ⏱ Pendiente
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {!submission && (
                          <Link
                            href={`/dashboard/exercises/${exercise.id}/submit`}
                            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            Entregar ejercicio →
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Estado del curso */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Estado del curso
              </h3>

              {isCompleted ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-100 p-4 text-center">
                    <span className="mx-auto material-symbols-outlined h-12 w-12 text-green-600">check_circle</span>
                    <p className="mt-2 font-medium text-green-900">
                      ¡Completado!
                    </p>
                    <p className="text-sm text-green-700">
                      Ganaste {progress.xp_earned} XP
                    </p>
                  </div>
                  {progress.completed_at && (
                    <p className="text-xs text-center text-gray-500">
                      Completado el {new Date(progress.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Completa este curso para ganar <span className="font-semibold text-indigo-600">{course.xp_reward} XP</span>
                  </p>
                  <form action={`/api/courses/${course.id}/complete`} method="POST">
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      ✓ Marcar como completado
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Información
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-600">Learning Path</dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    <Link
                      href={`/dashboard/paths/${course.learning_paths.id}`}
                      className="hover:text-indigo-600"
                    >
                      {course.learning_paths.title}
                    </Link>
                  </dd>
                </div>
                {course.organizations && (
                  <div>
                    <dt className="text-gray-600">Organización</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {course.organizations.website_url ? (
                        <a
                          href={course.organizations.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600"
                        >
                          {course.organizations.name}
                        </a>
                      ) : (
                        course.organizations.name
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-600">Recompensa XP</dt>
                  <dd className="mt-1 font-medium text-indigo-600">
                    {course.xp_reward} XP
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
