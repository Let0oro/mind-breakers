import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CoursesPage from '../page'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Mocks
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
    useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/cache', () => ({
    getUserSavedQuestsCached: vi.fn(() => Promise.resolve([])),
    getUserProgressCached: vi.fn(() => Promise.resolve([])),
    getUserCreatedQuestIdsCached: vi.fn(() => Promise.resolve([])),
    getQuestsByIdsCached: vi.fn(() => Promise.resolve([]))
}))

import {
    getUserSavedQuestsCached,
    getUserProgressCached,
    getUserCreatedQuestIdsCached,
    getQuestsByIdsCached
} from '@/lib/cache'

describe('CoursesPage', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockSupabase = {
            auth: {
                getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null }))
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    in: vi.fn(() => Promise.resolve({ data: [{ id: 'u2', username: 'CreatorUser' }] }))
                }))
            }))
        }

        // @ts-expect-error - mock types are simplified
        createClient.mockReturnValue(Promise.resolve(mockSupabase))

            // Reset cache mocks
            ; (getUserSavedQuestsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getUserProgressCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getUserCreatedQuestIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (getQuestsByIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    })

    test('redirects to login if no user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

        try {
            await CoursesPage({ searchParams: Promise.resolve({}) })
        } catch {
            // caught redirect
        }

        expect(redirect).toHaveBeenCalledWith('/login')
    })

    test('renders courses list', async () => {
        // Setup mock return values
        // 1. Created quests
        ; (getUserCreatedQuestIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(['c1'])

        // 2. Quest details
        const mockCourses = [{
            id: 'c1',
            title: 'React Fundamentals',
            summary: 'Learn React',
            thumbnail_url: null,
            xp_reward: 100,
            is_validated: true,
            created_by: 'u2',
            organizations: [{ name: 'Tech Org' }],
            user_course_progress: [],
            saved_courses: [],
            status: 'published'
        }]

            ; (getQuestsByIdsCached as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCourses)

        const jsx = await CoursesPage({ searchParams: Promise.resolve({}) })
        render(jsx)

        expect(screen.getByText('React Fundamentals')).toBeInTheDocument()
        expect(screen.getByText('Tech Org')).toBeInTheDocument()
    })

    test('renders empty state', async () => {
        // Default mocks return empty arrays

        const jsx = await CoursesPage({ searchParams: Promise.resolve({}) })
        render(jsx)

        expect(screen.getByText(/No courses found/i)).toBeInTheDocument()
    })
})
