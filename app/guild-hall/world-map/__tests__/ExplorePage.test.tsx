import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExplorePage from '../page'
import { createClient } from '@/utils/supabase/client'


// Mocks
vi.mock('@/utils/supabase/client', () => ({
    createClient: vi.fn()
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: vi.fn(() => new URLSearchParams())
}))

vi.mock('@/lib/queries', () => ({
    searchPaths: vi.fn(() => Promise.resolve([])),
    searchCourses: vi.fn(() => Promise.resolve([])),
    searchOrganizations: vi.fn(() => Promise.resolve([])),
    getUserSavedCourses: vi.fn(() => Promise.resolve([]))
}))

import { searchPaths, searchCourses, searchOrganizations } from '@/lib/queries'

describe('ExplorePage', () => {
    const mockSupabase = {
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } }))
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock types are simplified
        createClient.mockReturnValue(mockSupabase)

            // Reset query mocks to default empty array
            ; (searchPaths as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (searchCourses as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
            ; (searchOrganizations as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    })

    test('renders initial state with all tabs', async () => {
        render(<ExplorePage />)

        expect(screen.getByText(/EXPLORE/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /expeditions/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /QUESTS/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /ORGANIZATIONS/i })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Search for anything...')).toBeInTheDocument()
    })

    test('performs search and renders results', async () => {
        // Setup mock return values
        ; (searchPaths as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{
            id: 'p1',
            title: 'Path 1',
            organizations: [{ name: 'Org 1' }],
            courses: []
        }])
            ; (searchCourses as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{
                id: 'c1',
                title: 'Course 1',
                organizations: [{ name: 'Org 1' }]
            }])

        render(<ExplorePage />)

        const searchInput = screen.getByPlaceholderText('Search for anything...')
        fireEvent.change(searchInput, { target: { value: 'React' } })

        // Debounce might delay search, so wait
        await waitFor(() => {
            expect(screen.getByText('Path 1')).toBeInTheDocument()
            expect(screen.getByText('Course 1')).toBeInTheDocument()
        }, { timeout: 2000 })
    })

    test('filters by tab', async () => {
        render(<ExplorePage />)

        // Wait for initial load to complete
        await waitFor(() => {
            expect(searchPaths).toHaveBeenCalled()
        });

        // Reset mocks to verify calls after tab change
        (searchPaths as unknown as ReturnType<typeof vi.fn>).mockClear();
        (searchCourses as unknown as ReturnType<typeof vi.fn>).mockClear();
        (searchOrganizations as unknown as ReturnType<typeof vi.fn>).mockClear();

        // Switch to Courses tab
        const coursesTab = screen.getByRole('button', { name: /QUESTS/i })
        fireEvent.click(coursesTab)

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('tab=courses'))
        })

        await waitFor(() => {
            // searchCourses should be called for 'courses' tab
            expect(searchCourses).toHaveBeenCalled()
            // searchPaths is only called for 'all' or 'paths'
            expect(searchPaths).not.toHaveBeenCalled()
        })
    })

    test('renders empty state', async () => {
        render(<ExplorePage />)

        await waitFor(() => {
            // If no results, usually shows logic. 
            // Component logic: 
            // {loading ? ... : results.length > 0 ? ... : (searchQuery ? <Empty /> : <Initial />)}
            // If searchQuery is empty initially -> shows "Start typing" or similar ideally
            // Looking at code (not visible, but assuming default behaviour)
            // Actually let's assume valid expectation from previous code
            expect(screen.getByText('Start typing to search')).toBeInTheDocument()
        })
    })
})
