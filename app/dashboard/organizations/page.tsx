import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const metadata = {
    title: 'Organizations - MindBreaker',
    description: 'Browse course providers and organizations',
}

export default async function OrganizationsPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch organizations with course/path counts
    const { data: organizations } = await supabase
        .from('organizations')
        .select(`
      id,
      name,
      description,
      website_url,
      learning_paths (id),
      courses (id)
    `)
        .order('name')

    return (
        <>
            {/* Header Section */}
            <header className="flex flex-wrap justify-between items-end gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white text-3xl font-black tracking-tight">Organizations</h2>
                    <p className="text-[#9dabb9] text-base">
                        {organizations?.length || 0} organizations creating content
                    </p>
                </div>
                <Link
                    href="/dashboard/organizations/new"
                    className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-white font-bold transition-all hover:bg-[#137fec]/80"
                >
                    <span className="material-symbols-outlined w-5 h-5">add_circle</span>
                    <span>Add Organization</span>
                </Link>
            </header>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations && organizations.length > 0 ? (
                    organizations.map((org) => {
                        const pathCount = org.learning_paths?.length || 0
                        const courseCount = org.courses?.length || 0

                        return (
                            <div
                                key={org.id}
                                className="bg-[#1a232e] rounded-xl border border-[#3b4754] hover:border-[#137fec]/50 transition-all p-6 flex flex-col gap-4"
                            >
                                {/* Avatar */}
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-[#137fec]/20 flex items-center justify-center shrink-0">
                                        <span className="text-2xl font-bold text-[#137fec]">
                                            {org.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-lg truncate">{org.name}</h3>
                                        {org.website_url && (
                                            <a
                                                href={org.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#137fec] text-sm hover:underline flex items-center gap-1"
                                            >
                                                <span className="truncate">{new URL(org.website_url).hostname}</span>
                                                <span className="material-symbols-outlined w-3 h-3 shrink-0">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {org.description && (
                                    <p className="text-[#9dabb9] text-sm line-clamp-3">
                                        {org.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex gap-4 pt-4 border-t border-[#3b4754]">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined w-5 h-5 text-[#137fec]">route</span>
                                        <span className="text-white text-sm font-medium">{pathCount}</span>
                                        <span className="text-[#9dabb9] text-xs">paths</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined w-5 h-5 text-[#137fec]">school</span>
                                        <span className="text-white text-sm font-medium">{courseCount}</span>
                                        <span className="text-[#9dabb9] text-xs">courses</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <Link
                                    href={`/dashboard/paths?org=${org.id}`}
                                    className="mt-2 w-full text-center bg-[#283039] hover:bg-[#3b4754] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    View Paths
                                </Link>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full bg-[#1a232e] rounded-xl border border-[#3b4754] p-12 text-center">
                        <span className="material-symbols-outlined w-16 h-16 text-[#3b4754] mx-auto mb-4">business</span>
                        <p className="text-[#9dabb9] text-lg mb-2">No organizations yet</p>
                        <p className="text-[#9dabb9] text-sm mb-4">Create an organization to start publishing content</p>
                        <Link
                            href="/dashboard/organizations/new"
                            className="inline-block bg-[#137fec] hover:bg-[#137fec]/80 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Add Organization
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
