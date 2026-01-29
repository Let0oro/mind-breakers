'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export default function SharedHeader() {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 lg:px-20 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-8">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 text-primary hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-2xl sm:text-3xl">sports_esports</span>
                        <h2 className="text-foreground text-xl sm:text-2xl font-bold tracking-tight">MindBreaker</h2>
                    </Link>

                    {!isAuthPage && (
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                                href="/#explore"
                            >
                                Explore
                            </Link>
                            <Link
                                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                                href="/#quests"
                            >
                                Quests
                            </Link>
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />

                    {isAuthPage ? (
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link
                                href="/"
                                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Back to Home
                            </Link>
                            {pathname?.startsWith('/login') ? (
                                <Link href="/register" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 sm:h-10 px-3 sm:px-4 bg-[#137fec] text-white text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors">
                                    <span className="truncate">Create account</span>
                                </Link>
                            ) : (
                                <Link href="/login" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 sm:h-10 px-3 sm:px-4 bg-[#137fec] text-white text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors">
                                    <span className="truncate">Login</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop buttons */}
                            <Link
                                href="/login"
                                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 py-2 rounded-xl font-bold text-sm transition-all"
                            >
                                Sign Up
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg">
                    <nav className="flex flex-col p-4 gap-2">
                        <Link
                            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors py-2"
                            href="/#explore"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Explore
                        </Link>
                        <Link
                            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors py-2"
                            href="/#leaderboard"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Leaderboard
                        </Link>
                        <Link
                            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors py-2"
                            href="/#quests"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Quests
                        </Link>
                        <div className="border-t border-border mt-2 pt-4 flex flex-col gap-2">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm transition-all text-center"
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
