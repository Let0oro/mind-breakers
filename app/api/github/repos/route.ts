import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface GitHubRepo {
    id: number
    name: string
    full_name: string
    html_url: string
    description: string | null
    private: boolean
    updated_at: string
    language: string | null
    stargazers_count: number
}

interface SimplifiedRepo {
    id: number
    name: string
    fullName: string
    url: string
    description: string | null
    language: string | null
    stars: number
    updatedAt: string
}

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Not authenticated', needsAuth: true },
                { status: 401 }
            )
        }

        // Check if user logged in with GitHub
        const providerToken = session.provider_token
        const provider = session.user?.app_metadata?.provider

        if (provider !== 'github' || !providerToken) {
            return NextResponse.json(
                {
                    error: 'GitHub account not linked',
                    needsGitHub: true,
                    message: 'Please link your GitHub account to use this feature'
                },
                { status: 403 }
            )
        }

        // Fetch repositories from GitHub API
        const response = await fetch(
            'https://api.github.com/user/repos?visibility=public&sort=updated&per_page=50',
            {
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'MindBreaker-App'
                }
            }
        )

        if (!response.ok) {
            // Token might be expired
            if (response.status === 401) {
                return NextResponse.json(
                    {
                        error: 'GitHub token expired',
                        needsReauth: true,
                        message: 'Please log out and log in again with GitHub'
                    },
                    { status: 401 }
                )
            }

            const errorText = await response.text()
            console.error('GitHub API error:', errorText)
            return NextResponse.json(
                { error: 'Failed to fetch repositories from GitHub' },
                { status: response.status }
            )
        }

        const repos: GitHubRepo[] = await response.json()

        // Filter only public repos and simplify the response
        const publicRepos: SimplifiedRepo[] = repos
            .filter(repo => !repo.private)
            .map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                updatedAt: repo.updated_at
            }))

        return NextResponse.json({
            repos: publicRepos,
            count: publicRepos.length
        })

    } catch (error) {
        console.error('Error fetching GitHub repos:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
