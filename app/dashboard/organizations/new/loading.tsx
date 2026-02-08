export default function NewOrganizationLoading() {
    return (
        <div className="animate-pulse max-w-3xl">
            {/* Header */}
            <div className="mb-10">
                <div className="h-4 w-32 bg-surface-dark mb-4" />
                <div className="h-10 w-64 bg-surface-dark mb-1" />
                <div className="h-4 w-80 bg-surface-dark" />
            </div>

            {/* Form */}
            <div className="border border-border bg-main p-6 space-y-6">
                {/* Fields */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-3 w-24 bg-surface-dark" />
                        <div className="h-10 w-full bg-surface-dark" />
                    </div>
                ))}

                {/* Submit */}
                <div className="pt-4">
                    <div className="h-10 w-full bg-surface-dark" />
                </div>
            </div>
        </div>
    )
}
