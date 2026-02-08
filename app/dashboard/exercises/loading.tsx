export default function ExercisesLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-10">
                <div className="h-10 w-40 bg-surface-dark mb-1" />
                <div className="h-4 w-48 bg-surface-dark" />
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border border-border bg-main p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="h-4 w-48 bg-surface-dark mb-2" />
                                <div className="h-3 w-full bg-surface-dark mb-1" />
                                <div className="h-3 w-2/3 bg-surface-dark" />
                            </div>
                            <div className="h-6 w-20 bg-surface-dark" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
