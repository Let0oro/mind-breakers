import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'


export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch organization details
    const { data: org, error } = await supabase
        .from('organizations')
        .select(`
      *,
      learning_paths (
        id,
        title,
        summary,
        courses (id)
      ),
      courses (
        id,
        title,
        summary,
        thumbnail_url,
        xp_reward
      )
    `)
        .eq('id', id)
        .single()

    if (error || !org) {
        notFound()
    }

    return (
        <>
            <header className="mb-8">
                <Link
                    href="/dashboard/organizations"
                    className="text-sm text-gray-600 dark:text-muted-foreground hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to Organizations
                </Link>

                <div className="flex items-start gap-6 mt-4">
                    <div className="w-20 h-20 rounded-xl bg-brand/20 flex items-center justify-center shrink-0">
                        <span className="text-4xl font-bold text-brand">
                            {org.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{org.name}</h1>
                        {org.website_url && (
                            <a
                                href={org.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand hover:underline flex items-center gap-1 font-medium"
                            >
                                Visit Website
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">

                    {/* About */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                        <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border p-6">
                            <p className="text-gray-600 dark:text-muted-foreground whitespace-pre-wrap">
                                {org.description || 'No description available.'}
                            </p>
                        </div>
                    </section>

                    {/* Learning Paths */}
                    {org.learning_paths && org.learning_paths.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Learning Paths</h2>
                            <div className="grid gap-4">
                                {org.learning_paths.map((path: { id: string, title: string, summary: string, courses: { id: string }[] }) => (
                                    <Link
                                        key={path.id}
                                        href={`/dashboard/paths/${path.id}`}
                                        className="flex items-center justify-between p-4 bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border hover:border-brand/50 transition-all group"
                                    >
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand transition-colors">{path.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1 line-clamp-1">{path.summary}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="material-symbols-outlined text-base">school</span>
                                            <span>{path.courses?.length || 0} courses</span>
                                            <span className="material-symbols-outlined text-base ml-2">chevron_right</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Courses */}
                    {org.courses && org.courses.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Individual Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {org.courses.map((course: { id: string, title: string, summary: string, thumbnail_url: string | null, xp_reward: number }) => (
                                    <Link
                                        key={course.id}
                                        href={`/dashboard/courses/${course.id}`}
                                        className="group flex flex-col bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border hover:border-brand/50 transition-all overflow-hidden"
                                    >
                                        <div className="h-32 bg-gray-100 dark:bg-[#283039] relative">
                                            {course.thumbnail_url ? (
                                                <img src={course.thumbnail_url} alt={course.title} className="object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                    <span className="material-symbols-outlined text-4xl">school</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded font-bold">
                                                {course.xp_reward} XP
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-brand transition-colors line-clamp-2 mb-2">{course.title}</h3>
                                            {course.summary && <p className="text-xs text-gray-600 dark:text-muted-foreground line-clamp-2 mt-auto">{course.summary}</p>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div>
                    <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border p-6 sticky top-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Organization Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-muted-foreground text-sm">Paths Created</span>
                                <span className="font-bold text-gray-900 dark:text-white">{org.learning_paths?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-muted-foreground text-sm">Courses Created</span>
                                <span className="font-bold text-gray-900 dark:text-white">{org.courses?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
