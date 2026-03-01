/**
 * Centralized navigation configuration
 */

export interface NavLink {
    label: string
    href: string
    icon: string
    adminOnly?: boolean
}

export const MAIN_NAVIGATION: NavLink[] = [
    {
        label: 'guild-hall',
        href: '/guild-hall',
        icon: 'swords',
    },
    {
        label: 'world-map',
        href: '/guild-hall/world-map',
        icon: 'map',
    },
    {
        label: 'archives',
        href: '/guild-hall/archives',
        icon: 'local_library',
    },
    {
        label: 'armory',
        href: '/guild-hall/armory',
        icon: 'handyman',
    },
]

export const ADMIN_NAVIGATION: NavLink[] = [
    {
        label: 'Command',
        href: '/guild-hall/admin',
        icon: 'security',
        adminOnly: true,
    },
]

export const AUTH_LINKS = {
    login: '/login',
    register: '/register',
    home: '/',
}
