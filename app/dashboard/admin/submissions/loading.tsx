export default function AdminSubmissionsLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="h-10 w-48 bg-surface-dark mb-1" />
                <div className="h-4 w-56 bg-surface-dark" />
            </div>

            {/* Submissions List */}
            <div className="border border-border bg-main">
                <div className="bg-surface-dark px-6 py-4 flex gap-6">
                    <div className="h-3 w-20 bg-surface" />
                    <div className="h-3 w-24 bg-surface" />
                    <div className="h-3 w-16 bg-surface" />
                    <div className="h-3 w-16 bg-surface" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-6 border-t border-border">
                        <div className="flex-1 h-4 bg-surface-dark" />
                        <div className="h-4 w-20 bg-surface-dark" />
                        <div className="h-6 w-16 bg-surface-dark" />
                        <div className="flex gap-2">
                            <div className="h-8 w-20 bg-surface-dark" />
                            <div className="h-8 w-20 bg-surface-dark" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
