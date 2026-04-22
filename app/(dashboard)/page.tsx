'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-auto bg-main text-text-main">
      <main id='explore' className="relative scroll-mt-40">

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 lg:px-20 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-700/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Copy */}
            <div className="space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-bold tracking-widest uppercase text-gold">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                The Gamified Learning Tracker
              </div>
              <h1 className="text-5xl md:text-7xl font-header leading-[1.1] tracking-tight text-text-main">
                Forge Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-200">Knowledge Arsenal</span>
              </h1>
              <p className="text-muted text-lg md:text-xl max-w-xl leading-relaxed">
                MindBreaker transforms your coding courses, tutorials, and articles into epic Expeditions and Quests. Track your mastery, complete missions, and level up your professional skills in an RPG-inspired environment.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/register"
                  className="px-8 py-3 bg-gold text-midnight font-bold rounded-xs hover:bg-gold/90 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-surface border border-border text-text-main font-bold rounded-xs hover:border-gold transition-colors"
                >
                  Enter Guild Hall
                </Link>
              </div>
            </div>

            {/* Right Visual / Widget */}
            <div className="relative z-10">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-transparent rounded-xs blur-lg"></div>
              <div className="relative dark:bg-surface-dark bg-surface/80 backdrop-blur-xl border border-white/10 rounded-xs p-8 shadow-2xl overflow-hidden group">
                <div className="space-y-6 mb-8">
                  <div className="flex justify-between items-end border-b border-border pb-4">
                    <div>
                      <p className="text-muted text-xs font-bold uppercase tracking-widest mb-1">Current Class</p>
                      <h3 className="text-3xl font-header text-text-main">Lvl 42 Architect</h3>
                    </div>
                    <p className="text-gold font-black text-sm tracking-widest">2,450 XP</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted">
                      <span>Next Level Progression</span>
                      <span>81%</span>
                    </div>
                    <div className="w-full h-3 bg-midnight rounded-full border border-border p-0.5">
                      <div className="h-full bg-gold rounded-full w-[81%] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                    </div>
                  </div>

                  <div className="pt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-main/50 p-3 rounded-xs border border-border">
                      <p className="text-xl font-bold text-text-main">14</p>
                      <p className="text-[9px] uppercase tracking-widest text-muted mt-1">Quests</p>
                    </div>
                    <div className="bg-main/50 p-3 rounded-xs border border-border">
                      <p className="text-xl font-bold text-text-main">5</p>
                      <p className="text-[9px] uppercase tracking-widest text-muted mt-1">Expeditions</p>
                    </div>
                    <div className="bg-main/50 p-3 rounded-xs border border-border">
                      <p className="text-xl font-bold text-text-main">38</p>
                      <p className="text-[9px] uppercase tracking-widest text-muted mt-1">Missions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features / App Explanation */}
        <section className="py-24 px-6 lg:px-20 bg-surface/30 border-y border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-header text-text-main">The Ultimate Learning Framework</h2>
              <p className="text-muted max-w-2xl mx-auto">Stop losing track of your courses across multiple tabs. Centralize all your learning objectives under a unified, gamified architecture.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-main border border-border p-8 hover:border-gold/50 transition-colors group">
                <span className="material-symbols-outlined text-4xl text-gold mb-4 group-hover:scale-110 transition-transform">map</span>
                <h3 className="text-xl font-bold text-text-main mb-3 uppercase tracking-wider text-sm">Design Expeditions</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Group individual tutorials and articles into major &ldquo;Expeditions&rdquo;. Set overarching goals and track completion macro-progress.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-main border border-border p-8 hover:border-gold/50 transition-colors group">
                <span className="material-symbols-outlined text-4xl text-gold mb-4 group-hover:scale-110 transition-transform">swords</span>
                <h3 className="text-xl font-bold text-text-main mb-3 uppercase tracking-wider text-sm">Conquer Quests</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Break down an expedition into actionable &ldquo;Quests&rdquo;. Manage specific courses, set XP rewards, and mark them complete as you progress.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-main border border-border p-8 hover:border-gold/50 transition-colors group">
                <span className="material-symbols-outlined text-4xl text-gold mb-4 group-hover:scale-110 transition-transform">assignment</span>
                <h3 className="text-xl font-bold text-text-main mb-3 uppercase tracking-wider text-sm">Execute Missions</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Translate theory into practice. Commit &ldquo;Missions&rdquo; (exercises or mini-projects) to validate your skills and earn actual mastery points.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-midnight border-t border-white/10 px-6 lg:px-20 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-8 mb-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-text-main">
                  <span className="material-symbols-outlined text-3xl text-gold">sports_esports</span>
                  <h2 className="text-text-main text-2xl font-header tracking-tight">MindBreaker</h2>
                </div>
                <p className="text-muted text-xs max-w-sm">
                  Elevate your developer journey through gamified learning structure and epic progress tracking.
                </p>
              </div>
              <div className="flex gap-16">
                <div className="space-y-4">
                  <h5 className="text-text-main font-bold text-xs uppercase tracking-widest">Platform</h5>
                  <ul className="text-muted text-sm space-y-3">
                    <li><Link className="hover:text-gold transition-colors flex items-center gap-2" href="/login">Guild Hall <span className="material-symbols-outlined text-xs">arrow_forward</span></Link></li>
                    <li><Link className="hover:text-gold transition-colors" href="/register">Create Account</Link></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h5 className="text-text-main font-bold text-xs uppercase tracking-widest">Community</h5>
                  <ul className="text-muted text-sm space-y-3">
                    <li><Link className="hover:text-gold transition-colors" href="https://github.com/Let0oro/mind-breakers">GitHub Source</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-muted/50 text-xs">© {new Date().getFullYear()} MindBreaker. Open Source Project.</p>
              <p className="text-muted/50 text-xs flex items-center gap-1">Crafted for <span className="material-symbols-outlined text-[10px]">swords</span> Developers</p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}
