import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../page'
import { createClient } from '@/utils/supabase/client'

// Mock createClient
vi.mock('@/utils/supabase/client', () => ({
    createClient: vi.fn()
}))

// Mock useRouter
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    })
}))

describe('LoginPage', () => {
    const mockSignInWithPassword = vi.fn()
    const mockSignInWithOAuth = vi.fn()

    const mockSupabase = {
        auth: {
            signInWithPassword: mockSignInWithPassword,
            signInWithOAuth: mockSignInWithOAuth,
        }
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock types are simplified
        createClient.mockReturnValue(mockSupabase)
    })

    test('renders login form', () => {
        render(<LoginPage />)
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })

    test('handles successful login', async () => {
        mockSignInWithPassword.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } })

        fireEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            })
            expect(mockPush).toHaveBeenCalledWith('/guild-hall')
            expect(mockRefresh).toHaveBeenCalled()
        })
    })

    test('handles login error', async () => {
        mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } })

        render(<LoginPage />)

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'wrongpass' } })

        fireEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
            expect(mockPush).not.toHaveBeenCalled()
        })
    })
})
