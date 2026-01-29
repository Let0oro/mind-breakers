# MindBreaker 🧠

MindBreaker is a gamified learning tracking platform designed to help users organize their education through learning paths and courses. It features an XP system, levels, and streaks to keep users motivated.

## Features ✨

-   **Learning Paths**: Structured collections of courses to guide learning.
-   **Course Tracking**: Mark courses as complete and track progress.
-   **Gamification**:
    -   **XP & Levels**: Earn XP by completing courses and exercises.
    -   **Streaks**: Maintain daily activity streaks.
-   **Exercises & Projects**: Submit proof of work (links, files) for review.
-   **Community**:
    -   **Leaderboard**: Compete with other learners.
    -   **Profiles**: Showcase your progress and achievements.
-   **Admin Tools**: Manage content and approve user submissions.

## Tech Stack 🛠️

-   **Frontend**: [Next.js 14+ (App Router)](https://nextjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Material Symbols](https://fonts.google.com/icons)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **Drag & Drop**: [dnd-kit](https://dndkit.com/)

## Project Structure 📂

```
mind-breaker/
├── app/                  # Next.js App Router pages and layouts
│   ├── (auth)/           # Authentication routes (login, register)
│   ├── (dashboard)/      # Protected dashboard routs
│   ├── api/              # API Routes (Next.js server functions)
│   └── components/       # Shared UI components
├── components/           # (Legacy/Shared) Components
├── public/               # Static assets
├── supabase/             # Supabase configurations and migrations
└── types/                # TypeScript type definitions
```

## Getting Started 🚀

### Prerequisites

-   Node.js 18+
-   npm or pnpm
-   Supabase project (for environment variables)


## Database Schema 🗄️

See [DATABASE.md](./DATABASE.md) for the complete schema definition, relationships, and policies.

## Contributing

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
