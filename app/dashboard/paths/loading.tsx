export default function PathsListLoading() {
    return (
        <div className="animate-pulse">
            {/* Header Section */}
            <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="h-8 w-48 bg-[#1a232e] rounded-lg"></div>
                    <div className="h-4 w-32 bg-[#1a232e] rounded-lg"></div>
                </div>
                <div className="h-11 w-40 bg-[#1a232e] rounded-lg"></div>
            </div>

            {/* Paths Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6 flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                                <div className="h-6 w-3/4 bg-[#3b4754] rounded"></div>
                                <div className="h-3 w-1/3 bg-[#3b4754] rounded"></div>
                            </div>
                            <div className="w-6 h-6 bg-[#3b4754] rounded"></div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-[#3b4754] rounded"></div>
                            <div className="h-3 w-5/6 bg-[#3b4754] rounded"></div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-20 bg-[#3b4754] rounded"></div>
                        </div>

                        {/* Progress Bar Placeholder */}
                        <div className="space-y-1 mt-auto">
                            <div className="flex justify-between">
                                <div className="h-3 w-12 bg-[#3b4754] rounded"></div>
                                <div className="h-3 w-8 bg-[#3b4754] rounded"></div>
                            </div>
                            <div className="h-2 w-full bg-[#3b4754] rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
