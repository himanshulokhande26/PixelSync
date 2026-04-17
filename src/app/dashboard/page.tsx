"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../store/useAuthStore";
import { Plus, LayoutGrid, GitBranch, Trash2, LogOut, Clock, MoveRight, Search, Pencil, Check } from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";

interface Board { _id: string; title: string; type: "canvas" | "flowchart"; boardId: string; createdAt: string; updatedAt: string; }

function NewBoardModal({ onClose, onCreated, token }: { onClose: () => void; onCreated: (b: Board) => void; token: string }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"canvas" | "flowchart">("canvas");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"}/api/boards", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title || "Untitled Board", type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onCreated(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-black border border-black/8 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 bg-gradient-to-r from-violet-600 via-violet-400 to-violet-600" />
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">New Board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Name it and pick a type.</p>
          <input autoFocus type="text" placeholder="Board title..."
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/80 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/70 transition-all text-sm mb-4"
          />
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { val: "canvas", icon: <LayoutGrid size={18}/>, label: "Canvas", desc: "Freeform drawing" },
              { val: "flowchart", icon: <GitBranch size={18}/>, label: "Flowchart", desc: "Structured diagrams" },
            ].map(opt => (
              <button key={opt.val} onClick={() => setType(opt.val as any)}
                className={`p-4 border text-left transition-all group ${type === opt.val ? "border-violet-500 bg-violet-500/10" : "border-slate-200 dark:border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5"}`}>
                <div className={`mb-2 ${type === opt.val ? "text-violet-600 dark:text-violet-400" : "text-slate-400 group-hover:text-violet-500 transition-colors"}`}>{opt.icon}</div>
                <div className={`font-bold text-sm ${type === opt.val ? "text-violet-700 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(124,58,237,0.2)] group">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>Create <MoveRight size={15} className="group-hover:translate-x-0.5 transition-transform"/></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime(), m = Math.floor(diff / 60000);
  if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Inline rename field for a board card
function BoardTitle({ board, token, onRenamed }: { board: Board; token: string; onRenamed: (id: string, title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = async () => {
    setEditing(false);
    const trimmed = value.trim() || board.title;
    setValue(trimmed);
    if (trimmed === board.title) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/boards/${board._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: trimmed }),
      });
      onRenamed(board._id, trimmed);
    } catch { setValue(board.title); }
  };

  if (editing) return (
    <div className="flex items-center gap-1 mb-1">
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setValue(board.title); setEditing(false); } }}
        className="flex-1 text-base font-bold bg-transparent border-b border-violet-500 text-slate-800 dark:text-slate-100 outline-none truncate"
        onClick={e => e.stopPropagation()}
      />
      <button onMouseDown={commit} className="text-violet-500 hover:text-violet-700 transition-colors flex-shrink-0"><Check size={14} /></button>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 mb-1 group/rename">
      <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex-1">{value}</h3>
      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); setEditing(true); }}
        className="opacity-0 group-hover/rename:opacity-100 p-1 text-slate-400 hover:text-violet-500 transition-all flex-shrink-0"
        title="Rename board"
      ><Pencil size={12} /></button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.push("/login"); return; }
    fetchBoards();
  }, [user, mounted]);

  const fetchBoards = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}"}/api/boards", { headers: { Authorization: `Bearer ${user!.token}` } });
      setBoards(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this board?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/boards/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${user!.token}` } });
    setBoards(p => p.filter(b => b._id !== id));
  };

  const handleRenamed = (id: string, title: string) => {
    setBoards(p => p.map(b => b._id === id ? { ...b, title } : b));
  };

  const handleCreated = (b: Board) => { setShowModal(false); router.push(`/board/${b.boardId}?type=${b.type}`); };
  const handleLogout = () => { logout(); router.push("/"); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const filteredBoards = boards.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] transition-colors duration-200 relative">
      {showModal && <NewBoardModal onClose={() => setShowModal(false)} onCreated={handleCreated} token={user.token} />}

      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-violet-400/6 dark:bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />
      <svg className="absolute bottom-0 left-0 w-[350px] h-[250px] opacity-[0.04] pointer-events-none" viewBox="0 0 400 300" fill="none">
        <path d="M 20 280 C 80 200, 60 120, 160 80 C 260 40, 360 120, 380 220" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="350" cy="50" r="3" fill="#8b5cf6"/>
      </svg>

      {/* Navbar */}
      <nav className="border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.15)]">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors hidden sm:block">PixelSync</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <div className="flex items-center gap-2 px-2.5 py-1.5 border border-violet-500/20 bg-violet-500/5">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-violet-600 dark:text-violet-400 font-bold max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
            </div>
            <ThemeToggle />
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors" title="Sign out"><LogOut size={17}/></button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4 border-b border-black/5 dark:border-white/5 pb-6 sm:pb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">
              {greeting()}, {user.name.split(" ")[0]}
            </h1>
            <p className="text-slate-500 text-sm font-mono">Your boards · <span className="text-violet-600 dark:text-violet-400">{user.email}</span></p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search bar */}
            <div className="relative flex-1 sm:w-56 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-11 border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/70 transition-all"
              />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 h-11 px-5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all shadow-[0_0_12px_rgba(124,58,237,0.25)] hover:shadow-[0_0_20px_rgba(124,58,237,0.45)] flex-shrink-0">
              <Plus size={16}/> New Board
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1,2,3].map(i => <div key={i} className="h-44 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 animate-pulse"/>)}
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-black/8 dark:border-white/8 bg-black/2 dark:bg-black/20 px-4">
            <div className="w-14 h-14 border border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
              {searchQuery ? <Search size={26} strokeWidth={1.5}/> : <LayoutGrid size={26} strokeWidth={1.5}/>}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              {searchQuery ? `No boards matching "${searchQuery}"` : "No boards yet"}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              {searchQuery ? "Try a different search term." : "Create your first board and start collaborating in real-time."}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-violet-600 dark:text-violet-400 border-b border-violet-500/30 hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-300 transition-colors font-medium text-sm pb-0.5">
                <Plus size={14}/> Create your first board
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredBoards.map(board => (
              <div key={board._id} className="group flex flex-col bg-white dark:bg-black border border-black/8 dark:border-white/8 hover:border-violet-500/40 p-5 sm:p-6 transition-all hover:shadow-[0_4px_20px_rgba(124,58,237,0.12)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-violet-500/60 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/10 px-2 py-1">
                    {board.type === "canvas" ? <LayoutGrid size={11}/> : <GitBranch size={11}/>}
                    {board.type}
                  </div>
                  <button onClick={() => handleDelete(board._id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <Trash2 size={14}/>
                  </button>
                </div>

                {/* Inline renameable title */}
                <BoardTitle board={board} token={user.token} onRenamed={handleRenamed} />

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 font-mono">
                  <Clock size={11}/> {timeAgo(board.updatedAt)}
                </div>
                <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                  <Link href={`/board/${board.boardId}?type=${board.type}`}
                    className="flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    <span>Open Board</span>
                    <MoveRight size={15} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
