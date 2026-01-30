import { expect, test, describe, vi, beforeEach } from 'vitest'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsForm } from '../SettingsForm'
import { createClient } from '@/utils/supabase/client'

// Mock the module that exports createClient
vi.mock('@/utils/supabase/client', () => ({
    createClient: vi.fn()
}))

// Mock useRouter
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    })
}))

describe('SettingsForm', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', app_metadata: { provider: 'email' } }
    const mockProfile = { username: 'testuser', avatar_url: 'https://example.com/avatar.png' }

    // Mock functions for Supabase chain

    // Correct chain: from -> update -> eq -> Promise
    // Actually in code: .from('profiles').update(updates).eq('id', user.id)

    // Let's restructure the mock to match the code exactly:
    // supabase.from('profiles').update(...).eq(...)
    const mockEqFinal = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateChain = vi.fn().mockReturnValue({ eq: mockEqFinal })
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdateChain })

    // Storage mocks
    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://new-avatar.com' } })
    const mockStorageFrom = vi.fn().mockReturnValue({ upload: mockUpload, getPublicUrl: mockGetPublicUrl })

    // Auth mocks
    const mockUpdateUser = vi.fn().mockResolvedValue({ error: null })

    const mockSupabase = {
        from: mockFrom,
        storage: { from: mockStorageFrom },
        auth: { updateUser: mockUpdateUser }
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-expect-error - mock types are simplified
        createClient.mockReturnValue(mockSupabase)
    })

    test('renders with initial data', () => {
        render(<SettingsForm user={mockUser as any} profile={mockProfile as any} />)
        expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    test('updates username successfully', async () => {
        render(<SettingsForm user={mockUser as any} profile={mockProfile as any} />)

        const usernameInput = screen.getByPlaceholderText('Enter username')
        fireEvent.change(usernameInput, { target: { value: 'newusername' } })

        const saveButton = screen.getByText('Save Changes')
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('profiles')
            expect(mockUpdateChain).toHaveBeenCalledWith(expect.objectContaining({
                username: 'newusername'
            }))
            expect(mockEqFinal).toHaveBeenCalledWith('id', 'user-123')
            expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
        })
    })

    test('handles profile update error', async () => {
        // Mock error
        mockEqFinal.mockResolvedValueOnce({ error: { message: 'Update failed' } })

        render(<SettingsForm user={mockUser as any} profile={mockProfile as any} />)

        fireEvent.click(screen.getByText('Save Changes'))

        await waitFor(() => {
            expect(screen.getByText('Update failed')).toBeInTheDocument()
        })
    })

    test('validates password mismatch', async () => {
        render(<SettingsForm user={mockUser as any} profile={mockProfile as any} />)

        const passInput = screen.getByPlaceholderText('Enter new password')
        const confirmInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(passInput, { target: { value: 'password123' } })
        fireEvent.change(confirmInput, { target: { value: 'password456' } })

        fireEvent.click(screen.getByText('Update Password'))

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
        expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    test('updates password successfully', async () => {
        render(<SettingsForm user={mockUser as any} profile={mockProfile as any} />)

        const passInput = screen.getByPlaceholderText('Enter new password')
        const confirmInput = screen.getByPlaceholderText('Confirm new password')

        fireEvent.change(passInput, { target: { value: 'password123' } })
        fireEvent.change(confirmInput, { target: { value: 'password123' } })

        fireEvent.click(screen.getByText('Update Password'))

        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'password123' })
            expect(screen.getByText('Password updated successfully!')).toBeInTheDocument()
        })
    })
})
