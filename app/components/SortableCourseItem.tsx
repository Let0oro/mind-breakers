'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableCourseItemProps {
    id: string
    children: React.ReactNode
}

export function SortableCourseItem({ id, children }: SortableCourseItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1a232e] border border-gray-200 dark:border-sidebar-border rounded-lg mb-2">
                {/* Drag Handle */}
                <button
                    type="button"
                    className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    {...listeners}
                >
                    <span className="material-symbols-outlined">drag_indicator</span>
                </button>

                {/* Content */}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
