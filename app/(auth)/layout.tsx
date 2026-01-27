// app/(auth)/layout.tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Columna izquierda - copy de marketing */}
      <aside className="hidden lg:flex lg:flex-col lg:justify-between lg:w-105 bg-neutral-950 border-r border-neutral-800 px-10 py-8">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-16 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold">
                Volver
              </div>
            </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            10k+ Learning Paths activos
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-neutral-50">
              Unlock your potential.
            </h1>
            <p className="text-sm text-neutral-400">
              Únete a miles de estudiantes construyendo su futuro a través de
              rutas de aprendizaje y retos gamificados.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-neutral-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              XP, streaks diarios y badges públicos.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Leaderboard global y por comunidad.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Paths creados por expertos de la industria.
            </li>
          </ul>
        </div>

        <div className="space-y-2 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} EduPlatform Inc.</p>
          <p>Empowering creators and learners worldwide.</p>
        </div>
      </aside>

      {/* Columna derecha - formularios auth */}
      <main className="w-full flex items-center justify-center bg-[#0f1419] ">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
