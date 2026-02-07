
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

describe('ValidationPanel', () => {
    const mockPendingItems = {
        courses: [
            {
                id: 'c1',
                title: 'Pending Course 1',
                summary: 'Summary 1',
                is_validated: false,
                created_at: '2024-01-01',
                organizations: { id: 'o1', name: 'Org 1' }
            }
        ],
        organizations: [],
        paths: [],
        edits: []
    }

    const mockExistingItems = {
        organizations: [],
        courses: [],
        paths: []
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

    it('renders pending courses', () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))
        expect(screen.getByText('Pending Course 1')).toBeInTheDocument()
        expect(screen.getByText(/Org 1/)).toBeInTheDocument()
    })

    it('handles course approval', async () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))

        // Find approve buttons. 
        const approveButtons = screen.getAllByRole('button', { name: /aprobar/i })
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

    it('handles course rejection with reason', async () => {
        render(<ValidationPanel pendingItems={mockPendingItems} existingItems={mockExistingItems} />)
        fireEvent.click(screen.getByRole('button', { name: /quests/i }))

        // Click Reject Button
        const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i })
        fireEvent.click(rejectButtons[0])

        // Expect Modal to open
        expect(screen.getByText('Motivo del Rechazo')).toBeInTheDocument()

        // Type reason
        const reasonInput = screen.getByPlaceholderText('Ej: El contenido es inapropiado, faltan secciones, etc.')
        fireEvent.change(reasonInput, { target: { value: 'Violation of terms' } })

        // Click Confirm Reject
        const confirmButton = screen.getByRole('button', { name: 'Confirmar Rechazo' })
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
