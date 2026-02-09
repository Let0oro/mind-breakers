
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { NotificationBell } from '../NotificationBell'
import { createClient } from '@/utils/supabase/client'

// Mock supabase client
vi.mock('@/utils/supabase/client', () => ({
    createClient: vi.fn()
}))

// Mock Toast component to simplify test
vi.mock('@/components/ui/Toast', () => ({
    Toast: ({ title, message }: { title: string, message: string }) => (
        <div data-testid="toast">
            {title}: {message}
        </div>
    )
}))

describe('NotificationBell', () => {
    const mockSubscribe = vi.fn()
    const mockUnsubscribe = vi.fn()
    const mockRemoveChannel = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockOnHandler: ((payload: any) => void) | null = null

    const mockChannel = {
        on: vi.fn((event, filter, callback) => {
            if (event === 'postgres_changes' && filter.event === 'INSERT') {
                mockOnHandler = callback
            }
            return mockChannel
        }),
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe
    }

    const mockSupabase = {
        from: vi.fn(),
        channel: vi.fn(() => mockChannel),
        removeChannel: mockRemoveChannel
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock types are simplified
        createClient.mockReturnValue(mockSupabase)
        mockOnHandler = null
    })

    it('renders notification bell with 0 unread count initially', async () => {
        // Mock empty notifications
        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: [] })
                    })
                })
            })
        })

        await act(async () => {
            render(<NotificationBell userId="u1" />)
        })

        expect(screen.getByText('raven')).toBeInTheDocument()
        // Should not show badge
        expect(screen.queryByText(/0/)).not.toBeInTheDocument()
    })

    it('renders unread count badge', async () => {
        const mockNotifications = [
            { id: 'n1', title: 'Notif 1', read: false, created_at: new Date().toISOString() },
            { id: 'n2', title: 'Notif 2', read: true, created_at: new Date().toISOString() }
        ]

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: mockNotifications })
                    })
                })
            })
        })

        await act(async () => {
            render(<NotificationBell userId="u1" />)
        })

        // Should show '1' badge
        expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('opens notification panel on click', async () => {
        const mockNotifications = [
            { id: 'n1', title: 'Notif 1', message: 'Msg 1', type: 'info', read: false, created_at: new Date().toISOString() }
        ]

        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: mockNotifications })
                    })
                })
            })
        })

        await act(async () => {
            render(<NotificationBell userId="u1" />)
        })

        const bellButton = screen.getByRole('button')
        fireEvent.click(bellButton)

        expect(screen.getByText('Notificaciones')).toBeInTheDocument()
        expect(screen.getByText('Notif 1')).toBeInTheDocument()
        expect(screen.getByText('Msg 1')).toBeInTheDocument()
    })

    it('marks notification as read', async () => {
        const mockNotifications = [
            { id: 'n1', title: 'Notif 1', read: false, created_at: new Date().toISOString() }
        ]

        const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'notifications') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockReturnValue({
                                limit: vi.fn().mockResolvedValue({ data: mockNotifications })
                            })
                        })
                    }),
                    update: mockUpdate
                }
            }
            return {}
        })

        await act(async () => {
            render(<NotificationBell userId="u1" />)
        })

        // Open panel
        fireEvent.click(screen.getByRole('button'))

        // Find check button (mark as read)
        // It's a button with 'check' icon
        const checkButton = screen.getByText('check').closest('button')
        expect(checkButton).toBeInTheDocument()

        if (checkButton) {
            await act(async () => {
                fireEvent.click(checkButton)
            })
        }

        expect(mockUpdate).toHaveBeenCalledWith({ read: true })

        // After update, unread count should decrease (badge disappears if 0)
        expect(screen.queryByText('1')).not.toBeInTheDocument()
    })

    it('handles realtime notification', async () => {
        mockSupabase.from.mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: [] })
                    })
                })
            })
        })

        await act(async () => {
            render(<NotificationBell userId="u1" />)
        })

        // Simulate realtime insert event
        const newNotification = {
            id: 'n_new',
            title: 'New Notification',
            message: 'Realtime message',
            type: 'info',
            read: false,
            created_at: new Date().toISOString()
        }

        act(() => {
            if (mockOnHandler) {
                mockOnHandler({ new: newNotification })
            }
        })

        // Should update badge
        expect(screen.getByText('1')).toBeInTheDocument()

        // Should show Toast
        expect(screen.getByTestId('toast')).toBeInTheDocument()
        expect(screen.getByText(/New Notification/)).toBeInTheDocument()
    })
})
