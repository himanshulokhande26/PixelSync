"use client";
import { useState } from "react";
import { MoveRight } from "lucide-react";

export function NamePrompt({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState("");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (name.trim()) onJoin(name.trim()); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-full max-w-sm bg-white dark:bg-black border border-black/8 dark:border-white/10 shadow-2xl relative overflow-hidden z-10">
        <div className="h-1 bg-gradient-to-r from-violet-600 via-violet-400 to-violet-600" />
        <div className="p-7 sm:p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border border-violet-500/20 bg-violet-500/5 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(124,58,237,0.15)]">✦</div>
          </div>
          <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Who are you?</h2>
          <p className="text-sm text-center text-slate-500 mb-7">Enter a name so collaborators can see you.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono text-violet-600 dark:text-violet-400 mb-1.5 uppercase tracking-wider">Your Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
                placeholder="e.g. Alex"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/70 transition-all"
                required maxLength={20}
              />
            </div>
            <button type="submit" disabled={!name.trim()}
              className="mt-1 h-12 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] group">
              Join Board <MoveRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
