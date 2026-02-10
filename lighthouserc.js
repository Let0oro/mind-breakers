// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

module.exports = {
    ci: {
        collect: {
            startServerCommand: 'npm run start',
            url: [
                'http://localhost:3000',
                'http://localhost:3000/register',
                'http://localhost:3000/login',
                'http://localhost:3000/guild-hall',
                'http://localhost:3000/guild-hall/quests',
                'http://localhost:3000/guild-hall/leaderboard',
                'http://localhost:3000/guild-hall/settings',
                'http://localhost:3000/guild-hall/world-map',
                'http://localhost:3000/guild-hall/archives',
                'http://localhost:3000/guild-hall/expeditions',
                'http://localhost:3000/guild-hall/drafts',
                'http://localhost:3000/guild-hall/missions',
                'http://localhost:3000/guild-hall/admin',
                'http://localhost:3000/guild-hall/admin/requests',
                'http://localhost:3000/guild-hall/admin/validations',
                'http://localhost:3000/guild-hall/admin/submissions',


            ],
            puppeteerScript: './lighthouse-auth-script.js',
            numberOfRuns: 3,
            settings: {
                // Don't clear localStorage/IndexedDB so credentials persist
                disableStorageReset: true,
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};

