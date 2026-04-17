"use client";
import { use, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Save, Link2, Check, ArrowLeft, Download, Image, FileCode } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";
import { Toolbar } from "../../../components/board/Toolbar";
import { NamePrompt } from "../../../components/board/NamePrompt";
import { CollaboratorsPanel } from "../../../components/board/CollaboratorsPanel";
import { useCollabStore } from "../../../store/useCollabStore";
import { useBoardStore } from "../../../store/useBoardStore";
import { useFlowStore } from "../../../store/useFlowStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { ThemeToggle } from "../../../components/ThemeToggle";

const Canvas = dynamic(() => import("../../../components/board/Canvas").then(m => m.Canvas), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#050505] gap-4">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-violet-500 animate-pulse" />
        <div className="w-2 h-2 bg-violet-400/50 animate-pulse delay-75" />
        <div className="w-2 h-2 bg-violet-400/20 animate-pulse delay-150" />
      </div>
      <p className="text-violet-600 dark:text-violet-400 text-sm font-mono tracking-widest">Loading canvas...</p>
    </div>
  ),
});

const FlowBoard = dynamic(
  () => import("../../../components/board/FlowBoard").then(m => m.FlowBoard),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] gap-4">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-violet-500 animate-pulse" />
          <div className="w-2 h-2 bg-violet-400/50 animate-pulse delay-75" />
          <div className="w-2 h-2 bg-violet-400/20 animate-pulse delay-150" />
        </div>
        <p className="text-violet-600 dark:text-violet-400 text-sm font-mono tracking-widest">Loading flowboard...</p>
      </div>
    ),
  }
);

// Inline export menu for the header bar
function ExportMenu({ boardId, boardType }: { boardId: string; boardType: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const doExport = async (format: "png" | "svg") => {
    setOpen(false);
    // Hide React Flow controls before capturing
    const controls = document.querySelector(".react-flow__controls") as HTMLElement | null;
    const panel = document.querySelector(".react-flow__panel") as HTMLElement | null;
    if (controls) controls.style.display = "none";
    if (panel) panel.style.display = "none";

    const el = boardType === "flowchart"
      ? document.getElementById("flow-board-export")
      : document.getElementById("canvas-board-export");
    if (!el) { if (controls) controls.style.display = ""; if (panel) panel.style.display = ""; return; }
    try {
      const opts = { quality: 1, pixelRatio: 2, backgroundColor: "#050505" };
      const dataUrl = format === "png" ? await toPng(el, opts) : await toSvg(el, opts);
      const link = document.createElement("a");
      link.download = `pixelsync-${boardId}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error("Export failed:", err); }
    finally {
      if (controls) controls.style.display = "";
      if (panel) panel.style.display = "";
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white/90 dark:bg-black/80 border border-black/8 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/40 text-xs font-mono font-bold tracking-wider transition-all shadow-sm"
      >
        <Download size={12} className="text-violet-500" />
        <span className="hidden sm:inline">Export</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 shadow-xl z-[200] py-1 rounded-lg animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Download as</span>
          </div>
          <button onClick={() => doExport("png")}
            className="w-full flex items-center gap-3 px-3 h-10 hover:bg-violet-500/8 dark:hover:bg-violet-500/10 transition-colors">
            <Image size={14} className="text-violet-500 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">PNG Image</div>
              <div className="text-[10px] text-slate-400">High resolution · 2×</div>
            </div>
          </button>
          <button onClick={() => doExport("svg")}
            className="w-full flex items-center gap-3 px-3 h-10 hover:bg-violet-500/8 dark:hover:bg-violet-500/10 transition-colors">
            <FileCode size={14} className="text-violet-500 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">SVG Vector</div>
              <div className="text-[10px] text-slate-400">Infinitely scalable</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const searchParams = useSearchParams();
  const boardType = (searchParams.get("type") === "flowchart" ? "flowchart" : "canvas") as "canvas" | "flowchart";
  const { userName, setUserName } = useCollabStore();
  const { elements, setElements } = useBoardStore();
  const { nodes, edges, setNodes, setEdges } = useFlowStore();
  const { user: authUser } = useAuthStore();
  const [hasJoined, setHasJoined] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [copied, setCopied] = useState(false);
  const [boardTitle, setBoardTitle] = useState("Untitled");
  const isDemoBoard = boardId === "demo";

  // Auto-join if authenticated
  useEffect(() => {
    if (authUser && !hasJoined) {
      setUserName(authUser.name);
      setHasJoined(true);
    }
  }, [authUser, hasJoined, setUserName]);

  // Reset flow store when switching boards (prevents stale nodes from previous board)
  useEffect(() => {
    useFlowStore.getState().setNodes([]);
    useFlowStore.getState().setEdges([]);
  }, [boardId]);

  useEffect(() => {
    if (!hasJoined || isDemoBoard) return;
    fetch(`http://localhost:5000/api/boards/content/${boardId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.elements?.length > 0) setElements(data.elements);
        if (data?.title) setBoardTitle(data.title);

        // For flowchart: only apply DB state if the socket hasn't already
        // populated the store with live collaborative state.
        // Socket state (from other online users) always wins over DB state.
        if (boardType === "flowchart" && data?.nodes?.length > 0) {
          const currentNodes = useFlowStore.getState().nodes;
          if (currentNodes.length === 0) {
            // Store is still empty — safe to load from DB
            setNodes(data.nodes);
            setEdges(data.edges ?? []);
          }
          // If store already has nodes (from socket sync), skip DB load
          // to avoid overwriting live state with stale saved state
        }
      }).catch(() => {});
  }, [hasJoined, boardId]);

  const handleSave = async () => {
    if (isDemoBoard) return;
    setSaveState("saving");
    try {
      await fetch(`http://localhost:5000/api/boards/content/${boardId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          boardType === "flowchart"
            ? { nodes: useFlowStore.getState().nodes, edges: useFlowStore.getState().edges, elements: [] }
            : { elements: useBoardStore.getState().elements }
        ),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch { setSaveState("idle"); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#fafafa] dark:bg-[#050505] transition-colors duration-200">
      {!hasJoined && <NamePrompt onJoin={name => { setUserName(name); setHasJoined(true); }} />}

      {hasJoined && (
        <>
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-violet-400/5 dark:bg-violet-600/5 rounded-full blur-[180px] mix-blend-multiply dark:mix-blend-screen" />
          </div>

          <Toolbar boardType={boardType} />

          {/* Top left — back + title */}
          <div className="absolute top-3 sm:top-5 left-3 sm:left-5 z-50 flex items-center gap-2">
            <Link href="/dashboard"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/90 dark:bg-black/80 border border-black/8 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-500/50 transition-all shadow-sm"
              title="Back to Dashboard">
              <ArrowLeft size={16}/>
            </Link>
            <div className="px-3 py-2 bg-white/90 dark:bg-black/80 border border-black/8 dark:border-white/10 flex items-center gap-2.5 hover:border-violet-500/30 transition-colors shadow-sm relative overflow-hidden max-w-[140px] sm:max-w-none">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-violet-500/60" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{boardTitle}</span>
              {isDemoBoard && <span className="text-[10px] font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 flex-shrink-0">Demo</span>}
            </div>
          </div>

          {/* Top right — actions + collaborators + theme toggle */}
          <div className="absolute top-3 sm:top-5 right-3 sm:right-5 z-50 flex items-center gap-2">
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white/90 dark:bg-black/80 border border-black/8 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/40 text-xs font-mono font-bold tracking-wider transition-all shadow-sm">
              {copied ? <><Check size={12} className="text-emerald-500"/> <span className="hidden sm:inline">Copied!</span></>
                      : <><Link2 size={12} className="text-violet-500"/> <span className="hidden sm:inline">Share</span></>}
            </button>

            {/* Export — both board types */}
            <ExportMenu boardId={boardId} boardType={boardType} />

            {!isDemoBoard && (
              <button onClick={handleSave} disabled={saveState === "saving"}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-mono font-bold tracking-wider transition-all shadow-sm ${
                  saveState === "saved"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                    : "bg-white/90 dark:bg-black/80 border border-black/8 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-500/40"
                }`}>
                {saveState === "saving" ? <div className="w-3.5 h-3.5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"/>
                  : saveState === "saved" ? <><Check size={12}/> <span className="hidden sm:inline">Saved</span></>
                  : <><Save size={12} className="text-violet-500"/> <span className="hidden sm:inline">Save</span></>}
              </button>
            )}

            <div className="hidden sm:block"><ThemeToggle /></div>
            <div className="w-px h-5 bg-black/10 dark:bg-white/10 hidden sm:block" />
            <CollaboratorsPanel />
          </div>

          {/* Bottom badge */}
          <div className="absolute bottom-4 sm:bottom-5 left-3 sm:left-5 z-50 px-2.5 py-1.5 bg-white/80 dark:bg-black/70 border border-black/8 dark:border-white/8 text-[10px] font-mono text-slate-400 flex items-center gap-1.5 shadow-sm select-none">
            <span className="text-violet-500">Mode:</span>
            {boardType === "flowchart" ? "Flowchart" : "Canvas"}{isDemoBoard && " · Demo"}
          </div>

          {boardType === "flowchart" ? (
            <ReactFlowProvider>
              <FlowBoard boardId={boardId} userName={userName} />
            </ReactFlowProvider>
          ) : (
            <Canvas boardId={boardId} userName={userName} boardType={boardType} />
          )}
        </>
      )}
    </div>
  );
}
