"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MoveRight, MousePointer2, GitBranch, Zap, LayoutGrid } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";

export default function Home() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] text-slate-900 dark:text-slate-200 selection:bg-violet-500/30 selection:text-white relative overflow-hidden font-sans transition-colors duration-200">

      {/* Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#7c3aed18_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed18_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#7c3aed18_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed18_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-400/10 dark:bg-violet-600/20 rounded-full blur-[130px] mix-blend-multiply dark:mix-blend-screen" />
        {/* Brush stroke decorations */}
        <svg className="absolute bottom-0 right-0 w-[400px] h-[350px] opacity-[0.05] dark:opacity-[0.04]" viewBox="0 0 500 400" fill="none">
          <path d="M 450 50 C 350 80, 200 20, 100 120 C 0 220, 80 350, 200 370" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
          <path d="M 480 200 C 380 150, 300 250, 200 230 C 100 210, 50 300, 80 380" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="100" cy="80" r="3" fill="#8b5cf6"/>
          <circle cx="380" cy="300" r="2" fill="#8b5cf6"/>
        </svg>
        <svg className="absolute top-20 left-0 w-[280px] h-[250px] opacity-[0.05] dark:opacity-[0.04]" viewBox="0 0 350 300" fill="none">
          <path d="M 20 280 C 60 200, 40 120, 120 80 C 200 40, 300 100, 330 180" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="320" cy="60" r="2" fill="#8b5cf6"/>
          <circle cx="80" cy="250" r="3" fill="#8b5cf6"/>
        </svg>
      </div>

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/30 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.2)]">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-violet-600 dark:text-violet-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">PixelSync</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              {mounted && user ? (
                <>
                  <Link href="/dashboard" className="text-sm px-4 py-2 bg-violet-600/10 border border-violet-500/40 text-violet-600 dark:text-violet-300 hover:bg-violet-600/20 transition-all font-medium whitespace-nowrap flex items-center gap-2">
                    <LayoutGrid size={15}/> Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium hidden sm:block">
                    Sign In
                  </Link>
                  <ThemeToggle />
                  <Link href="/signup" className="text-sm px-4 py-2 border border-violet-500/40 dark:border-violet-500/30 text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 transition-all font-medium whitespace-nowrap">
                    Get Started
                  </Link>
                </>
              )}
              {mounted && user && <ThemeToggle />}
            </div>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 py-16 md:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-violet-500/20 bg-violet-500/5 text-xs font-mono text-violet-600 dark:text-violet-400 mb-8">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              Real-time collaboration · Now live
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.92] mb-8 text-slate-900 dark:text-white uppercase">
              Think<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-500 dark:glow-violet-text">Together.</span><br />
              <span className="opacity-20 dark:opacity-30">Build Faster.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-light leading-relaxed mb-10 border-l-2 border-violet-500/30 pl-5">
              An infinite canvas for teams. Draw freely, build flowcharts, share ideas — all in real-time with anyone, anywhere.
            </p>

            <div className="flex flex-row gap-3 items-center">
              {mounted && user ? (
                <Link href="/dashboard" className="group h-11 px-6 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all shadow-[0_0_18px_rgba(124,58,237,0.3)] hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] text-sm whitespace-nowrap">
                  Go to Dashboard
                  <MoveRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
              ) : (
                <Link href="/signup" className="group h-11 px-6 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all shadow-[0_0_18px_rgba(124,58,237,0.3)] hover:shadow-[0_0_28px_rgba(124,58,237,0.5)] text-sm whitespace-nowrap">
                  Start Drawing
                  <MoveRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
              )}
              <Link href="/board/demo?type=canvas" className="group h-11 px-6 flex items-center gap-2 border border-slate-300 dark:border-white/10 hover:border-violet-500/50 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 font-semibold transition-all hover:bg-violet-500/5 text-sm whitespace-nowrap">
                Try the Demo
              </Link>
            </div>
          </div>
        </main>

        {/* Features */}
        <div className="border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 py-16 md:py-20 grid sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-16 relative">
            <div className="hidden md:block absolute top-0 bottom-0 left-[33%] w-px bg-gradient-to-b from-transparent via-black/5 dark:via-white/5 to-transparent" />
            <div className="hidden md:block absolute top-0 bottom-0 left-[66%] w-px bg-gradient-to-b from-transparent via-black/5 dark:via-white/5 to-transparent" />
            {[
              { icon: <MousePointer2 size={20} strokeWidth={1.5}/>, title: "Live Multiplayer", desc: "Zero-latency cursor tracking. Collaborate as if you are in the same room." },
              { icon: <GitBranch size={20} strokeWidth={1.5}/>, title: "Infinite Canvas", desc: "Freehand drawing, shapes, and flowcharts on an infinite scrollable board." },
              { icon: <Zap size={20} strokeWidth={1.5}/>, title: "60fps Engine", desc: "Hardware-accelerated rendering. Handles thousands of elements without a stutter." },
            ].map((f, i) => (
              <div key={i} className="group text-left">
                <div className="w-10 h-10 border border-violet-500/20 bg-violet-500/5 group-hover:bg-violet-500/10 group-hover:border-violet-500/40 flex items-center justify-center mb-5 text-violet-600 dark:text-violet-400 transition-all">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
