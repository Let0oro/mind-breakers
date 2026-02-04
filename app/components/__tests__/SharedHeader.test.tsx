import { expect, test, describe, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SharedHeader from '../shared-header'
import * as navigation from 'next/navigation'

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
        expect(screen.getByText('Explore')).toBeInTheDocument()
        expect(screen.getByText('Quests')).toBeInTheDocument()
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

        // Initially closed (desktop view logic aside, simple rendering check)
        // Note: The menu is conditional on `mobileMenuOpen` state.
        expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument() // Assuming nav inside mobile menu isn't standard nav or just checking presence

        // Click to open
        fireEvent.click(toggleButton)
        // Helper to find the mobile menu content. The component renders a <nav> inside the mobile div.
        // We need to be specific because desktop also has a nav.
        // The mobile menu container has class 'absolute top-full...'

        // Let's just check for a link that appears inside the mobile menu
        // Explore is in both, but let's check visibility if possible or just existence in DOM if hidden/shown logic is CSS based (it's JS based here: {mobileMenuOpen && ...})
        const mobileLinks = screen.getAllByText('Explore')
        // Should be 2 now (one desktop, one mobile)
        expect(mobileLinks).toHaveLength(2)

        // Click to close
        fireEvent.click(toggleButton)
        expect(screen.getAllByText('Explore')).toHaveLength(1)
    })
})
