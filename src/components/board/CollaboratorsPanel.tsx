"use client";
import { useCollabStore } from "../../store/useCollabStore";

export function CollaboratorsPanel() {
  const { collaborators, userName } = useCollabStore();
  const collabList = Object.values(collaborators);

  return (
    <div className="flex items-center gap-2">
      {collabList.map(collab => (
        <div key={collab.userId} className="group relative flex-shrink-0">
          <div className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold border border-white/20 shadow-sm cursor-default select-none"
            style={{ backgroundColor: collab.color }}>
            {collab.name.charAt(0).toUpperCase()}
          </div>
          <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-900 text-violet-300 font-mono text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none z-50">
            {collab.name}
          </div>
        </div>
      ))}

      {/* Self */}
      <div className="group relative flex-shrink-0">
        <div className="w-8 h-8 flex items-center justify-center text-violet-100 text-xs font-bold border border-violet-500/50 bg-violet-500/15 shadow-[0_0_8px_rgba(124,58,237,0.25)] cursor-default select-none">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-slate-900 text-violet-300 font-mono text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none z-50">
          {userName} (you)
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/80 dark:bg-black/70 border border-black/8 dark:border-white/10 text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-sm flex-shrink-0">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        {collabList.length + 1} online
      </div>
    </div>
  );
}
