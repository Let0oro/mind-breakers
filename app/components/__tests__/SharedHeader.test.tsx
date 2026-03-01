import { expect, test, describe, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SharedHeader from '../shared-header'
import * as navigation from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock ThemeToggle Since it interacts with window/document
vi.mock('../ThemeToggle', () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">Toggle</div>
}))

describe('SharedHeader', () => {
    test('renders logo and title', () => {
        vi.spyOn(navigation, 'usePathname').mockReturnValue('/')
        render(<SharedHeader />)
        expect(screen.getByText('MindBreaker')).toBeInTheDocument()
        expect(screen.getByAltText('MindBreaker')).toBeInTheDocument()
    })

    test('shows navigation links on home page', () => {
        vi.spyOn(navigation, 'usePathname').mockReturnValue('/')
        render(<SharedHeader />)
        // Explore and Quests are now only in mobile menu or specific sections, not header desktop nav
        expect(screen.queryByText('Explore')).not.toBeInTheDocument()
        expect(screen.queryByText('Quests')).not.toBeInTheDocument()

        expect(screen.getByText('Login')).toBeInTheDocument()
        expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })

    test('hides navigation links on login page', () => {
        vi.spyOn(navigation, 'usePathname').mockReturnValue('/login')
        render(<SharedHeader />)
        expect(screen.queryByText('Explore')).not.toBeInTheDocument()
        expect(screen.queryByText('Quests')).not.toBeInTheDocument()
        // Should show "Create account" button instead of "Login" link
        expect(screen.getByText('Create account')).toBeInTheDocument()
        expect(screen.getByText('Back to Home')).toBeInTheDocument()
    })

    test('hides navigation links on register page', () => {
        vi.spyOn(navigation, 'usePathname').mockReturnValue('/register')
        render(<SharedHeader />)
        expect(screen.queryByText('Explore')).not.toBeInTheDocument()
        // Should show "Login" button instead of "Sign Up"
        expect(screen.getByText('Login')).toBeInTheDocument()
        expect(screen.getByText('Back to Home')).toBeInTheDocument()
    })

    test('toggles mobile menu', () => {
        vi.spyOn(navigation, 'usePathname').mockReturnValue('/')
        render(<SharedHeader />)

        const toggleButton = screen.getByLabelText('Toggle menu')

        // Initially closed
        expect(screen.queryByText('Explore')).not.toBeInTheDocument()

        // Click to open
        fireEvent.click(toggleButton)

        // Should appear now
        expect(screen.getByText('world-map')).toBeInTheDocument()
        expect(screen.getByText('archives')).toBeInTheDocument()

        // Click to close
        fireEvent.click(toggleButton)
        expect(screen.queryByText('Explore')).not.toBeInTheDocument()
    })
})
