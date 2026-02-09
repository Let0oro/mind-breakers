'use client'

import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { levelUpEvent } from '@/lib/events'

export function LevelUpModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [level, setLevel] = useState(1)

    useEffect(() => {
        const unsubscribe = levelUpEvent.subscribe((newLevel) => {
            setLevel(newLevel)
            setIsOpen(true)

            // Trigger confetti
            const duration = 3000
            const end = Date.now() + duration

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#137fec', '#34d399', '#fbbf24']
                })
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#137fec', '#34d399', '#fbbf24']
                })

                if (Date.now() < end) {
                    requestAnimationFrame(frame)
                }
            }
            frame()
        })

        return () => {
            unsubscribe()
        }
    }, [])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-main dark:bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-border dark:border-border animate-in zoom-in-95 duration-300">

                {/* Glow effect behind the badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand/20 rounded-full blur-3xl -z-10"></div>

                <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-ring to-[#3b82f6] shadow-lg shadow-blue-500/30 text-text-main">
                    <span className="material-symbols-outlined text-6xl">military_tech</span>
                </div>

                <h2 className="text-3xl font-black text-text-main dark:text-text-main mb-2 tracking-tight">
                    LEVEL UP!
                </h2>

                <p className="text-muted dark:text-muted text-lg mb-8">
                    You&apos;ve reached <strong className="text-brand">Level {level}</strong>. Keep up the amazing work!
                </p>

                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 px-6 rounded-xl bg-brand text-text-main font-bold text-base hover:bg-brand/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                >
                    Continue Learning
                </button>
            </div>
        </div>
    )
}
