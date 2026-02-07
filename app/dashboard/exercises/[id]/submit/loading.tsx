export default function SubmitExerciseLoading() {
    return (
        <div className="min-h-screen bg-surface py-8 animate-pulse">
            <div className="mx-auto max-w-2xl px-4">
                <div className="rounded-lg bg-main p-6 shadow">
                    {/* Header */}
                    <div className="h-8 w-64 bg-main-dark rounded mb-2"></div>
                    <div className="h-4 w-48 bg-main-dark rounded mb-6"></div>

                    {/* Description Block */}
                    <div className="mb-6 rounded-lg bg-blue-50 p-4 border border-blue-100">
                        <div className="h-4 w-32 bg-blue-200/50 rounded mb-2"></div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-blue-200/50 rounded"></div>
                            <div className="h-3 w-full bg-blue-200/50 rounded"></div>
                            <div className="h-3 w-3/4 bg-blue-200/50 rounded"></div>
                        </div>
                    </div>

                    {/* Requirements Block */}
                    <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-100">
                        <div className="h-4 w-24 bg-amber-200/50 rounded mb-2"></div>
                        <div className="h-3 w-full bg-amber-200/50 rounded"></div>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        <div>
                            <div className="h-4 w-32 bg-main-dark rounded mb-3"></div>
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 rounded-lg bg-surface border-2 border-border"></div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="h-4 w-40 bg-main-dark rounded mb-2"></div>
                            <div className="h-64 w-full rounded-lg bg-surface border border-border"></div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <div className="flex-1 h-10 bg-main-dark rounded-lg"></div>
                            <div className="flex-1 h-10 bg-main-dark rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
