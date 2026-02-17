import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PathsListPage from '../page'
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
    getUserSavedPathsCached: vi.fn(() => Promise.resolve([])),
    getUserProgressCached: vi.fn(() => Promise.resolve([])),
    getUserCreatedPathIdsCached: vi.fn(() => Promise.resolve([])),
    getPathIdsFromCourseProgressCached: vi.fn(() => Promise.resolve([])),
    getPathsByIdsCached: vi.fn(() => Promise.resolve([]))
}))

import {
    getUserSavedPathsCached,
    getUserProgressCached,
    getUserCreatedPathIdsCached,
    getPathIdsFromCourseProgressCached,
    getPathsByIdsCached
} from '@/lib/cache'

describe('PathsListPage', () => {
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
            ; (getUserSavedPathsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getUserProgressCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getUserCreatedPathIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getPathIdsFromCourseProgressCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getPathsByIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    })

    test('redirects to login if no user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

        try {
            await PathsListPage()
        } catch {
            // expected redirect throw
        }

        expect(redirect).toHaveBeenCalledWith('/login')
    })


    test('renders empty state when no paths found', async () => {
        // Default mocks return empty arrays, so no paths found
        const jsx = await PathsListPage()
        render(jsx)

        expect(screen.getByText(/No expeditions/i)).toBeInTheDocument()
    })

    test('renders paths list', async () => {
        // Setup mock return values to simulate having paths
        // 1. Created paths
        ; (getUserCreatedPathIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(['p1'])

        // 2. Mock getPathsByIdsCached to return the path details
        const mockPaths = [{
            id: 'p1',
            title: 'Test Path',
            summary: 'Summary of path',
            created_by: 'u1',
            courses: [],
            organizations: [{ name: 'Test Org' }]
        }]

            ; (getPathsByIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockPaths)

        const jsx = await PathsListPage()
        render(jsx)

        expect(screen.getByText('Test Path')).toBeInTheDocument()
    })
})
