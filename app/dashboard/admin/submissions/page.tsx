import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

interface Submission {
  id: string
  user_id: string
  exercise_id: string
  submission_type: string
  file_path: string | null
  drive_url: string | null
  submitted_at: string
  status: string
  profiles: { username: string | null }
  course_exercises: {
    title: string
    courses: { title: string; id: string }
  }
}

export default async function AdminSubmissionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // TODO: Agregar verificación de admin en la tabla profiles
  // Para MVP, cualquiera puede ver todas las submissions

  const { data: submissions } = await supabase
    .from('exercise_submissions')
    .select(`
      *,
      profiles!exercise_submissions_user_id_fkey (username),
      course_exercises (
        title,
        courses (title, id)
      )
    `)
    .order('submitted_at', { ascending: false })

  return (
    <>
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 dark:text-[#b0bfcc] hover:text-[#137fec] mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Revisar Submissions
        </h1>
      </header>

      {/* Contenido */}
      <div className="space-y-4">
        {submissions && submissions.length > 0 ? (
          submissions.map((submission: Submission) => (
            <div
              key={submission.id}
              className={`rounded-xl border-2 bg-white dark:bg-[#1a232e] p-6 ${submission.status === 'pending'
                ? 'border-yellow-500/50'
                : submission.status === 'approved'
                  ? 'border-green-500/50'
                  : 'border-red-500/50'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {submission.course_exercises.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${submission.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : submission.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                      {submission.status === 'pending' && '⏱ Pendiente'}
                      {submission.status === 'approved' && '✓ Aprobado'}
                      {submission.status === 'rejected' && '✗ Rechazado'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-[#b0bfcc] mb-2">
                    Curso: {submission.course_exercises.courses.title}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-[#b0bfcc]">
                    <span>
                      👤 {submission.profiles.username || 'Usuario anónimo'}
                    </span>
                    <span>
                      📅 {new Date(submission.submitted_at).toLocaleDateString('es-ES')}
                    </span>
                    <span>
                      📎 {submission.submission_type === 'text' ? 'Texto' : submission.submission_type === 'zip' ? 'Archivo ZIP' : 'Google Drive'}
                    </span>
                  </div>

                  {/* Enlaces a archivos */}
                  <div className="mt-4 flex gap-2">
                    {submission.file_path && (
                      <a
                        href={submission.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#137fec]/20 px-3 py-2 text-sm font-medium text-[#137fec] hover:bg-[#137fec]/30 transition-colors"
                      >
                        <span className="material-symbols-outlined h-4 w-4">download</span>
                        Descargar archivo
                      </a>
                    )}
                    {submission.drive_url && (
                      <a
                        href={submission.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#137fec]/20 px-3 py-2 text-sm font-medium text-[#137fec] hover:bg-[#137fec]/30 transition-colors"
                      >
                        <span className="material-symbols-outlined h-4 w-4">open_in_new</span>
                        Ver en Drive
                      </a>
                    )}
                    <Link
                      href={`/dashboard/courses/${submission.course_exercises.courses.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#3b4754]/50 px-3 py-2 text-sm font-medium text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754] transition-colors"
                    >
                      Ver curso
                    </Link>
                  </div>
                </div>

                {/* Acciones de aprobación */}
                {submission.status === 'pending' && (
                  <div className="ml-4 flex gap-2">
                    <form action={`/api/submissions/${submission.id}/approve`} method="POST">
                      <button
                        type="submit"
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-green-700 transition-colors"
                      >
                        ✓ Aprobar
                      </button>
                    </form>
                    <form action={`/api/submissions/${submission.id}/reject`} method="POST">
                      <button
                        type="submit"
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-red-700 transition-colors"
                      >
                        ✗ Rechazar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-[#3b4754]">
            <p className="text-gray-600 dark:text-[#b0bfcc]">No hay submissions para revisar.</p>
          </div>
        )}
      </div>
    </>
  )
}
