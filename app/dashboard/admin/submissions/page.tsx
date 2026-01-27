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
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
              >
                ← Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Revisar Submissions
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {submissions && submissions.length > 0 ? (
            submissions.map((submission: Submission) => (
              <div
                key={submission.id}
                className={`rounded-lg border-2 bg-white p-6 ${
                  submission.status === 'pending'
                    ? 'border-yellow-300'
                    : submission.status === 'approved'
                    ? 'border-green-300'
                    : 'border-red-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {submission.course_exercises.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : submission.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {submission.status === 'pending' && '⏱ Pendiente'}
                        {submission.status === 'approved' && '✓ Aprobado'}
                        {submission.status === 'rejected' && '✗ Rechazado'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      Curso: {submission.course_exercises.courses.title}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar archivo
                        </a>
                      )}
                      {submission.drive_url && (
                        <a
                          href={submission.drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Ver en Drive
                        </a>
                      )}
                      <Link
                        href={`/dashboard/courses/${submission.course_exercises.courses.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
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
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          ✓ Aprobar
                        </button>
                      </form>
                      <form action={`/api/submissions/${submission.id}/reject`} method="POST">
                        <button
                          type="submit"
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
            <div className="rounded-lg bg-white p-12 text-center">
              <p className="text-gray-500">No hay submissions para revisar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
