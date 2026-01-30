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

describe('PathsListPage', () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chain: any = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                in: vi.fn(() => chain),
                order: vi.fn(() => Promise.resolve({ data: [] })),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                then: (cb: any) => Promise.resolve({ data: [] }).then(cb)
            }
            return chain
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock types are simplified
        createClient.mockResolvedValue(mockSupabase)
    })

    test('redirects to login if no user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

        try {
            await PathsListPage()
        } catch {
            // redirect might throw in Next.js, but our mock is a spy. 
            // In real next.js redirect throws NEXT_REDIRECT error.
        }

        expect(redirect).toHaveBeenCalledWith('/login')
    })

    test('renders empty state when no paths found', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        // Mock empty responses for created, progress, and saved paths
        // We need to return an object that allows chaining. 
        // The page logic is complex: it calls .from multiple times.
        // Let's rely on the mock implementation chain.
        // The first 3 calls are for gathering IDs.

        // Simple mock setup for this test: always return empty data
        const chain = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            in: vi.fn(() => chain),
            order: vi.fn(() => Promise.resolve({ data: [] })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            then: (resolve: any) => Promise.resolve({ data: [] }).then(resolve) // Allow await directly
        }
        mockSupabase.from.mockReturnValue(chain)

        const jsx = await PathsListPage()
        render(jsx)

        expect(screen.getByText('No active learning paths')).toBeInTheDocument()
    })

    test('renders paths list', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        // Scenario: 1 created path
        const mockPaths = [{
            id: 'p1',
            title: 'Test Path',
            summary: 'Summary of path',
            created_by: 'u1',
            courses: [],
            organizations: [{ name: 'Test Org' }]
        }]

        // We need to match specific table calls to return data
        mockSupabase.from.mockImplementation((table?: string) => {
            if (table === 'learning_paths') {
                return {
                    select: () => ({
                        eq: () => Promise.resolve({ data: [{ id: 'p1' }] }), // For created_by check
                        in: () => ({
                            order: () => Promise.resolve({ data: mockPaths }) // For final fetch
                        })
                    })
                }
            }
            // Defaut empty for others (saved_paths, user_course_progress)
            const chain = {
                select: () => chain,
                eq: () => chain,
                in: () => chain,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                then: (resolve: any) => Promise.resolve({ data: [] }).then(resolve)
            }
            return chain
        })

        const jsx = await PathsListPage()
        render(jsx)

        expect(screen.getByText('Test Path')).toBeInTheDocument()
        expect(screen.getByText('by Test Org')).toBeInTheDocument()
    })
})
