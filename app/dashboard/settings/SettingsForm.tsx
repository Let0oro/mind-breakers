'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface SettingsFormProps {
    user: any
    profile: any
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

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            const updates: any = {
                username,
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
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
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
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
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
            <section className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#137fec]">person</span>
                    Profile Information
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                            Profile Image
                        </label>
                        <div className="flex items-center gap-4">
                            {profile?.avatar_url && (
                                <img
                                    src={profile.avatar_url}
                                    alt="Current Avatar"
                                    className="w-12 h-12 rounded-full object-cover border border-[#3b4754]"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-[#9dabb9] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#137fec] file:text-white hover:file:bg-[#137fec]/90 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white focus:outline-none focus:border-[#137fec] transition-colors"
                            placeholder="Enter username"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="h-10 px-6 rounded-lg bg-[#137fec] text-white font-medium hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </section>

            {/* Change Password Form */}
            <section className="bg-[#1a232e] rounded-xl border border-[#3b4754] p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#137fec]">lock</span>
                    Change Password
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white focus:outline-none focus:border-[#137fec] transition-colors"
                            placeholder="Enter new password"
                        />
                    </div>

                    <div>
                        <label className="block text-[#9dabb9] text-sm font-medium mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-lg bg-[#111418] border border-[#3b4754] text-white focus:outline-none focus:border-[#137fec] transition-colors"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="h-10 px-6 rounded-lg bg-[#137fec] text-white font-medium hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
