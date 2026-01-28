export default function OrganizationsLoading() {
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

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6 flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-lg bg-[#3b4754] shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-3/4 bg-[#3b4754] rounded"></div>
                                <div className="h-3 w-1/2 bg-[#3b4754] rounded"></div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-[#3b4754] rounded"></div>
                            <div className="h-3 w-full bg-[#3b4754] rounded"></div>
                            <div className="h-3 w-2/3 bg-[#3b4754] rounded"></div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 pt-4 border-t border-[#3b4754]">
                            <div className="h-4 w-16 bg-[#3b4754] rounded"></div>
                            <div className="h-4 w-16 bg-[#3b4754] rounded"></div>
                        </div>

                        {/* Action */}
                        <div className="mt-2 h-9 w-full bg-[#3b4754] rounded-lg"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}
