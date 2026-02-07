'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

import { useRouter } from 'next/navigation'

interface SettingsFormProps {
    user: User
    profile: Profile
}

export function SettingsForm({ user, profile }: SettingsFormProps) {
    const supabase = createClient()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [username, setUsername] = useState(profile?.username || '')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [bio, setBio] = useState(profile?.bio || '')
    const [socialLinks, setSocialLinks] = useState(profile?.social_links || {
        twitter: '',
        linkedin: '',
        github: '',
        website: ''
    })

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const updates: Partial<Profile> = {
                username,
                bio,
                social_links: socialLinks,
                // @ts-expect-error - updated_at technically not in Profile type but in DB
                updated_at: new Date().toISOString(),
            }

            // Handle Avatar Upload
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath)

                updates.avatar_url = publicUrl
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)

            if (error) throw error

            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            router.refresh()
        } catch (error: unknown) {
            let errorMessage = 'An unexpected error occurred'
            if (error instanceof Error) {
                errorMessage = error.message
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = String((error as { message: unknown }).message)
            }
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setIsLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' })
            setIsLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setMessage({ type: 'success', text: 'Password updated successfully!' })
            setPassword('')
            setConfirmPassword('')
        } catch (error: unknown) {
            if (error instanceof Error) {
                setMessage({ type: 'error', text: error.message })
            } else {
                setMessage({ type: 'error', text: 'An unexpected error occurred' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {message && (
                <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Information Form */}
            <section className="bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-6">
                <h3 className="text-text-main dark:text-text-main text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand">person</span>
                    Profile Information
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-muted dark:text-muted text-sm font-medium mb-2">
                            Profile Image
                        </label>
                        <div className="flex items-center gap-4">
                            {profile?.avatar_url && (
                                <img
                                    src={profile.avatar_url}
                                    alt="Current Avatar"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full object-cover border border-border dark:border-border"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-muted dark:text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-text-main dark:text-text-main hover:file:bg-brand/90 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-muted dark:text-muted text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-muted dark:text-muted cursor-not-allowed opacity-70"
                        />
                        <p className="text-xs text-muted dark:text-muted mt-1">
                            To change your email, please contact support or use the auth provider settings.
                        </p>
                    </div>

                    <div>
                        <label className="block text-muted dark:text-muted text-sm font-medium mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="block text-muted dark:text-muted text-sm font-medium mb-2">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full h-32 px-4 py-3 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-muted dark:text-muted text-sm font-medium">
                            Social Links
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={socialLinks?.twitter || ''}
                                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                                placeholder="Twitter URL"
                            />
                            <input
                                type="text"
                                value={socialLinks?.linkedin || ''}
                                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                                placeholder="LinkedIn URL"
                            />
                            <input
                                type="text"
                                value={socialLinks?.github || ''}
                                onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                                className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                                placeholder="GitHub URL"
                            />
                            <input
                                type="text"
                                value={socialLinks?.website || ''}
                                onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                                placeholder="Personal Website URL"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-10 px-6 rounded-lg bg-brand text-text-main dark:text-text-main font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </section>

            {/* Change Password Form */}
            {user?.app_metadata?.provider === 'email' ? (
                <section className="bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-6">
                    <h3 className="text-text-main dark:text-text-main text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand">lock</span>
                        Change Password
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-muted dark:text-muted text-sm font-medium mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                                placeholder="Enter new password"
                            />
                        </div>

                        <div>
                            <label className="block text-muted dark:text-muted text-sm font-medium mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg bg-surface dark:bg-main border border-border dark:border-border text-text-main dark:text-text-main focus:outline-none focus:border-brand transition-colors"
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="h-10 px-6 rounded-lg bg-brand text-text-main dark:text-text-main font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section className="bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-6">
                    <h3 className="text-text-main dark:text-text-main text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand">lock</span>
                        Security
                    </h3>
                    <p className="text-muted dark:text-muted">
                        You are logged in via <span className="text-text-main dark:text-text-main font-semibold capitalize">{user?.app_metadata?.provider}</span>.
                        Please manage your password and security settings directly through their platform.
                    </p>
                </section>
            )}
        </div>
    )
}
