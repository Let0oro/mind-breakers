'use client'

export function PartyHallSidebar() {
    return (
        <aside className="w-80 border-l border-border bg-main hidden xl:flex flex-col h-full sticky top-0 overflow-y-auto">
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="space-y-1">
                    <h2 className="text-3xl font-header text-text-main italic tracking-tight">Party Hall</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/80">Echo Squad 04</p>
                </div>

                <div className="h-px w-full bg-border opacity-50"></div>

                {/* Messages Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Scroll of Messages</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2 group cursor-pointer">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-gold uppercase tracking-wider">Elena R.</span>
                                <span className="text-[10px] text-muted">2m</span>
                            </div>
                            <p className="text-sm text-text-main/80 font-serif italic leading-relaxed group-hover:text-text-main transition-colors">
                                &quot;The frontend refactor is ready for testing. Meet in the Commons?&quot;
                            </p>
                        </div>

                        <div className="space-y-2 group cursor-pointer">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-text-main uppercase tracking-wider">Marcus V.</span>
                                <span className="text-[10px] text-muted">1h</span>
                            </div>
                            <p className="text-sm text-text-main/80 font-serif italic leading-relaxed group-hover:text-text-main transition-colors">
                                &quot;Found a great scroll library for the quest board. Check the resources.&quot;
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-border opacity-50"></div>

                {/* Shared Inventory Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Shared Inventory</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group cursor-pointer p-2 -mx-2 hover:bg-surface transition-colors rounded-sm">
                            <span className="material-symbols-outlined text-muted group-hover:text-text-main text-lg transition-colors">description</span>
                            <span className="text-xs font-serif italic text-text-main/80 group-hover:text-text-main transition-colors">Design_Guidelines.pdf</span>
                        </div>
                        <div className="flex items-center gap-4 group cursor-pointer p-2 -mx-2 hover:bg-surface transition-colors rounded-sm">
                            <span className="material-symbols-outlined text-muted group-hover:text-text-main text-lg transition-colors">link</span>
                            <span className="text-xs font-serif italic text-text-main/80 group-hover:text-text-main transition-colors">Figma_Workspace_v2</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-auto p-8 pt-0">
                <button className="w-full py-4 bg-gold text-midnight text-xs font-bold uppercase tracking-[0.25em] hover:bg-gold/90 transition-all shadow-lg hover:shadow-gold/20 active:scale-[0.98]">
                    Send Dispatch
                </button>
            </div>
        </aside>
    )
}
