'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Course {
    id: string
    title: string
    summary: string | null
    description: string | null
    xp_reward: number
    link_url: string | null
    thumbnail_url: string | null
    created_by: string
}

interface Exercise {
    id: string
    title: string
    description: string | null
    requirements: string | null
    course_id: string
    created_at: string
}

interface EditRequest {
    id: string
    resource_type: string
    resource_id: string
    user_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
    reason: string | null
    status: string
    created_at: string
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [course, setCourse] = useState<Course | null>(null)
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [viewingExerciseForm, setViewingExerciseForm] = useState(false)

    const [isAdmin, setIsAdmin] = useState(false)
    const [pendingRequest, setPendingRequest] = useState<EditRequest | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Check admin status
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            const userIsAdmin = profile?.is_admin || false
            setIsAdmin(userIsAdmin)

            // Fetch course
            const { data, error: fetchError } = await supabase
                .from('courses')
                .select(`
          *,
          course_exercises (*)
        `)
                .eq('id', id)
                .single()

            if (fetchError || !data) {
                setError('Curso no encontrado')
                return
            }

            // Permission check: Owner AND Admin
            if (data.created_by !== user.id) {
                setError('No tienes permisos para editar este curso (No eres el creador)')
                return
            }

            // Allow creator to see page, but we will handle the save action differently
            /* 
            if (!userIsAdmin) {
                setError('No tienes permisos para editar este curso (Se requiere ser Admin)')
                return
            } 
            */
            // Requirement changed: Creators can now edit but via request.
            // So we remove the !userIsAdmin blocker above.

            setCourse(data)
            setExercises(data.course_exercises || [])

            // Check for pending edit requests
            const { data: request } = await supabase
                .from('edit_requests')
                .select('*')
                .eq('resource_id', id)
                .eq('resource_type', 'courses')
                .eq('status', 'pending')
                .single()

            if (request) {
                setPendingRequest(request)
            }
        }

        loadData()
    }, [id, router, supabase])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        const updates = {
            title: formData.get('title') as string,
            summary: formData.get('summary') as string,
            description: formData.get('description') as string,
            xp_reward: parseInt(formData.get('xp_reward') as string) || 0,
            link_url: formData.get('link_url') as string,
            thumbnail_url: formData.get('thumbnail_url') as string,
        }

        // 1. If Creator (Non-Admin), Request Edit
        if (!isAdmin) {
            const reason = prompt('Por favor, indica la razón de estos cambios para el administrador:')
            if (reason === null) {
                setLoading(false)
                return // Cancelled
            }
            if (!reason.trim()) {
                alert('Debes proporcionar una razón.')
                setLoading(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()

            const { error: requestError } = await supabase
                .from('edit_requests')
                .insert({
                    resource_type: 'courses',
                    resource_id: id,
                    user_id: user?.id,
                    data: updates,
                    reason: reason,
                    status: 'pending'
                })

            if (requestError) {
                setError(requestError.message)
            } else {
                alert('Solicitud de edición enviada correctamente. Espera validación.')
                router.refresh()
                // Reload to show pending state
                window.location.reload()
            }
            setLoading(false)
            return
        }

        // 2. If Admin, Direct Update
        const { error: updateError } = await supabase
            .from('courses')
            .update(updates)
            .eq('id', id)

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        router.push(`/dashboard/courses/${id}`)
        router.refresh()
    }

    const handleAddExercise = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const form = new FormData(e.currentTarget)

        const { data, error } = await supabase
            .from('course_exercises')
            .insert({
                course_id: id,
                title: form.get('ex_title'),
                description: form.get('ex_desc'),
                requirements: form.get('ex_req')
            })
            .select()

        if (error) {
            alert('Error creando ejercicio: ' + error.message)
        } else if (data) {
            setExercises([...exercises, ...data])
            setViewingExerciseForm(false)
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
            return
        }

        setLoading(true)

        const { error: deleteError } = await supabase
            .from('courses')
            .delete()
            .eq('id', id)

        if (deleteError) {
            setError(deleteError.message)
            setLoading(false)
            return
        }

        // Redirect to parent path if possible, or courses list
        // We don't have the path_id easily here unless we fetched it, assuming user knows where to go.
        router.push('/dashboard/courses')
        router.refresh()
    }

    if (!course && !error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="text-gray-600 dark:text-[#b0bfcc]">Cargando...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center flex-col gap-4">
                <div className="text-red-400 font-medium">{error}</div>
                <button
                    onClick={() => router.back()}
                    className="text-[#137fec] hover:underline"
                >
                    Volver
                </button>
            </div>
        )
    }

    return (
        <>
            <header className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-600 dark:text-[#b0bfcc] hover:text-[#137fec] mb-4 inline-flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Editar Curso
                </h1>
            </header>

            <div className="max-w-2xl">
                <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-[#3b4754]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {pendingRequest && (
                            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-yellow-500 mt-0.5">lock_clock</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-yellow-500">Edición Bloqueada</h3>
                                        <p className="text-sm text-yellow-500/80 mt-1">
                                            Este curso tiene una solicitud de edición pendiente de validación.
                                            No se pueden realizar más cambios hasta que un administrador la apruebe o rechace.
                                        </p>
                                        {pendingRequest.reason && (
                                            <p className="text-xs text-yellow-500/60 mt-2 italic">
                                                Razón: &quot;{pendingRequest.reason}&quot;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <fieldset disabled={!!pendingRequest} className="space-y-6 group-disabled:opacity-50">

                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    defaultValue={course?.title}
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                                />
                            </div>

                            <div>
                                <label htmlFor="summary" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Resumen
                                </label>
                                <input
                                    type="text"
                                    id="summary"
                                    name="summary"
                                    defaultValue={course?.summary || ''}
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={6}
                                    defaultValue={course?.description || ''}
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="xp_reward" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        XP Reward (0-1000)
                                    </label>
                                    <input
                                        type="number"
                                        id="xp_reward"
                                        name="xp_reward"
                                        min="0"
                                        max="1000"
                                        defaultValue={course?.xp_reward || 100}
                                        className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="link_url" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Enlace / Video URL
                                </label>
                                <input
                                    type="url"
                                    id="link_url"
                                    name="link_url"
                                    defaultValue={course?.link_url || ''}
                                    placeholder="https://youtube.com/..."
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                                />
                            </div>

                            <div>
                                <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Imagen Portada (URL)
                                </label>
                                <input
                                    type="url"
                                    id="thumbnail_url"
                                    name="thumbnail_url"
                                    defaultValue={course?.thumbnail_url || ''}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-[#f6f7f8] dark:bg-[#101922] px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-[#b0bfcc]/50 focus:border-[#137fec] focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                                />
                            </div>

                        </fieldset>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 rounded-lg border border-gray-200 dark:border-[#3b4754] px-4 py-2 text-sm font-medium text-gray-600 dark:text-[#b0bfcc] hover:bg-gray-100 dark:hover:bg-[#3b4754]/50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-lg bg-[#137fec] px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-[#137fec]/80 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Procesando...' : (isAdmin ? 'Guardar cambios' : 'Solicitar Validación')}
                            </button>
                        </div>
                    </form>

                    {/* Manage Exercises Section */}
                    <div className="mt-12 border-t border-gray-200 dark:border-[#3b4754] pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ejercicios</h2>
                            <button
                                type="button"
                                onClick={() => setViewingExerciseForm(!viewingExerciseForm)}
                                className="text-sm text-[#137fec] font-medium hover:underline"
                            >
                                {viewingExerciseForm ? 'Cancelar' : '+ Añadir Ejercicio'}
                            </button>
                        </div>

                        {viewingExerciseForm && (
                            <div className="mb-8 p-4 bg-gray-50 dark:bg-[#283039] rounded-lg border border-gray-200 dark:border-[#3b4754]">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Nuevo Ejercicio</h3>
                                <form onSubmit={handleAddExercise} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Título</label>
                                        <input name="ex_title" required className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] px-3 py-2 text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Descripción</label>
                                        <textarea name="ex_desc" rows={2} className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] px-3 py-2 text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Requisitos</label>
                                        <textarea name="ex_req" rows={2} placeholder="Qué debe entregar el alumno..." className="w-full rounded-lg border border-gray-200 dark:border-[#3b4754] bg-white dark:bg-[#1a232e] px-3 py-2 text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" disabled={loading} className="bg-[#137fec] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#137fec]/80">
                                            Crear Ejercicio
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="space-y-3">
                            {exercises.length > 0 ? (
                                exercises.map((ex: Exercise) => (
                                    <div key={ex.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-[#3b4754] rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{ex.title}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-sm">{ex.description}</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('¿Borrar ejercicio?')) return;
                                                await supabase.from('course_exercises').delete().eq('id', ex.id);
                                                setExercises(exercises.filter((e: Exercise) => e.id !== ex.id));
                                            }}
                                            className="text-red-500 hover:text-red-700 p-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic text-sm text-center py-4">No hay ejercicios aún.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 dark:border-[#3b4754] pt-8">
                        <h3 className="text-sm font-medium text-red-500 mb-4">Zona peligrosa</h3>
                        <button
                            onClick={handleDelete}
                            disabled={loading || !!pendingRequest}
                            className="rounded-lg bg-red-600/10 border border-red-600/20 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-600/20 disabled:opacity-50 transition-colors w-full sm:w-auto"
                        >
                            Eliminar Curso
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
