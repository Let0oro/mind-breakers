'use client';

// import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-auto bg-main/80 text-text-main">
      <main id='explore' className="relative scroll-mt-40">
        <section className="pt-20 pb-12 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
                Level Up Your <br />Coding Skills
              </h1>
              <p className="text-muted text-lg md:text-xl max-w-xl leading-relaxed">
                Turn your professional expertise into interactive quests. Learn new skills, earn rare XP, and dominate the global leaderboard.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-inverse/20 rounded-full blur-3xl"></div>
              <div className="relative bg-surface-dark border border-white/10 rounded-xs p-6 shadow-2xl overflow-hidden group">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-muted text-xs font-bold uppercase tracking-widest">Current Level</p>
                      <h3 className="text-2xl font-bold text-text-main">Lvl 42 Architect</h3>
                    </div>
                    <p className="text-muted font-bold text-sm">2,450 / 3,000 XP</p>
                  </div>
                  <div className="w-full h-4 bg-main-dark rounded-full border border-white/5 p-1">
                    <div className="h-full bg-inverse rounded-full neon-glow w-4/5"></div>
                  </div>
                </div>

                <div className="absolute top-0 right-0 p-4">
                  <div className="w-24 h-24 bg-linear-to-br from-primary to-accent opacity-20 rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer className="bg-main-dark border-t border-white/10 px-6 lg:px-20 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-text-main">
                  <span className="material-symbols-outlined text-3xl">sports_esports</span>
                  <h2 className="text-text-main text-2xl font-bold tracking-tight">MindBreaker</h2>
                </div>
                <p className="text-muted text-xs">© 2026 MindBreaker Global. All rights reserved.</p>

              </div>
              <div className="flex gap-12">
                <div className="space-y-4">
                  <h5 className="text-text-main font-bold text-sm">Company</h5>
                  <ul className="text-muted text-sm space-y-2">
                    <li><Link className="hover:text-text-main transition-colors" href="https://github.com/Let0oro/mind-breakers">My Github</Link></li>
                    <li><Link className="hover:text-text-main transition-colors" href="#">Discord</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}











