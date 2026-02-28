import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import QuestDetailPage from '../page'
import { createClient } from '@/utils/supabase/server'

// Mocks
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('@supabase/ssr', () => ({
    createBrowserClient: vi.fn(() => ({
        from: vi.fn(),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null }))
        }
    })),
    createServerClient: vi.fn()
}))

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

vi.mock('@/components/ui/YouTubePlayer', () => ({
    YouTubePlayer: () => <div data-testid="youtube-player">Video</div>
}))

vi.mock('@/components/features/QuestActions', () => ({
    QuestActions: () => <button>Actions</button>
}))

vi.mock('@/components/features/Recommendations', () => ({
    default: () => <div data-testid="recommendations">Recommendations</div>
}))

// Mock cache functions to avoid unstable_cache runtime requirements
vi.mock('@/lib/cache', () => ({
    getQuestDetailCached: vi.fn(),
    getUserQuestProgressCached: vi.fn(),
    getUserExerciseSubmissionsCached: vi.fn(),
    isQuestSavedCached: vi.fn(),
}))

import { getQuestDetailCached, getUserQuestProgressCached, getUserExerciseSubmissionsCached, isQuestSavedCached } from '@/lib/cache'

// Helper to create supabase chain mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createChain = (data: any) => {
    const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data, error: data ? null : { message: 'Not found' } })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: (resolve: any) => Promise.resolve({ data }).then(resolve)
    }
    return chain
}

describe('QuestDetailPage', () => {
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

        // Default mock for profiles query
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') return createChain({ is_admin: false })
            return createChain(null)
        })
    })

    test('renders quest details correctly', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        const mockQuest = {
            id: 'c1',
            title: 'Detailed Quest',
            summary: 'Summary',
            description: 'Description content',
            is_validated: true,
            created_by: 'u2',
            xp_reward: 100,
            expeditions: { id: 'p1', title: 'Expedition 1' },
            organizations: { name: 'Org 1' },
            quest_exercises: [],
            link_url: 'https://youtube.com/watch?v=123'
        }

        // Setup cache mocks
        // @ts-expect-error - mock types are simplified
        getQuestDetailCached.mockReturnValue(Promise.resolve({ data: mockQuest, error: null }))
        // @ts-expect-error - mock types are simplified
        getUserQuestProgressCached.mockReturnValue(Promise.resolve(null))
        // @ts-expect-error - mock types are simplified
        getUserExerciseSubmissionsCached.mockReturnValue(Promise.resolve([]))
        // @ts-expect-error - mock types are simplified
        isQuestSavedCached.mockReturnValue(Promise.resolve(false))

        const params = Promise.resolve({ id: 'c1' })
        const jsx = await QuestDetailPage({ params })
        render(jsx)

        expect(screen.getByText(/Detailed Quest/i)).toBeInTheDocument()
        expect(screen.getByText('Description content')).toBeInTheDocument()
        expect(screen.getByTestId('youtube-player')).toBeInTheDocument()
    })

    test('shows pending state for owner', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        const mockQuest = {
            id: 'c1',
            title: 'Pending Quest',
            is_validated: false,
            created_by: 'u1', // Owner
            expeditions: { id: 'p1', title: 'Expedition 1' },
            organizations: null,
            quest_exercises: []
        }

        // Setup cache mocks
        // @ts-expect-error - mock types are simplified
        getQuestDetailCached.mockReturnValue(Promise.resolve({ data: mockQuest, error: null }))
        // @ts-expect-error - mock types are simplified
        getUserQuestProgressCached.mockReturnValue(Promise.resolve(null))
        // @ts-expect-error - mock types are simplified
        getUserExerciseSubmissionsCached.mockReturnValue(Promise.resolve([]))
        // @ts-expect-error - mock types are simplified
        isQuestSavedCached.mockReturnValue(Promise.resolve(false))

        const params = Promise.resolve({ id: 'c1' })
        const jsx = await QuestDetailPage({ params })
        render(jsx)

        expect(screen.getByText(/Pending validation/i)).toBeInTheDocument()
        expect(screen.getByText(/Pending Quest/i)).toBeInTheDocument()
    })

    test('blocks access for non-owner if not validated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

        const mockQuest = {
            id: 'c1',
            title: 'Hidden Quest',
            is_validated: false,
            created_by: 'u2', // Not owner
            expeditions: { id: 'p1' },
            quest_exercises: []
        }

        // Setup cache mocks
        // @ts-expect-error - mock types are simplified
        getQuestDetailCached.mockReturnValue(Promise.resolve({ data: mockQuest, error: null }))
        // @ts-expect-error - mock types are simplified
        getUserQuestProgressCached.mockReturnValue(Promise.resolve(null))
        // @ts-expect-error - mock types are simplified
        getUserExerciseSubmissionsCached.mockReturnValue(Promise.resolve([]))
        // @ts-expect-error - mock types are simplified
        isQuestSavedCached.mockReturnValue(Promise.resolve(false))

        const params = Promise.resolve({ id: 'c1' })
        const jsx = await QuestDetailPage({ params })
        render(jsx)

        expect(screen.getByText(/Content not available/i)).toBeInTheDocument()
        expect(screen.queryByText('Hidden Quest')).not.toBeInTheDocument()
    })
})
