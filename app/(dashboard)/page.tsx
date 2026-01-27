'use client';

// import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <main className="relative">
        <section className="hero-gradient pt-20 pb-12 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 dark:text-primary text-secondary text-xs font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Season 3 Now Live
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                Level Up Your <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">Career</span>
              </h1>
              <p className="dark:text-slate-500 text-slate-300 text-lg md:text-xl max-w-xl leading-relaxed">
                Turn your professional expertise into interactive quests. Learn new skills, earn rare XP, and dominate the global leaderboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={"/login"} className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
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
                      <p className="dark:text-slate-400 text-slate-600 text-xs font-bold uppercase tracking-widest">Current Level</p>
                      <h3 className="text-2xl font-bold text-white">Lvl 42 Architect</h3>
                    </div>
                    <p className="text-slate-300 font-bold text-sm">2,450 / 3,000 XP</p>
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
                      <p className="text-slate-300 text-xs">Top 1% Learner</p>
                    </div>
                  </div>
                  <div className="bg-background-dark/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">verified</span>
                    </div>
                    <div>
                      <p className="text-white font-bold">Certified</p>
                      <p className="text-slate-300 text-xs">Python Master</p>
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
              <p className="dark:text-slate-400 text-slate-600 text-sm font-medium mb-1 uppercase tracking-widest">Global XP Distributed</p>
              <h4 className="text-4xl font-bold text-white tracking-tight">1.28B <span className="text-primary text-xl">XP</span></h4>
            </div>
            <div className="flex-1 min-w-70 bg-surface-dark p-8 rounded-2xl border border-white/5">
              <p className="dark:text-slate-400 text-slate-600 text-sm font-medium mb-1 uppercase tracking-widest">Live Active Quests</p>
              <h4 className="text-4xl font-bold text-white tracking-tight">4,290+ <span className="text-accent text-xl">Courses</span></h4>
            </div>
            <div className="flex-1 min-w-70 bg-primary p-8 rounded-2xl shadow-xl shadow-primary/20">
              <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-widest">Top Player Prize Pool</p>
              <h4 className="text-4xl font-bold text-white tracking-tight">$50k <span className="text-white/60 text-xl">USD</span></h4>
            </div>
          </div>
        </section>
        <section className="px-6 lg:px-20 py-20 bg-background-dark">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">The Hall of Fame</h2>
                <p className="dark:text-slate-400 text-slate-600">{"Join the ranks of the world's most dedicated learners."}</p>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-surface-dark rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold dark:text-slate-400 text-slate-600 uppercase tracking-widest">Rank</th>
                      <th className="px-6 py-4 text-xs font-bold dark:text-slate-400 text-slate-600 uppercase tracking-widest">Player</th>
                      <th className="px-6 py-4 text-xs font-bold dark:text-slate-400 text-slate-600 uppercase tracking-widest">Experience</th>
                      <th className="px-6 py-4 text-xs font-bold dark:text-slate-400 text-slate-600 uppercase tracking-widest">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-6">
                        <span className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold">1</span>
                      </td>
                      <td className="px-6 py-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-primary">
                          <Image width={40} height={40} alt="Avatar of Alex Rivera" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKFbed-4EtjfxtUWBmozq_3RsBXPgolT6m13NPUE0Khb5Ztk793YZ_WuTw1PfsG6_BMgMKd8CVbm3WcF9Cr5hTQrClacvKZzZM2d4J6-nXsKXEDESD-ZoYnEgHZ3ZfspXhOnooXdDpCdhOf3EWPYiPM0I5vWWiZT5_B-z26LrSSVr-KeZOEL_jr25c997VNbg1d6pde11DN4fq_sCgOFFkvC5lBZXbtPfTC1_Kt6Pe122Yj8c2aA_Vm3U2IRfIKN8PnZ6MJUxSl6A" />
                        </div>
                        <span className="font-bold text-white">Alex Rivera</span>
                      </td>
                      <td className="px-6 py-6 dark:text-slate-300 text-slate-500 font-medium">145,200 XP</td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="material-symbols-outlined text-sm">trending_up</span>
                          <span className="text-xs font-bold">+12%</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-6">
                        <span className="w-8 h-8 rounded-lg bg-slate-400/20 dark:text-slate-400 text-slate-600 flex items-center justify-center font-bold">2</span>
                      </td>
                      <td className="px-6 py-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-transparent">
                          <Image width={40} height={40} alt="Avatar of Sarah Chen" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARPN5jvWnTG1W-L-uWNNMkjVhN0IWU6dEKxYphHtdfZKx7f2ZGpqru3b8azz_V1qzb__lfWv3xhKhHNDQYVr5VwNgIigGTUGLvg5xty4yUEXEXfx4P3NYYCBPSI_RhgYXuRs-jS7ZIAs9Aof7Bv7q99ekIMpQfkXPf7iE6RmSdje5ifYd6WSPvTOJRob9OIhk2tEV9nbCZQt2SDcEFe1mQeYU35gf4IFDEXiYV2aC0EpawEF6Rwky8L_Ed6a6coS2rJzgZD-J7uF4" />
                        </div>
                        <span className="font-bold text-white">Sarah Chen</span>
                      </td>
                      <td className="px-6 py-6 dark:text-slate-300 text-slate-500 font-medium">142,150 XP</td>
                      <td className="px-6 py-6 text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">remove</span>
                          <span className="text-xs font-bold">0%</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-6">
                        <span className="w-8 h-8 rounded-lg bg-orange-700/20 text-orange-700 flex items-center justify-center font-bold">3</span>
                      </td>
                      <td className="px-6 py-6 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-transparent">
                          <Image width={40} height={40} alt="Avatar of Jordan Smyth" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1k0EPqF45SVjEyrZ1wMn4QgvTq27o4_EG8zEwTnBK9qKAPyBPX6VwPl3Y_j7qJXKKYI2hipBSRXMtGdBon9G7dWylBtB76IQuSvY1So9-_vIBsIIBoy3swEF-i_NRtOw39jjqeRE75o8fgs01JFpgbFzVByuFM8oT7SxiGuw3Kf-_gaJ-7p_CtURykyPkYk1v6821069Jk9T4nZTIJIVBjolrjjlrM88Nbes8oT-WfBodRNhTe9b3RzScWLKNgFG4fQKJHQC4MCk" />
                        </div>
                        <span className="font-bold text-white">Jordan Smyth</span>
                      </td>
                      <td className="px-6 py-6 dark:text-slate-300 text-slate-500 font-medium">138,900 XP</td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="material-symbols-outlined text-sm">trending_up</span>
                          <span className="text-xs font-bold">+5%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* <div className="space-y-6">
                <div className="bg-linear-to-br from-primary to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">Elite Tier Perks</h3>
                    <ul className="space-y-4 mb-6">
                      <li className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-accent">verified_user</span>
                        Early Access to Pro Quests
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-accent">currency_bitcoin</span>
                        Direct Mentor Sponsorship
                      </li>
                      <li className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-accent">workspace_premium</span>
                        Exclusive Profile Badges
                      </li>
                    </ul>
                    <Button className="w-full bg-white text-primary font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors">View All Rewards</Button>
                  </div>
                  <span className="material-symbols-outlined absolute -bottom-8 -right-8 text-[120px] opacity-10 rotate-12">stars</span>
                </div>
                <div className="bg-surface-dark border border-white/10 rounded-2xl p-6">
                  <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">history</span>
                    Recent Activity
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <p className="dark:text-slate-400 text-slate-600"><span className="text-white font-bold">User772</span> just finished <span className="text-primary">React Mastery</span></p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <p className="dark:text-slate-400 text-slate-600"><span className="text-white font-bold">Dev_01</span> earned <span className="text-yellow-500">Top Learner</span> badge</p>
                    </div>
                  </div>
                </div>
              </div> */}
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
                    <h4 className="text-white font-bold">Quest Builder <span className="text-slate-500 font-normal">v1.0</span></h4>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-primary/20 border-2 border-dashed border-primary/40 rounded-xl p-4 flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary">drag_indicator</span>
                        <div>
                          <p className="text-white font-bold text-sm">Introduction to UI Design</p>
                          <p className="text-slate-500 text-xs">5 Minutes • Video</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-500">edit</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between opacity-80 scale-95 origin-left">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-500">drag_indicator</span>
                        <div>
                          <p className="text-white font-bold text-sm">Color Theory Quest</p>
                          <p className="text-slate-500 text-xs">10 XP • Interactive Quiz</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-500">lock</span>
                    </div>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white hover:border-white/20 transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-4xl">add_circle</span>
                      <p className="text-sm font-bold">Drag lesson module here</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-5xl font-black text-white leading-tight">From Player to <span className="text-primary underline decoration-accent underline-offset-8">Game Master</span></h2>
                <p className="dark:text-slate-400 text-slate-600 text-xl leading-relaxed">
                  {"Think you've mastered a skill? Create your own quests and build a following. Our drag-and-drop builder makes course creation as easy as playing a game."}
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-primary text-3xl">monetization_on</span>
                    <h5 className="text-white font-bold">Earn Revenue</h5>
                    <p className="text-slate-500 text-sm">Get paid for every learner who completes your quest.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-accent text-3xl">insights</span>
                    <h5 className="text-white font-bold">Real Analytics</h5>
                    <p className="text-slate-500 text-sm">Detailed insights into learner progress and drop-offs.</p>
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
                <p className="text-slate-500 text-sm max-w-xs">{"The world's first decentralized educational arena powered by players like you."}</p>
              </div>
              <div className="flex gap-12">
                <div className="space-y-4">
                  <h5 className="text-white font-bold text-sm">Platform</h5>
                  <ul className="text-slate-500 text-sm space-y-2">
                    <li><Link className="hover:text-primary transition-colors" href="#">Courses</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Leaderboards</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Badges</Link></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h5 className="text-white font-bold text-sm">Company</h5>
                  <ul className="text-slate-500 text-sm space-y-2">
                    <li><Link className="hover:text-primary transition-colors" href="#">About Us</Link></li>
                    <li><Link className="hover:text-primary transition-colors" href="#">Careers</Link></li>
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
                <p className="dark:text-slate-400 text-slate-600 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  Global XP Live Ticker: <span className="text-white">1,284,952,001 XP EARNED</span>
                </p>
              </div>
              <p className="text-slate-600 text-xs">© 2024 MindBreaker Global. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}











