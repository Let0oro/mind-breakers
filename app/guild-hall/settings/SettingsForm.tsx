'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { FormField, FormSection, FormDivider } from '@/components/ui/Form'

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

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const fileExpedition = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileExpedition, avatarFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileExpedition)

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
        <div className="space-y-6">
            {message && (
                <div className={`p-4 border ${message.type === 'success' ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
                    <p className="text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                            {message.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        {message.text}
                    </p>
                </div>
            )}

            {/* Profile Information Form */}
            <section className="border border-border bg-main p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">person</span>
                    Profile Information
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Avatar */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-main">
                            Profile Image
                        </label>
                        <div className="flex items-center gap-4">
                            {profile?.avatar_url && (
                                <div className="w-16 h-16 border border-border overflow-hidden grayscale hover:grayscale-0 transition-all">
                                    <img
                                        src={profile.avatar_url}
                                        alt="Current Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                className="file:cursor-pointer block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:border file:border-border file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-main file:text-text-main cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Email (disabled) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-main">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full h-12 px-4 bg-main border border-border text-muted cursor-not-allowed"
                        />
                        <p className="text-muted text-xs">
                            To change your email, please contact support.
                        </p>
                    </div>

                    <FormField
                        label="Username"
                        name="username"
                        value={username}
                        onChange={setUsername}
                        placeholder="Enter username"
                    />

                    <FormField
                        label="Bio"
                        name="bio"
                        type="textarea"
                        value={bio}
                        onChange={setBio}
                        placeholder="Tell us about yourself..."
                        rows={4}
                    />

                    <FormDivider />

                    <FormSection title="Social Links">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                label="Twitter"
                                name="twitter"
                                type="url"
                                value={socialLinks?.twitter || ''}
                                onChange={(v) => setSocialLinks({ ...socialLinks, twitter: v })}
                                placeholder="https://twitter.com/..."
                                icon="link"
                            />
                            <FormField
                                label="LinkedIn"
                                name="linkedin"
                                type="url"
                                value={socialLinks?.linkedin || ''}
                                onChange={(v) => setSocialLinks({ ...socialLinks, linkedin: v })}
                                placeholder="https://linkedin.com/in/..."
                                icon="link"
                            />
                            <FormField
                                label="GitHub"
                                name="github"
                                type="url"
                                value={socialLinks?.github || ''}
                                onChange={(v) => setSocialLinks({ ...socialLinks, github: v })}
                                placeholder="https://github.com/..."
                                icon="link"
                            />
                            <FormField
                                label="Website"
                                name="website"
                                type="url"
                                value={socialLinks?.website || ''}
                                onChange={(v) => setSocialLinks({ ...socialLinks, website: v })}
                                placeholder="https://..."
                                icon="link"
                            />
                        </div>
                    </FormSection>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-10 px-6 bg-inverse text-inverse text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </section>

            {/* Change Password Form */}
            {user?.app_metadata?.provider === 'email' ? (
                <section className="border border-border bg-main p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Change Password
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <FormField
                            label="New Password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            placeholder="Enter new password"
                        />

                        <FormField
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm new password"
                        />

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="h-10 px-6 bg-inverse text-inverse text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section className="border border-border bg-main p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">lock</span>
                        Security
                    </h3>
                    <p className="text-muted text-sm">
                        You are logged in via <span className="text-text-main font-bold capitalize">{user?.app_metadata?.provider}</span>.
                        Please manage your password directly through their platform.
                    </p>
                </section>
            )}
        </div>
    )
}
