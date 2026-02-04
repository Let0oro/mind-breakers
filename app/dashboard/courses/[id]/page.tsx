import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { YouTubePlayer } from '@/components/ui/YouTubePlayer'
import { CourseActions } from '@/components/features/CourseActions'
import Link from 'next/link'
import type { CourseExercise } from '@/lib/types'
import Recommendations from '@/components/features/Recommendations'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user profile for admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

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
    .eq('id', id)
    .eq('user_course_progress.user_id', user.id)
    .single()

  if (error || !course) notFound()

  // Block access if not validated and not owner
  const isOwner = course.created_by === user.id
  const isValidated = course.is_validated === true

  if (!isValidated && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="material-symbols-outlined text-6xl text-amber-500 mb-4">pending</span>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Contenido no disponible
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground max-w-md">
          Este curso está pendiente de validación por un administrador.
          Vuelve más tarde.
        </p>
        <Link
          href="/dashboard/courses"
          className="mt-6 inline-flex items-center gap-2 text-brand hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver a cursos
        </Link>
      </div>
    )
  }

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

  // Calculate completion eligibility
  const exercises = course.course_exercises || []
  const totalExercises = exercises.length
  // Count submitted exercises (status pending, approved, or rejected - assuming submission exists)
  // User said "completed or attached". So detailed check:
  const submittedExercisesCount = exercises.filter((e: CourseExercise) =>
    submissions?.some(s => s.exercise_id === e.id)
  ).length

  const canComplete = totalExercises === 0 || submittedExercisesCount === totalExercises

  return (
    <>
      {/* Pending Validation Banner */}
      {!isValidated && isOwner && (
        <div className="mb-6 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-500">pending</span>
          <div>
            <p className="font-medium text-amber-500">Pendiente de validación</p>
            <p className="text-sm text-amber-500/70">
              Este curso solo es visible para ti hasta que un administrador lo apruebe.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <Link
          href={`/dashboard/paths/${course.learning_paths.id}`}
          className="text-sm text-gray-600 dark:text-muted-foreground hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver a {course.learning_paths.title}
        </Link>

        <div className="flex lg:items-end text-center sm:text-left lg:justify-between mt-2 lg:gap-4 flex-wrap-reverse justify-center items-center gap-8">

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {course.title}
              {course.status === 'published' && (
                <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">
                  Publicado
                </span>
              )}
              {course.status === 'draft' && (
                <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-400 ring-1 ring-inset ring-yellow-600/20">
                  Borrador
                </span>
              )}
              {course.status === 'archived' && (
                <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10">
                  Archivado
                </span>
              )}
            </h1>
            {course.summary && (
              <p className="mt-2 text-lg text-gray-600 dark:text-muted-foreground">
                {course.summary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
              {course.organizations && (
                <span>📚 {course.organizations.name}</span>
              )}
              <span className="text-brand">⚡ {course.xp_reward} XP</span>
              {course.course_exercises?.length > 0 && (
                <span>✍️ {course.course_exercises.length} ejercicio(s)</span>
              )}
            </div>
          </div>


          <div className="flex items-center gap-3">

            {(isOwner || profile?.is_admin) && (
              <Link
                href={`/dashboard/courses/${course.id}/edit`}
                className="rounded-lg border border-gray-200 dark:border-sidebar-border px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar
              </Link>
            )}

            <CourseActions
              courseId={course.id}
              status={course.status}
              userId={user.id}
              isSaved={isSaved}
              isCompleted={isCompleted}
              progressId={progress?.id}
              xpReward={course.xp_reward}
              canComplete={canComplete}
            />
          </div>
        </div>
      </header >

      {/* Contenido */}
      < div className="grid gap-6 lg:grid-cols-3" >
        {/* Video/Contenido principal */}
        < div className="lg:col-span-2 space-y-6" >
          {/* Video player */}
          {
            course.link_url && isYouTube && (
              <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
                <YouTubePlayer url={course.link_url} />
              </div>
            )
          }

          {/* Enlace externo si no es YouTube */}
          {
            course.link_url && !isYouTube && (
              <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
                <a
                  href={course.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border-2 border-brand/30 bg-brand/10 p-4 hover:bg-brand/20 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    🔗 Ir al curso externo
                  </span>
                  <span className="material-symbols-outlined h-5 w-5 text-brand">open_in_new</span>
                </a>
              </div>
            )
          }

          {/* Descripción */}
          <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Descripción
            </h2>
            {course.description ? (
              <div className="prose prose-sm prose-invert max-w-none text-gray-600 dark:text-muted-foreground">
                <p className="whitespace-pre-wrap">{course.description}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-muted-foreground italic">
                Sin descripción disponible
              </p>
            )}
          </div>

          {/* Ejercicios */}
          {course.course_exercises && course.course_exercises.length > 0 && (
            <div id="exercises" className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ejercicios prácticos
              </h2>
              <div className="space-y-4">
                {course.course_exercises.map((exercise: CourseExercise) => {
                  const submission = submissions?.find(s => s.exercise_id === exercise.id)

                  return (
                    <div
                      key={exercise.id}
                      className={`rounded-lg border-2 p-4 ${submission?.status === 'approved'
                        ? 'border-green-500/50 bg-green-500/10'
                        : submission
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {exercise.title}
                          </h3>
                          {exercise.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
                              {exercise.description}
                            </p>
                          )}
                          {exercise.requirements && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium text-gray-600 dark:text-muted-foreground">Requisitos:</span>
                              <p className="text-gray-600 dark:text-muted-foreground/70 whitespace-pre-wrap">
                                {exercise.requirements}
                              </p>
                            </div>
                          )}
                        </div>

                        {submission ? (
                          <div className="ml-4">
                            {submission.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                                ✓ Aprobado
                              </span>
                            ) : submission.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
                                ✗ Rechazado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
                                ⏱ Pendiente
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {!submission && (
                        <Link
                          href={`/dashboard/exercises/${exercise.id}/submit`}
                          className="mt-4 inline-block text-sm font-medium text-brand hover:text-brand/80"
                        >
                          Entregar ejercicio →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
          }
        </div >

        {/* Sidebar */}
        < div className="lg:col-span-1 space-y-6" >
          {/* Estado del curso */}
          < div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border" >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Estado del curso
            </h3>

            {
              isCompleted ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-500/20 p-4 text-center border border-green-500/30">
                    <span className="mx-auto material-symbols-outlined h-12 w-12 text-green-400">check_circle</span>
                    <p className="mt-2 font-medium text-green-400">
                      ¡Completado!
                    </p>
                    <p className="text-sm text-green-400/70">
                      Ganaste {progress.xp_earned} XP
                    </p>
                  </div>
                  {progress.completed_at && (
                    <p className="text-xs text-center text-gray-600 dark:text-muted-foreground">
                      Completado el {new Date(progress.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    Completa este curso para ganar <span className="font-semibold text-brand">{course.xp_reward} XP</span>
                  </p>
                  {!canComplete && <div className="rounded-lg bg-sidebar-border/10 p-4 border border-sidebar-border/20">
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      Para completar este curso y ganar <span className="font-semibold text-brand">{course.xp_reward} XP</span>,
                      debes aprobar el ejercicio final.
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-muted-foreground/70">
                      Tu entrega será revisada por un administrador.
                    </p>
                  </div>}
                </div>
              )
            }
          </div >

          {/* Información adicional */}
          < div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border" >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Información
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600 dark:text-muted-foreground">Learning Path</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                  <Link
                    href={`/dashboard/paths/${course.learning_paths.id}`}
                    className="hover:text-brand transition-colors"
                  >
                    {course.learning_paths.title}
                  </Link>
                </dd>
              </div>
              {course.organizations && (
                <div>
                  <dt className="text-gray-600 dark:text-muted-foreground">Organización</dt>
                  <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                    {course.organizations.website_url ? (
                      <a
                        href={course.organizations.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand transition-colors"
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
                <dt className="text-gray-600 dark:text-muted-foreground">Recompensa XP</dt>
                <dd className="mt-1 font-medium text-brand">
                  {course.xp_reward} XP
                </dd>
              </div>
            </dl>
          </div >
        </div >
      </div >
      <div className="mt-10">
        <Recommendations mode="similar" contextId={course.id} contextType="course" />
      </div>
    </>
  )
}
