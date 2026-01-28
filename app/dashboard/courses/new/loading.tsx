export default function NewCourseLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-[#1a232e] rounded"></div>
                    <div className="h-8 w-48 bg-[#1a232e] rounded-lg"></div>
                </div>
                <div className="h-4 w-64 bg-[#1a232e] rounded-lg"></div>
            </div>

            {/* Form Skeleton */}
            <div className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-8 max-w-3xl">
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-32 bg-[#3b4754] rounded"></div>
                            <div className="h-12 w-full bg-[#3b4754] rounded-lg"></div>
                        </div>
                    ))}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-12 w-full bg-[#3b4754] rounded-lg"></div>
                        <div className="h-12 w-full bg-[#3b4754] rounded-lg"></div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <div className="flex-1 h-12 bg-[#3b4754] rounded-lg"></div>
                        <div className="flex-1 h-12 bg-[#3b4754] rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
