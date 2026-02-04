import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CourseActions } from '../features/CourseActions'
import { createClient } from '@/utils/supabase/client'

// Mocks
vi.mock('@/utils/supabase/client', () => ({
    createClient: vi.fn()
}))

const mockRouterRefresh = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: mockRouterRefresh,
    })
}))

describe('CourseActions', () => {
    const mockSupabase = {
        from: vi.fn(() => ({
            delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
            update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { total_xp: 100 }, error: null }))
                }))
            }))
        }))
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - Mocking supabase client return type is complex
        createClient.mockReturnValue(mockSupabase)
    })

    test('toggles save state', async () => {
        render(<CourseActions
            courseId="c1"
            userId="u1"
            isSaved={false}
            isCompleted={false}
            xpReward={10}
            status="published"
        />)

        const saveButton = screen.getByText('☆ Guardar')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText('★ Guardado')).toBeInTheDocument()
            // Verify insert was called (since it was not saved)
            expect(mockSupabase.from).toHaveBeenCalledWith('saved_courses')
        })

        // Click again to unsave
        fireEvent.click(screen.getByText('★ Guardado'))
        await waitFor(() => {
            expect(screen.getByText('☆ Guardar')).toBeInTheDocument()
        })
    })

    test('completes a course', async () => {
        render(<CourseActions
            courseId="c1"
            userId="u1"
            isSaved={false}
            isCompleted={false}
            xpReward={10}
            status="published"
        />)

        const completeButton = screen.getByText('✓ Completar')
        fireEvent.click(completeButton)

        await waitFor(() => {
            expect(mockRouterRefresh).toHaveBeenCalled()
            // Should show "No completado" button now aka "Mark Incomplete" which implies it is completed
            expect(screen.getByText('✕ No completado')).toBeInTheDocument()
            expect(mockSupabase.from).toHaveBeenCalledWith('user_course_progress')
        })
    })

    test('reverts completion', async () => {
        // Need progressId to revert
        render(<CourseActions
            courseId="c1"
            userId="u1"
            isSaved={false}
            isCompleted={true}
            progressId="p1"
            xpReward={10}
            status="published"
        />)

        const incompleteButton = screen.getByText('✕ No completado')
        fireEvent.click(incompleteButton)

        await waitFor(() => {
            expect(mockRouterRefresh).toHaveBeenCalled()
            expect(screen.getByText('✓ Completar')).toBeInTheDocument()
        })
    })
})
