export default function GuildHallLoading() {
    return (
        <div className="flex items-center justify-center h-[60dvh] overflow-hidden ">

            <div className="relative w-64 h-64 md:w-64 md:h-64 flex items-center justify-center">
                {/* Rotating Rings */}
                <div className="absolute inset-0 border border-gold rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-4 border border-gold rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-12 border border-gold rounded-full animate-[spin_8s_linear_infinite]" />

                {/* Geometric Stars/Hexagram */}
                <div className="absolute w-48 h-48 border border-gold rotate-0 flex items-center justify-center">
                    <div className="w-full h-full border border-gold rotate-60 absolute" />
                    <div className="w-full h-full border border-gold -rotate-60 absolute" />
                </div>

                {/* Central Icon */}
                <div className="relative w-16 h-16 animate-pulse">
                    <div className="text-gold text-4xl flex items-center justify-center h-full w-full">
                        ✦
                    </div>
                </div>

                {/* Floating Text Ring */}
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
        </div>
    )
}
