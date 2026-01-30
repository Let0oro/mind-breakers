import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch the draft course
    const { data: course, error } = await supabase
        .from('courses')
        .select(`
            *,
            learning_paths (id, title),
            organizations (name, website_url),
            course_exercises (*)
        `)
        .eq('id', id)
        .eq('created_by', user.id)
        .eq('status', 'draft')
        .single()

    if (error || !course) notFound()

    return (
        <>
            {/* Draft Banner */}
            <div className="mb-6 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-500">edit_document</span>
                    <div>
                        <p className="font-medium text-yellow-500">Borrador</p>
                        <p className="text-sm text-yellow-500/70">
                            Este curso aún no está publicado. Solo tú puedes verlo.
                        </p>
                    </div>
                </div>
                <Link
                    href={`/dashboard/drafts/${course.id}/edit`}
                    className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Continuar Editando
                </Link>
            </div>

            {/* Header */}
            <header className="mb-8">
                <Link
                    href="/dashboard/drafts"
                    className="text-sm text-gray-600 dark:text-[#b0bfcc] hover:text-[#137fec] mb-4 inline-flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Volver a Mis Borradores
                </Link>

                <div className="flex lg:items-end text-center sm:text-left lg:justify-between mt-2 lg:gap-4 flex-wrap-reverse justify-center items-center gap-8">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {course.title}
                            <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-400 ring-1 ring-inset ring-yellow-600/20">
                                Borrador
                            </span>
                        </h1>
                        {course.summary && (
                            <p className="mt-2 text-lg text-gray-600 dark:text-[#b0bfcc]">
                                {course.summary}
                            </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-[#b0bfcc]">
                            {course.organizations && (
                                <span>📚 {course.organizations.name}</span>
                            )}
                            <span className="text-[#137fec]">⚡ {course.xp_reward} XP</span>
                            {course.course_exercises?.length > 0 && (
                                <span>✍️ {course.course_exercises.length} ejercicio(s)</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/drafts/${course.id}/edit`}
                            className="rounded-lg bg-[#137fec] px-6 py-3 text-white font-bold hover:bg-[#137fec]/90 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Editar Borrador
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content Preview */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Descripción
                        </h2>
                        {course.description ? (
                            <div className="prose prose-sm prose-invert max-w-none text-gray-600 dark:text-[#b0bfcc]">
                                <p className="whitespace-pre-wrap">{course.description}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-[#b0bfcc]/70 italic">
                                Sin descripción. Añade una en el editor.
                            </p>
                        )}
                    </div>

                    {/* Exercises Preview */}
                    {course.course_exercises && course.course_exercises.length > 0 && (
                        <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Ejercicios ({course.course_exercises.length})
                            </h2>
                            <div className="space-y-3">
                                {course.course_exercises.map((ex: { id: string; title: string }, i: number) => (
                                    <div key={ex.id} className="p-3 rounded-lg bg-gray-50 dark:bg-[#101922] border border-gray-200 dark:border-[#3b4754]">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {i + 1}. {ex.title || 'Sin título'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            Información del Borrador
                        </h3>
                        <dl className="space-y-3 text-sm">
                            {course.learning_paths && (
                                <div>
                                    <dt className="text-gray-600 dark:text-[#b0bfcc]">Learning Path</dt>
                                    <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                                        {course.learning_paths.title}
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-gray-600 dark:text-[#b0bfcc]">Recompensa XP</dt>
                                <dd className="mt-1 font-medium text-[#137fec]">
                                    {course.xp_reward} XP
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-600 dark:text-[#b0bfcc]">Estado</dt>
                                <dd className="mt-1 font-medium text-yellow-500">
                                    Borrador (no publicado)
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </>
    )
}
