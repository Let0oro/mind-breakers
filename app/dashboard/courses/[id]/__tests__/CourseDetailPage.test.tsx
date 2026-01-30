import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CourseDetailPage from '../page'
import { createClient } from '@/utils/supabase/server'


// Mocks
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

vi.mock('@/components/YouTubePlayer', () => ({
    YouTubePlayer: () => <div data-testid="youtube-player">Video</div>
}))

vi.mock('@/components/CourseActions', () => ({
    CourseActions: () => <button>Actions</button>
}))

describe('CourseDetailPage', () => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createChain = (data: any) => {
        const chain = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            in: vi.fn(() => chain),
            single: vi.fn(() => Promise.resolve({ data, error: data ? null : { message: 'Not found' } })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            then: (resolve: any) => Promise.resolve({ data }).then(resolve) // for array returns
        }
        return chain
    }

    test('renders course details correctly', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        const mockCourse = {
            id: 'c1',
            title: 'Detailed Course',
            summary: 'Summary',
            description: 'Description content',
            is_validated: true,
            created_by: 'u2',
            xp_reward: 100,
            learning_paths: { id: 'p1', title: 'Path 1' },
            organizations: { name: 'Org 1' },
            course_exercises: [],
            user_course_progress: [],
            link_url: 'https://youtube.com/watch?v=123'
        }

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') return createChain({}) // profile check
            if (table === 'courses') return createChain(mockCourse)
            if (table === 'exercise_submissions') return createChain([]) // submissions
            if (table === 'saved_courses') return createChain(null) // saved check
            return createChain([])
        })

        const params = Promise.resolve({ id: 'c1' })
        const jsx = await CourseDetailPage({ params })
        render(jsx)

        expect(screen.getByText('Detailed Course')).toBeInTheDocument()
        expect(screen.getByText('Description content')).toBeInTheDocument()
        expect(screen.getByTestId('youtube-player')).toBeInTheDocument()
    })

    test('shows pending state for owner', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        const mockCourse = {
            id: 'c1',
            title: 'Pending Course',
            is_validated: false,
            created_by: 'u1', // Owner
            learning_paths: { id: 'p1', title: 'Path 1' },
            organizations: null,
            course_exercises: [],
            user_course_progress: []
        }

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') return createChain({})
            if (table === 'courses') return createChain(mockCourse)
            if (table === 'exercise_submissions') return createChain([])
            if (table === 'saved_courses') return createChain(null)
            return createChain([])
        })

        const params = Promise.resolve({ id: 'c1' })
        const jsx = await CourseDetailPage({ params })
        render(jsx)

        expect(screen.getByText('Pendiente de validación')).toBeInTheDocument()
        expect(screen.getByText('Pending Course')).toBeInTheDocument() // Should still see content
    })

    test('blocks access for non-owner if not validated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        const mockCourse = {
            id: 'c1',
            title: 'Hidden Course',
            is_validated: false,
            created_by: 'u2', // Not owner
            // ... other fields needed to avoid crash before check?
            // The check happens early.
            learning_paths: { id: 'p1' }, // minimal
            course_exercises: [],
            user_course_progress: []
        }

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') return createChain({})
            if (table === 'courses') return createChain(mockCourse)
            return createChain([])
        })

        const params = Promise.resolve({ id: 'c1' })
        const jsx = await CourseDetailPage({ params })
        render(jsx)

        expect(screen.getByText('Contenido no disponible')).toBeInTheDocument()
        expect(screen.queryByText('Hidden Course')).not.toBeInTheDocument()
    })
})
