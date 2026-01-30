import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
}))

// Mock Next.js headers (cookies)
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        getAll: vi.fn(),
        set: vi.fn(),
    }),
}))

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: () => ({
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                    })),
                })),
            })),
            upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.png' } })),
        })),
    }),
}))

vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        },
    })
}))

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString()
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key]
        }),
        clear: vi.fn(() => {
            store = {}
        }),
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
})

// Cleanup
afterEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
})
