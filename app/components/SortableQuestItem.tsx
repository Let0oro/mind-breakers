'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableQuestItemProps {
    id: string
    children: React.ReactNode
}

export function SortableQuestItem({ id, children }: SortableQuestItemProps) {
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
            <div className="flex items-center gap-3 p-3 bg-main dark:bg-surface border border-border dark:border-border rounded-lg mb-2">
                {/* Drag Handle */}
                <button
                    type="button"
                    className="cursor-move text-muted hover:text-muted dark:hover:text-gray-300 p-1"
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
