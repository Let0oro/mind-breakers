'use client'

import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface CardQuestBaseProps {
    id: string
    title: string
    xp_reward?: number
    href?: string
    className?: string
    index?: number
    organizationName?: string
    progress?: number
    status?: string
}

interface CardQuestBoardProps extends CardQuestBaseProps {
    exercisesCount?: number
}

export function CardQuestBoard({
    id,
    title,
    xp_reward = 0,
    href = `/guild-hall/quests/${id}`,
    className,
    index,
    organizationName,
    progress,
    status = 'published',
    exercisesCount,
}: CardQuestBoardProps) {
    const isCompleted = progress === 100
    const isActive = progress !== undefined && progress > 0 && progress < 100
    const rotation = index !== undefined ? (index % 2 === 0 ? 'rotate-1' : '-rotate-1') : 'rotate-0'

    return (
        <Link
            href={href}
            className={cn(
                'group relative md:min-w-48 min-w-32 h-min flex flex-col p-6 bg-background/10 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:rotate-0 hover:z-[1] isolate cursor-pointer',
                rotation,
                className
            )}
        >
            {/* Pin Visual */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-main -rotate-45 z-[2] border border-gold/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-gold"></div>
            </div>

            {/* Decorative Scotch Tape */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-black/5 blur-sm rounded-full -z-10"></div>

            {/* Status Stamps */}
            {isCompleted && (
                <div className="absolute -right-2 -bottom-2 border-2 border-forest text-forest px-2 py-1 rotate-[-15deg] opacity-80 font-black uppercase text-xs tracking-widest bg-background/80 backdrop-blur-sm z-10">
                    Completed
                </div>
            )}

            {isActive && (
                <div className="absolute -right-2 -top-2 border-2 border-gold text-gold px-2 py-1 rotate-[10deg] opacity-90 font-black uppercase text-xs tracking-widest bg-background/80 backdrop-blur-sm z-10">
                    Active
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col items-center text-center">
                <h3 className="line-clamp-5 font-header text-lg text-foreground italic leading-tight group-hover:text-gold transition-colors ">
                    {title}
                </h3>

                <div className='flex items-center gap-2 mt-4 pt-4 border-t border-border/30'>
                    <span className='text-sm text-muted'>{organizationName}</span>
                </div>
            </div>

            {/* Footer specs */}
            <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center w-full text-[10px] uppercase tracking-widest text-muted font-bold">
                <span>{xp_reward} XP</span>
                {exercisesCount !== undefined && (
                    <span>{exercisesCount} Missions</span>
                )}
            </div>
        </Link>
    )
}
