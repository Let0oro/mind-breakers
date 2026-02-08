export default function NewPathLoading() {
    return (
        <div className="animate-pulse max-w-3xl">
            {/* Header */}
            <div className="mb-10">
                <div className="h-4 w-24 bg-surface-dark mb-4" />
                <div className="h-10 w-48 bg-surface-dark mb-1" />
                <div className="h-4 w-72 bg-surface-dark" />
            </div>

            {/* Form */}
            <div className="border border-border bg-main p-6 space-y-6">
                {/* Thumbnail */}
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-surface-dark" />
                    <div className="h-32 w-full bg-surface-dark" />
                </div>

                {/* Fields */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-3 w-24 bg-surface-dark" />
                        <div className="h-10 w-full bg-surface-dark" />
                    </div>
                ))}

                {/* Description */}
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-surface-dark" />
                    <div className="h-32 w-full bg-surface-dark" />
                </div>

                {/* Submit */}
                <div className="pt-4 flex gap-3">
                    <div className="h-10 flex-1 bg-surface-dark" />
                    <div className="h-10 w-32 bg-surface-dark" />
                </div>
            </div>
        </div>
    )
}
