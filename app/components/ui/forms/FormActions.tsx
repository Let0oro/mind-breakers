'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/base/Button'

interface FormActionsProps {
    onCancel?: () => void
    onSave?: () => void
    onPublish?: () => void
    onDelete?: () => void
    saving?: boolean
    publishing?: boolean
    saveLabel?: string
    publishLabel?: string
    deleteLabel?: string
    canSave?: boolean
    canPublish?: boolean
    showDelete?: boolean
    publishDisabledReason?: string
}

export function FormActions({
    onCancel,
    onSave,
    onPublish,
    onDelete,
    saving,
    publishing,
    saveLabel = 'Save Draft',
    publishLabel = 'Publish',
    deleteLabel = 'Delete',
    canSave = true,
    canPublish = true,
    showDelete = false,
    publishDisabledReason
}: FormActionsProps) {
    const router = useRouter()

    return (
        <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-border">
            <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => router.back())}
            >
                Cancel
            </Button>

            {showDelete && onDelete && (
                <Button
                    type="button"
                    variant="danger"
                    onClick={onDelete}
                    disabled={saving || publishing}
                >
                    {deleteLabel}
                </Button>
            )}

            <div className="flex-1 flex justify-end gap-3">
                {onSave && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onSave}
                        isLoading={saving}
                        disabled={!canSave}
                    >
                        {saveLabel}
                    </Button>
                )}

                {onPublish && (
                    <div className="relative group">
                        <Button
                            type="button"
                            variant="inverse"
                            onClick={onPublish}
                            isLoading={publishing}
                            disabled={!canPublish}
                        >
                            {publishLabel}
                        </Button>

                        {!canPublish && publishDisabledReason && (
                            <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                <div className="bg-surface border border-border p-3 text-left shadow-lg">
                                    <p className="text-xs font-bold uppercase tracking-widest text-text-main mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-amber-500">info</span>
                                        To publish, complete:
                                    </p>
                                    <p className="text-xs text-muted leading-relaxed">{publishDisabledReason}</p>
                                </div>
                                <div className="ml-auto mr-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
