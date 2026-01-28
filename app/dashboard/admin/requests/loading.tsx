export default function AdminRequestsLoading() {
    return (
        <div className="animate-pulse">
            <header className="mb-8">
                <div className="h-8 w-48 bg-white dark:bg-[#1a232e] rounded-lg mb-2"></div>
                <div className="h-4 w-64 bg-white dark:bg-[#1a232e] rounded-lg"></div>
            </header>

            {/* Requests List */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6">
                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#3b4754]"></div>
                                    <div className="space-y-2">
                                        <div className="h-5 w-32 bg-[#3b4754] rounded"></div>
                                        <div className="h-3 w-48 bg-[#3b4754] rounded"></div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-[#283039] border border-gray-200 dark:border-[#3b4754]">
                                    <div className="h-4 w-24 bg-[#3b4754] rounded mb-2"></div>
                                    <div className="h-3 w-full bg-[#3b4754] rounded"></div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="h-10 w-24 bg-[#3b4754] rounded-lg"></div>
                                <div className="h-10 w-24 bg-[#3b4754] rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
