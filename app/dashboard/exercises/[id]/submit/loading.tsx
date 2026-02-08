export default function ExerciseSubmitLoading() {
    return (
        <div className="animate-pulse max-w-3xl">
            {/* Header */}
            <div className="mb-10">
                <div className="h-4 w-24 bg-surface-dark mb-4" />
                <div className="h-10 w-64 bg-surface-dark mb-1" />
                <div className="h-4 w-80 bg-surface-dark" />
            </div>

            {/* Exercise Info */}
            <div className="border border-border bg-main p-6 mb-6">
                <div className="h-4 w-24 bg-surface-dark mb-4" />
                <div className="h-5 w-48 bg-surface-dark mb-2" />
                <div className="space-y-2">
                    <div className="h-3 w-full bg-surface-dark" />
                    <div className="h-3 w-5/6 bg-surface-dark" />
                </div>
            </div>

            {/* Form */}
            <div className="border border-border bg-main p-6 space-y-6">
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-surface-dark" />
                    <div className="h-10 w-full bg-surface-dark" />
                </div>
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-surface-dark" />
                    <div className="h-32 w-full bg-surface-dark" />
                </div>
                <div className="pt-4">
                    <div className="h-10 w-full bg-surface-dark" />
                </div>
            </div>
        </div>
    )
}
