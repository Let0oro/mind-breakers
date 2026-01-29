'use client';

// import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <main id='explore' className="relative scroll-mt-40">
        <section className="hero-gradient pt-20 pb-12 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                Level Up Your <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">Career</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed">
                Turn your professional expertise into interactive quests. Learn new skills, earn rare XP, and dominate the global leaderboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={"/login"} className="bg-primary dark:bg-primary/5 dark:text-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
                  <span className="material-symbols-outlined">play_arrow</span>
                  Start Learning
                </Link>
                <Link href={"/login"} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">
                  Create a Quest
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden group">
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Current Level</p>
                      <h3 className="text-2xl font-bold text-white">Lvl 42 Architect</h3>
                    </div>
                    <p className="text-slate-200 font-bold text-sm">2,450 / 3,000 XP</p>
                  </div>
                  <div className="w-full h-4 bg-background-dark rounded-full border border-white/5 p-1">
                    <div className="h-full bg-primary rounded-full neon-glow w-[80%]"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background-dark/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                      <span className="material-symbols-outlined text-3xl">emoji_events</span>
                    </div>
                    <div>
                      <p className="text-white font-bold">Gold Trophy</p>
                      <p className="text-slate-300 text-sm">Top 1% Learner</p>
                    </div>
                  </div>
                  <div className="bg-background-dark/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">verified</span>
                    </div>
                    <div>
                      <p className="text-white font-bold">Certified</p>
                      <p className="text-slate-300 text-sm">Python Master</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-24 h-24 bg-linear-to-br from-primary to-accent opacity-20 rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 lg:px-20 py-12">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-6">
            <div className="flex-1 min-w-70 bg-surface-dark p-8 rounded-2xl border border-white/5">
              <p className="text-slate-800 text-sm font-medium mb-1 uppercase dark:text-slate-200 tracking-widest">Global XP Distributed</p>
              <h4 className="text-4xl font-bold text-white tracking-tight">1.28B <span className="text-primary text-xl">XP</span></h4>
            </div>
            <div className="flex-1 min-w-70 bg-surface-dark p-8 rounded-2xl border border-white/5">
              <p className="text-slate-800 text-sm font-medium mb-1 uppercase dark:text-slate-200 tracking-widest">Live Active Quests</p>
              <h4 className="text-4xl font-bold text-white tracking-tight">4,290+ <span className="text-accent dark:text-slate-400 text-xl">Courses</span></h4>
            </div>
            <div className="flex-1 min-w-70 bg-primary p-8 rounded-2xl dark:bg-primary/5 dark:text-primary shadow-xl shadow-primary/20 dark:shadow-background/20">
              <p className="text-white/80 dark:text-white/80 text-sm font-medium mb-1 uppercase tracking-widest">Top Player Prize Pool</p>
              <h4 className="text-4xl font-bold text-white tracking-tight">$50k <span className="text-white/70 text-xl">USD</span></h4>
            </div>
          </div>
        </section>
        <section className="px-6 lg:px-20 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -skew-y-3"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-background-dark/80 backdrop-blur rounded-2xl border border-white/10 p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h4 id='quests' className="text-white font-bold scroll-mt-40">Quest Builder <span className="text-slate-400 font-normal">v1.0</span></h4>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-primary/20 backdrop-blur border-2 border-dashed border-primary/40 rounded-xl p-4 flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary">drag_indicator</span>
                        <div>
                          <p className="text-white font-bold text-sm">Introduction to UI Design</p>
                          <p className="text-slate-300 text-sm">5 Minutes • Video</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">edit</span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center justify-between opacity-80 scale-95 origin-left">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400">drag_indicator</span>
                        <div>
                          <p className="text-white font-bold text-sm">Color Theory Quest</p>
                          <p className="text-slate-300 text-sm">10 XP • Interactive Quiz</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400">lock</span>
                    </div>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-4xl">add_circle</span>
                      <p className="text-sm font-bold">Drag lesson module here</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-5xl font-black text-white leading-tight">From Player to <span className="text-primary underline decoration-accent underline-offset-8">Game Master</span></h2>
                <p className="text-slate-100 text-xl leading-relaxed">
                  {"Think you've mastered a skill? Create your own quests and build a following. Our drag-and-drop builder makes course creation as easy as playing a game."}
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-primary text-3xl">monetization_on</span>
                    <h5 className="text-white font-bold">Earn Revenue</h5>
                    <p className="text-slate-900 dark:text-slate-200 text-sm">Get paid for every learner who completes your quest.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-accent text-3xl">insights</span>
                    <h5 className="text-white font-bold">Real Analytics</h5>
                    <p className="text-slate-900 dark:text-slate-200 text-sm">Detailed insights into learner progress and drop-offs.</p>
                  </div>
                </div>
                <Link href={"/login"} className="bg-white text-black px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors flex">
                  Launch Your First Course
                </Link>
              </div>
            </div>
          </div>
        </section>
        <footer className="bg-background-dark border-t border-white/10 px-6 lg:px-20 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined text-3xl">sports_esports</span>
                  <h2 className="text-white text-2xl font-bold tracking-tight">MindBreaker</h2>
                </div>
                <p className="text-slate-400 text-sm max-w-xs">{"The world's first decentralized educational arena powered by players like you."}</p>
              </div>
              <div className="flex gap-12">
                <div className="space-y-4">
                  <h5 className="text-white font-bold text-sm">Platform</h5>
                  <ul className="text-slate-400 text-sm space-y-2">
                    <li><Link className="hover:text-primary transition-colors" href="#">Courses</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Leaderboards</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Badges</Link></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h5 className="text-white font-bold text-sm">Company</h5>
                  <ul className="text-slate-400 text-sm space-y-2">
                    <li><Link className="hover:text-primary transition-colors" href="https://github.com/Let0oro/mind-breakers">My Github</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Discord</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-6">
              <div className="bg-surface-dark px-4 py-2 rounded-full border border-white/5 flex items-center gap-3 overflow-hidden">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  Global XP Live Ticker: <span className="text-white">1,284,952,001 XP EARNED</span>
                </p>
              </div>
              <p className="text-slate-400 text-xs">© 2026 MindBreaker Global. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}











