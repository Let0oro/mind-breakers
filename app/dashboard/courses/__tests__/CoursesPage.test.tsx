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

describe('CoursesPage', () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock types are simplified
        createClient.mockResolvedValue(mockSupabase)
    })

    test('redirects to login if no user', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

        try {
            await CoursesPage()
        } catch {
            // caught redirect
        }

        expect(redirect).toHaveBeenCalledWith('/login')
    })

    test('renders courses list', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

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
            saved_courses: []
        }]

        // Helper mock chain
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createChain = (returnData: any = []) => {
            const chain = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                in: vi.fn(() => chain),
                order: vi.fn(() => chain),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                then: (resolve: any) => Promise.resolve({ data: returnData }).then(resolve)
            }
            return chain
        }

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'courses') {
                return createChain(mockCourses)
            }
            return createChain([]) // for saved_courses, user_course_progress initial IDs fetching
        })

        const jsx = await CoursesPage()
        render(jsx)

        expect(screen.getByText('React Fundamentals')).toBeInTheDocument()
        expect(screen.getByText('Tech Org')).toBeInTheDocument()
        expect(screen.getByText('100 XP')).toBeInTheDocument()
    })

    test('renders empty state', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createChain = (returnData: any = []) => {
            const chain = {
                select: vi.fn(() => chain),
                eq: vi.fn(() => chain),
                in: vi.fn(() => chain),
                order: vi.fn(() => chain),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                then: (resolve: any) => Promise.resolve({ data: returnData }).then(resolve)
            }
            return chain
        }

        mockSupabase.from.mockReturnValue(createChain([]))

        const jsx = await CoursesPage()
        render(jsx)

        expect(screen.getByText('No courses found')).toBeInTheDocument()
    })
})
