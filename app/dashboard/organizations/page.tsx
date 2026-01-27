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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
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
                                                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                                </svg>
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
                                        <svg className="w-5 h-5 text-[#137fec]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                                        </svg>
                                        <span className="text-white text-sm font-medium">{pathCount}</span>
                                        <span className="text-[#9dabb9] text-xs">paths</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#137fec]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
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
                        <svg className="w-16 h-16 text-[#3b4754] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
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
