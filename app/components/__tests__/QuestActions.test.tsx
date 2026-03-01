import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuestActions } from '../features/QuestActions'
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

describe('QuestActions', () => {
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
        render(<QuestActions
            questId="c1"
            userId="u1"
            isSaved={false}
            isCompleted={false}
            xpReward={10}
            status="published"
        />)

        const saveButton = screen.getByText('Save')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText('Saved')).toBeInTheDocument()
            // Verify insert was called (since it was not saved)
            expect(mockSupabase.from).toHaveBeenCalledWith('saved_quests')
        })

        // Click again to unsave
        fireEvent.click(screen.getByText('Saved'))
        await waitFor(() => {
            expect(screen.getByText('Save')).toBeInTheDocument()
        })
    })

    test('completes a quest', async () => {
        render(<QuestActions
            questId="c1"
            userId="u1"
            isSaved={false}
            isCompleted={false}
            xpReward={10}
            status="published"
        />)

        const completeButton = screen.getByText('Complete')
        fireEvent.click(completeButton)

        await waitFor(() => {
            expect(mockRouterRefresh).toHaveBeenCalled()
            // Should show "Undo Complete" button now
            expect(screen.getByText('Undo Complete')).toBeInTheDocument()
            expect(mockSupabase.from).toHaveBeenCalledWith('user_quest_progress')
        })
    })

    test('reverts completion', async () => {
        // Need progressId to revert
        render(<QuestActions
            questId="c1"
            userId="u1"
            isSaved={false}
            isCompleted={true}
            progressId="p1"
            xpReward={10}
            status="published"
        />)

        const incompleteButton = screen.getByText('Undo Complete')
        fireEvent.click(incompleteButton)

        await waitFor(() => {
            expect(mockRouterRefresh).toHaveBeenCalled()
            expect(screen.getByText('Complete')).toBeInTheDocument()
        })
    })
})
