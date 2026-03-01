import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExpeditionsListPage from '../page'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Mocks
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
    useSearchParams: () => new URLSearchParams(), // mocked just in case, though page doesn't use it directly
}))

vi.mock('@/lib/cache', () => ({
    getUserSavedExpeditionsCached: vi.fn(() => Promise.resolve([])),
    getUserProgressCached: vi.fn(() => Promise.resolve([])),
    getUserCreatedExpeditionIdsCached: vi.fn(() => Promise.resolve([])),
    getExpeditionIdsFromQuestProgressCached: vi.fn(() => Promise.resolve([])),
    getExpeditionsByIdsCached: vi.fn(() => Promise.resolve([]))
}))

import {
    getUserSavedExpeditionsCached,
    getUserProgressCached,
    getUserCreatedExpeditionIdsCached,
    getExpeditionIdsFromQuestProgressCached,
    getExpeditionsByIdsCached
} from '@/lib/cache'

describe('ExpeditionsListPage', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockSupabase = {
            auth: {
                getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } }))
            }
        }

        // @ts-expect-error - mock types are simplified
        createClient.mockReturnValue(Promise.resolve(mockSupabase))

            // Reset cache mocks
            ; (getUserSavedExpeditionsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getUserProgressCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getUserCreatedExpeditionIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getExpeditionIdsFromQuestProgressCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getExpeditionsByIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    })

    test('redirects to login if no user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

        try {
            await ExpeditionsListPage()
        } catch {
            // expected redirect throw
        }

        expect(redirect).toHaveBeenCalledWith('/login')
    })


    test('renders empty state when no expeditions found', async () => {
        // Default mocks return empty arrays, so no expeditions found
        const jsx = await ExpeditionsListPage()
        render(jsx)

        expect(screen.getByText(/No expeditions/i)).toBeInTheDocument()
    })

    test('renders expeditions list', async () => {
        // Setup mock return values to simulate having expeditions
        // 1. Created expeditions
        ; (getUserCreatedExpeditionIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(['p1'])

        // 2. Mock getExpeditionsByIdsCached to return the expedition details
        const mockExpeditions = [{
            id: 'p1',
            title: 'Test Expedition',
            summary: 'Summary of expedition',
            created_by: 'u1',
            quests: [],
            organizations: [{ name: 'Test Org' }]
        }]

            ; (getExpeditionsByIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockExpeditions)

        const jsx = await ExpeditionsListPage()
        render(jsx)

        expect(screen.getByText('Test Expedition')).toBeInTheDocument()
    })
})
