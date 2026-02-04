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
  github_repo_url: string | null
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
          className="text-sm text-gray-600 dark:text-muted-foreground hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
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

                  <p className="text-sm text-gray-600 dark:text-muted-foreground mb-2">
                    Curso: {submission.course_exercises.courses.title}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
                    <span>
                      👤 {submission.profiles.username || 'Usuario anónimo'}
                    </span>
                    <span>
                      📅 {new Date(submission.submitted_at).toLocaleDateString('es-ES')}
                    </span>
                    <span>
                      📎 {submission.submission_type === 'text' ? 'Texto' : submission.submission_type === 'zip' ? 'Archivo ZIP' : submission.submission_type === 'github' ? 'GitHub' : 'Google Drive'}
                    </span>
                  </div>

                  {/* Enlaces a archivos */}
                  <div className="mt-4 flex gap-2">
                    {submission.file_path && (
                      <a
                        href={submission.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-brand/20 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/30 transition-colors"
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
                        className="inline-flex items-center gap-2 rounded-lg bg-brand/20 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/30 transition-colors"
                      >
                        <span className="material-symbols-outlined h-4 w-4">open_in_new</span>
                        Ver en Drive
                      </a>
                    )}
                    {submission.github_repo_url && (
                      <a
                        href={submission.github_repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900/90 dark:bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:hover:bg-white/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                        Ver en GitHub
                      </a>
                    )}
                    <Link
                      href={`/dashboard/courses/${submission.course_exercises.courses.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-sidebar-border/50 px-3 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border transition-colors"
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
          <div className="rounded-xl bg-white dark:bg-[#1a232e] p-12 text-center border border-gray-200 dark:border-sidebar-border">
            <p className="text-gray-600 dark:text-muted-foreground">No hay submissions para revisar.</p>
          </div>
        )}
      </div>
    </>
  )
}
