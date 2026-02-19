'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import Image from 'next/image'

export default function SharedHeader() {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 border-b  backdrop-blur-md px-4 sm:px-6 lg:px-20 py-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-8">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 text-foreground hover:opacity-80 transition-opacity">
                        <Image src="/icon.png" alt="MindBreaker" width={38} height={38} />
                        <h2 className="text-foreground text-xl sm:text-2xl font-bold tracking-tight">MindBreaker</h2>
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />

                    {isAuthPage ? (
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link
                                href="/"
                                className="hidden sm:block text-sm font-medium text-muted hover:text-text-main transition-colors"
                            >
                                Back to Home
                            </Link>
                            {pathname?.startsWith('/login') ? (
                                <Link href="/register" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 sm:h-10 px-3 sm:px-4 bg-brand text-text-main text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] hover:bg-brand/90 transition-colors">
                                    <span className="truncate">Create account</span>
                                </Link>
                            ) : (
                                <Link href="/login" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 sm:h-10 px-3 sm:px-4 bg-brand text-text-main text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] hover:bg-brand/90 transition-colors">
                                    <span className="truncate">Login</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop buttons */}
                            <Link
                                href="/login"
                                className="hidden sm:block text-sm font-medium text-muted hover:text-text-main transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="hidden sm:flex bg-inverse hover:bg-inverse/90 text-main px-4 sm:px-6 py-2 rounded-xs font-bold text-sm transition-all"
                            >
                                Sign Up
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 text-muted hover:text-text-main transition-colors"
                                aria-label="Toggle menu"
                            >
                                <span className="material-symbols-outlined">
                                    {mobileMenuOpen ? 'close' : 'menu'}
                                </span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile menu dropdown */}
            {mobileMenuOpen && !isAuthPage && (
                <div className="md:hidden absolute top-full left-0 border-background bg-background dark:border-midnight dark:bg-midnight right-0 border-b shadow-lg">
                    <nav className="flex flex-col p-4 gap-2 items-stretch bg-background dark:bg-midnight text-center">
                        <Link
                            className="text-muted hover:text-text-main text-sm font-medium transition-colors py-2"
                            href="/guild-hall/world-map"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            World Map
                        </Link>
                        <Link
                            className="text-muted hover:text-text-main text-sm font-medium transition-colors py-2"
                            href="/guild-hall/quests"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Quests
                        </Link>
                        <div className="border-t border-main mt-2 pt-4 flex flex-col items-stretch text-center gap-2">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-muted hover:text-text-main transition-colors py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="bg-inverse hover:bg-inverse/90 text-text-mainse px-4 py-2 rounded-xl font-bold text-sm transition-all text-center"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}
