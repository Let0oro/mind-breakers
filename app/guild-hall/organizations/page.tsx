import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { getOrganizationsCached } from '@/lib/cache'

export const metadata = {
    title: 'Organizations - MindBreaker',
    description: 'Browse course providers and organizations',
}

export default async function OrganizationsPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Use cached query for validated organizations
    const validatedOrgs = await getOrganizationsCached(supabase)

    // Also fetch user's own unvalidated organizations
    const { data: userOrgs } = await supabase
        .from('organizations')
        .select(`
            id,
            name,
            description,
            website_url,
            is_validated,
            created_by,
            learning_paths (id),
            courses (id)
        `)
        .eq('created_by', user.id)
        .eq('is_validated', false)

    // Combine validated orgs with user's unvalidated ones
    const organizations = [
        ...validatedOrgs,
        ...(userOrgs || [])
    ]

    return (
        <>
            {/* Header Section */}
            <header className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-text-main text-4xl font-black italic uppercase tracking-tight">
                            Organizations
                        </h1>
                        <p className="text-muted text-sm">
                            {organizations?.length || 0} organizations creating content
                        </p>
                    </div>
                    <Link
                        href="/guild-hall/organizations/new"
                        className="flex items-center gap-2 px-4 py-2 border border-text-main bg-inverse text-main-alt text-xs font-bold uppercase tracking-widest hover:bg-text-main transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span>Add Organization</span>
                    </Link>
                </div>
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
                                className="border border-border bg-main p-6 hover:border-text-main transition-all flex flex-col gap-4"
                            >
                                {/* Avatar */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 border border-border flex items-center justify-center shrink-0">
                                        <span className="text-xl font-bold text-text-main">
                                            {org.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-text-main font-bold text-lg truncate">{org.name}</h3>
                                            {!org.is_validated && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-500">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        {org.website_url && (
                                            <a
                                                href={org.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted text-sm hover:text-text-main hover:underline flex items-center gap-1"
                                            >
                                                <span className="truncate">{new URL(org.website_url).hostname}</span>
                                                <span className="material-symbols-outlined text-xs shrink-0">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {org.description && (
                                    <p className="text-muted text-sm line-clamp-3">
                                        {org.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex gap-6 pt-4 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined w-4 h-4 text-muted">route</span>
                                        <span className="text-text-main text-sm font-bold">{pathCount}</span>
                                        <span className="text-muted text-xs">paths</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined w-4 h-4 text-muted">school</span>
                                        <span className="text-text-main text-sm font-bold">{courseCount}</span>
                                        <span className="text-muted text-xs">courses</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <Link
                                    href={`/guild-hall/paths?org=${org.id}`}
                                    className="mt-auto w-full text-center border border-border hover:border-text-main hover:bg-surface text-text-main px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    View Paths
                                </Link>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full border border-border bg-main p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-muted mb-4 block">corporate_fare</span>
                        <p className="text-muted text-sm mb-1">No organizations yet</p>
                        <p className="text-muted text-xs mb-6">Create an organization to start publishing content</p>
                        <Link
                            href="/guild-hall/organizations/new"
                            className="inline-block px-4 py-2 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
                        >
                            Add Organization
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}