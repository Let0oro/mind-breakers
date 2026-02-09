'use client'

import Image from 'next/image'

export default function DashboardLoading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-gold-500">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.05)_0%,transparent_70%)]" />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Protocol Header */}
                {/* <div className="text-center space-y-2 mb-8">
                    <p className="text-xs font-medium tracking-[0.2em] text-gold-500/60 uppercase">System Protocol</p>
                    <h1 className="text-4xl md:text-5xl font-header italic text-white tracking-wide">
                        MISSION LOADING ARRAY v1.0.4
                    </h1>
                </div> */}

                {/* Central Animation Container */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                    {/* Rotating Rings (Simulated with borders) */}
                    <div className="absolute inset-0 border border-gold rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-4 border border-gold rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-12 border border-gold rounded-full animate-[spin_8s_linear_infinite]" />

                    {/* Geometric Stars/Hexagram - Using CSS transform for rotation */}
                    <div className="absolute w-48 h-48 border border-gold rotate-0 flex items-center justify-center">
                        <div className="w-full h-full border border-gold rotate-60 absolute" />
                        <div className="w-full h-full border border-gold -rotate-60 absolute" />
                    </div>

                    {/* Central Image/Icon */}
                    <div className="relative w-16 h-16 animate-pulse">
                        {/* Placeholder for the central icon if it was a separate asset, otherwise using stars */}
                        <div className="text-gold text-4xl flex items-center justify-center h-full w-full">
                            ✦
                        </div>
                    </div>

                    {/* Floating Text Ring - Simplified representation */}
                    <div className="absolute w-full h-full animate-[spin_20s_linear_infinite] scale-120">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <path id="curve" d="M 50 50 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" fill="transparent" />
                            <text className="text-[5px] uppercase tracking-[0.3em] fill-gold/60 font-medium">
                                <textPath href="#curve" startOffset="0%">
                                    • Fetching new missions • Connecting to the Guild • Buying equipment •
                                </textPath>
                            </text>
                        </svg>
                    </div>
                </div>

                {/* Loading Bar & Status */}
                {/* <div className="w-full max-w-md space-y-2 mt-8">
                    <div className="flex justify-between items-end text-gold-500 font-header">
                        <span className="text-sm font-bold tracking-widest uppercase">Synchronizing Archive</span>
                        <span className="text-2xl font-bold italic">65%</span>
                    </div>

                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div className="h-full bg-gold-600 w-[65%] shadow-[0_0_10px_rgba(197,160,89,0.5)]" />
                    </div>
                    <p className="text-xs text-zinc-500 italic">Analyzing Quest Parameters...</p>
                </div> */}

                {/* Footer Tip */}
                {/* <div className="mt-12 text-center border-t border-zinc-800 pt-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded text-xs font-bold text-gold-400 tracking-widest uppercase mb-3 border border-zinc-800">
                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                        Guild Wisdom
                    </div>
                    <p className="text-sm text-zinc-400 font-header italic">
                        "Remember to save your code snippets in the Guild Archive for extra synergy XP."
                    </p>
                </div> */}
            </div>

            {/* Side Vertical Text */}
            {/* <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block">
                <div className="writing-vertical-rl text-[10px] tracking-[0.5em] text-zinc-600 font-mono uppercase">
                    Region — The Elder Woods
                </div>
            </div> */}

            {/* Background Texture/Noise Overlay could go here */}
        </div>
    )
}
