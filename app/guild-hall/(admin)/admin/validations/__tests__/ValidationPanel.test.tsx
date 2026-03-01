
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ValidationPanel } from '../ValidationPanel'

// Mock useRouter
const mockRouter = {
    refresh: vi.fn(),
    push: vi.fn(),
}
vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}))

const mockExistingItems = {
    organizations: [],
    quests: [],
    expeditions: []
}

describe('ValidationPanel', () => {
    const mockPendingItems = {
        quests: [
            {
                id: 'c1',
                title: 'Pending Quest 1',
                summary: 'Summary 1',
                is_validated: false,
                created_at: '2024-01-01',
                organizations: { id: 'o1', name: 'Org 1' }
            }
        ],
        organizations: [],
        expeditions: [],
        edits: []
    }


    beforeEach(() => {
        vi.clearAllMocks()
        const mockFetch = vi.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.fetch = mockFetch as any
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({})
        })
    })

    it('renders pending quests', () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))
        expect(screen.getByText('Pending Quest 1')).toBeInTheDocument()
        expect(screen.getByText(/Org 1/)).toBeInTheDocument()
    })

    it('handles quest approval', async () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))

        const approveButtons = screen.getAllByRole('button', { name: /approve/i })
        fireEvent.click(approveButtons[0])

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/admin/validations/quests/c1',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'approve' })
                })
            )
        })

        expect(mockRouter.refresh).toHaveBeenCalled()
    })

    it('handles quest rejection with reason', async () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))

        const rejectButtons = screen.getAllByTitle(/Reject/i)
        fireEvent.click(rejectButtons[0])

        expect(screen.getByText(/Rejection Reason/i)).toBeInTheDocument()

        const reasonInput = screen.getByPlaceholderText(/e.g., Content is inappropriate/i)
        fireEvent.change(reasonInput, { target: { value: 'Violation of terms' } })

        const confirmButton = screen.getByRole('button', { name: /Confirm Rejection/i })
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/admin/validations/quests/c1',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({
                        action: 'reject',
                        rejection_reason: 'Violation of terms'
                    })
                })
            )
        })

        expect(mockRouter.refresh).toHaveBeenCalled()
    })
})

describe('Edits tab — draft_data quests', () => {
    const draftQuest = {
        id: 'c2',
        title: 'Original Title',
        summary: 'Original summary',
        is_validated: true,
        created_at: '2024-02-01',
        organizations: { id: 'o1', name: 'Org 1' },
        draft_data: {
            title: 'Updated Title',
            summary: 'Updated summary',
            edit_reason: 'Fixed typo'
        }
    }

    const mockPendingItems = {
        quests: [draftQuest],
        organizations: [],
        expeditions: [],
        edits: []
    }

    it('shows draft-edit quests in Edits tab, NOT Quests tab', () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)

        // Quests tab should show "No pending quests"
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))
        expect(screen.getByText('No pending quests')).toBeInTheDocument()

        // Edits tab should show the draft quest
        const editsTabBtn = screen.getByRole('button', { name: /edits/i })
        fireEvent.click(editsTabBtn)
        expect(screen.getByText('Updated Title')).toBeInTheDocument()
        expect(screen.getByText('Pending Edit')).toBeInTheDocument()
    })

    it('shows the edits tab count reflecting draft-edit quests', () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        const editsTab = screen.getByRole('button', { name: /edits/i })
        // Count badge of "1" should be in the edits tab
        expect(editsTab.textContent).toContain('1')
    })

    it('opens the preview modal when Preview button is clicked', () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /edits/i }))

        const previewButton = screen.getByRole('button', { name: /preview/i })
        fireEvent.click(previewButton)

        expect(screen.getByText('Edit Preview')).toBeInTheDocument()
        // Should show before/after columns
        expect(screen.getAllByText('Before').length).toBeGreaterThan(0)
        expect(screen.getAllByText('After').length).toBeGreaterThan(0)
        // Should show edit reason in the modal
        expect(screen.getAllByText('Fixed typo').length).toBeGreaterThan(0)
    })

    it('closes the preview modal', () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /edits/i }))

        fireEvent.click(screen.getByRole('button', { name: /preview/i }))
        expect(screen.getByText('Edit Preview')).toBeInTheDocument()

        const closeButtons = screen.getAllByRole('button', { name: /close/i })
        // Last close button is the footer "Close Preview" button
        fireEvent.click(closeButtons[closeButtons.length - 1])
        expect(screen.queryByText('Edit Preview')).not.toBeInTheDocument()
    })

    it('calls the courses endpoint to approve a draft-edit course', async () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /edits/i }))

        const approveBtn = screen.getByRole('button', { name: /approve edit/i })
        fireEvent.click(approveBtn)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/admin/validations/quests/c2',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ action: 'approve' })
                })
            )
        })
    })
})
