
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Toast } from '../Toast'

describe('Toast Component', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const defaultProps = {
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'info',
        onClose: vi.fn(),
    }

    it('renders with correct content', () => {
        render(<Toast {...defaultProps} />)
        expect(screen.getByText('Test Notification')).toBeInTheDocument()
        expect(screen.getByText('This is a test message')).toBeInTheDocument()
    })

    it('renders the correct icon for success type', () => {
        render(<Toast {...defaultProps} type="quest_approved" />)
        expect(screen.getByText('✅')).toBeInTheDocument()
    })

    it('renders the correct icon for error type', () => {
        render(<Toast {...defaultProps} type="quest_rejected" />)
        expect(screen.getByText('❌')).toBeInTheDocument()
    })

    it('renders the correct icon for level up type', () => {
        render(<Toast {...defaultProps} type="level_up" />)
        expect(screen.getByText('🎉')).toBeInTheDocument()
    })

    it('closes when close button is clicked', () => {
        render(<Toast {...defaultProps} />)

        const closeButton = screen.getByRole('button')
        fireEvent.click(closeButton)

        // Animation logic waits 300ms
        act(() => {
            vi.advanceTimersByTime(300)
        })

        expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('auto closes after duration', () => {
        render(<Toast {...defaultProps} duration={3000} />)

        // Wait for duration
        act(() => {
            vi.advanceTimersByTime(3000)
        })

        // Wait for animation out
        act(() => {
            vi.advanceTimersByTime(300)
        })

        expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('clears timer on unmount', () => {
        const { unmount } = render(<Toast {...defaultProps} duration={3000} />)
        unmount()

        act(() => {
            vi.advanceTimersByTime(3500)
        })

        expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
})
