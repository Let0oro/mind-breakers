'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

// Import our new component (assuming it's in components folder relative to app root or alias)
// Since we used write_to_file in dashboard/paths/[id]/edit context previously? No, app/components.
import { SortableCourseItem } from '@/components/SortableCourseItem'
import { ManageCoOwners } from '@/components/features/ManageCoOwners'
import type { AdminRequest } from '@/lib/types'

interface LearningPath {
  id: string
  title: string
  summary: string | null
  description: string | null
  created_by: string
}

interface CourseItem {
  id: string
  title: string
  order_index: number
}

export default function EditPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [path, setPath] = useState<LearningPath | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])

  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<AdminRequest | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

      // 1. Fetch Path
      const { data: pathData, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', id)
        .single()

      if (pathError || !pathData) {
        setError('Path no encontrado')
        return
      }

      setPath(pathData)

      // Check if user is creator or co-owner
      const isCreator = pathData.created_by === user.id
      let isCoOwner = false

      if (!isCreator) {
        const { data: coOwnerData } = await supabase
          .from('path_owners')
          .select('*')
          .eq('path_id', id)
          .eq('user_id', user.id)
          .single()
        isCoOwner = !!coOwnerData
      }

      // If NOT Admin AND NOT Creator AND NOT CoOwner -> They are a contributor requesting an edit
      // We do NOT block them anymore, but we change the submit behavior.
      const canDirectEdit = userIsAdmin || isCreator || isCoOwner
      setIsAdmin(canDirectEdit) // Reusing isAdmin state to mean "Can Direct Edit" for UI (or we should rename/add state)
      // Actually, let's keep isAdmin as strictly Global Admin, and add canDirectEdit state?
      // For now, to minimize refactor, let's assume `isAdmin` in the UI context means "Can bypass validation".
      // But wait, the previous code used `isAdmin` to determine if validation request is needed.
      // So setting `setIsAdmin(canDirectEdit)` effectively achieves "If you are Creator/CoOwner/Admin you edit directly".
      // This matches the goal.

      // 2. Fetch Courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, order_index')
        .eq('path_id', id)
        .order('order_index', { ascending: true })

      setCourses(coursesData || [])

      // Check for pending edit requests (Only relevant if they can't direct edit?)
      // Actually, if there is a pending request, MAYBE we block edits even for owners to avoid conflict?
      // Or we just show it. The current UI blocks inputs if pendingRequest exists.
      // If I am an Owner, I might want to SEE the pending request and Approve/Reject it?
      // But this is the Edit Page.
      // If I am a contributor, I should see my own pending key?
      // The current logic: fetches edit_requests for this resource.
      // If it exists and status is pending, it sets pendingRequest, which disables the form.
      // This is good behavior for standard users.
      // For Admins/Owners, they probably shouldn't be blocked by a pending request from someone else?
      // But the query `orderBy` isn't there, so it just gets *any* single pending request.
      // If there are multiple, who knows. `single()` might error if multiple.
      // Let's keep it simple: If *any* pending request exists valid for this resource, we show it.
      // But we should probably filter by `user_id` if we only want to block the user who made it?
      // Or block globally?
      // Design decision: Block strictly for the user who made it OR block globally?
      // Current: global block for this resource if `single()` finds one.
      // Let's refine: Only block if `user_id === user.id` OR if we want a global "Under Review" lock.
      // User requirement: "can edit but the path admin verifies".
      // If I edit and submit, it goes to pending. If I come back, I should see "Pending".
      // So fetch request for THIS user.
      const { data: request } = await supabase
        .from('edit_requests')
        .select('*')
        .eq('resource_id', id)
        .eq('resource_type', 'learning_paths')
        .eq('status', 'pending')
        .eq('user_id', user.id) // Only my requests
        .single()

      if (request) {
        setPendingRequest(request)
      }
    }

    loadData()
  }, [id, router, supabase])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setCourses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const updates = {
      title: formData.get('title') as string,
      summary: formData.get('summary') as string,
      description: formData.get('description') as string,
      // Note: courses reordering is tied to this submit too, but complex to store in JSON request well.
      // For now, if requesting changes, we might only support basic info edits OR we need to include order in JSON?
      // The user wants to reorder with drag and drop. Reordering IS an edit.
      // So we should capture the new COURSE ORDER in the request JSON too.
      _courses_order_update: courses.map((c, i) => ({ id: c.id, order_index: i }))
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
          resource_type: 'learning_paths', // Match table content
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
        window.location.reload()
      }
      setLoading(false)
      return
    }

    // 2. If Admin, Direct Update (Existing Logic - but updated to use updates vars if possible, or keep as is)
    // We will keep existing logic but wrapped in isAdmin check implicitly by falling through?
    // Actually, the existing logic used separate update calls. We should preserve that for Admin.


    // 1. Update Path Details
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        title: formData.get('title') as string,
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // 2. Update Courses Order
    // We update all courses with their new index
    if (courses.length > 0) {
      // Prepare updates
      const updates = courses.map((course, index) => ({
        id: course.id,
        order_index: index,
        // We only need to update order_index, but upsert requires specific handling or multiple update calls.
        // Supabase JS doesn't support bulk update with different values easily in one call unless we use upsert with all required fields.
        // Alternatively, separate calls. For UI responsiveness, separate calls are fine for small lists (<50).
      }))

      // Using Promise.all for parallel updates
      const updatePromises = updates.map(u =>
        supabase.from('courses').update({ order_index: u.order_index }).eq('id', u.id)
      )

      await Promise.all(updatePromises)
    }

    router.push(`/dashboard/paths/${id}`)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este path? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)

    const { error: deleteError } = await supabase
      .from('learning_paths')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/paths')
  }

  if (!path && !error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-600 dark:text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <>
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 dark:text-muted-foreground hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Editar Learning Path
        </h1>
      </header>

      <div className="max-w-2xl">
        <div className="rounded-xl bg-white dark:bg-[#1a232e] p-6 border border-gray-200 dark:border-sidebar-border">
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
                      Este path tiene una solicitud de edición pendiente de validación.
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
                  defaultValue={path?.title}
                  className="w-full rounded-lg border border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-muted-foreground/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#137fec]"
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
                  defaultValue={path?.summary || ''}
                  className="w-full rounded-lg border border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-muted-foreground/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#137fec]"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Descripción completa
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  defaultValue={path?.description || ''}
                  className="w-full rounded-lg border border-gray-200 dark:border-sidebar-border bg-sidebar dark:bg-sidebar px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-600 dark:text-muted-foreground/50 focus:border-brand focus:outline-none focus:ring-1 focus:ring-[#137fec] resize-none"
                />
              </div>

              {/* Courses Reordering Section */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Orden de los Cursos
                </label>
                <p className="text-xs text-gray-500 mb-3">Arrastra para reordenar. El orden se guardará al hacer clic en &quot;Guardar cambios&quot;.</p>

                <div className="bg-gray-50 dark:bg-[#151b24] p-4 rounded-lg border border-gray-200 dark:border-sidebar-border">
                  {courses.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={courses.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {courses.map((course) => (
                          <SortableCourseItem key={course.id} id={course.id}>
                            <div className="font-medium text-gray-900 dark:text-white">{course.title}</div>
                          </SortableCourseItem>
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <p className="text-gray-500 italic text-sm text-center">Este path no tiene cursos todavía.</p>
                  )}
                </div>
              </div>

            </fieldset>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-gray-200 dark:border-sidebar-border px-4 py-2 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-sidebar-border/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-brand/80 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Procesando...' : (isAdmin ? 'Guardar cambios' : 'Solicitar Validación')}
              </button>
            </div>
          </form>

          <div className="mt-8 border-t border-gray-200 dark:border-sidebar-border pt-8">
            <ManageCoOwners pathId={id} createdBy={path?.created_by || ''} />
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-sidebar-border pt-8">
            <h3 className="text-sm font-medium text-red-500 mb-4">Zona peligrosa</h3>
            <button
              onClick={handleDelete}
              disabled={loading || !!pendingRequest}
              className="rounded-lg bg-red-600/10 border border-red-600/20 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-600/20 disabled:opacity-50 transition-colors"
            >
              Eliminar Path
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
