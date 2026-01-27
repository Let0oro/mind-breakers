'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SharedHeader() {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register')

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md px-6 lg:px-20 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 text-primary hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-3xl">sports_esports</span>
                        <h2 className="text-foreground text-2xl font-bold tracking-tight">MindBreaker</h2>
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
                                href="/#leaderboard"
                            >
                                Leaderboard
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

                <div className="flex items-center gap-4">
                    {isAuthPage ? (
                        <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Back to Home
                        </Link>
                        {pathname?.startsWith('/login') ? (
                            <Link href="/register" className="flex min-w-21 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors">
                                <span className="truncate">Create account</span>
                            </Link>
                        ) : (
                            <Link href="/login" className="flex min-w-21 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors">
                                <span className="truncate">Login</span>
                            </Link>
                        )}
                    </div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm transition-all"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
