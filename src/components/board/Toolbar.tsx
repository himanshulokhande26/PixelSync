"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useBoardStore, Tool } from "../../store/useBoardStore";
import {
  Hand, MousePointer2, PenTool, Eraser, ChevronDown,
  Type, Shapes, Bold, Italic, Square, Circle, Diamond,
  Triangle, Star, Hexagon,
} from "lucide-react";

const COLORS = ["#0f0f0f", "#8b5cf6", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#ec4899", "#ffffff"];
const FONT_SIZES = [10, 12, 14, 16, 20, 24, 32, 48];

// ─── Brush size dropdown ──────────────────────────────────────────────────────
const BRUSH_SIZES = [
  { value: 1, label: "Hairline" }, { value: 2, label: "Fine" },
  { value: 4, label: "Thin" },    { value: 6, label: "Light" },
  { value: 8, label: "Medium" },  { value: 12, label: "Bold" },
  { value: 18, label: "Heavy" },  { value: 26, label: "Thick" },
  { value: 36, label: "Ultra" },
];

// ─── Canvas shape definitions (used in the popover) ──────────────────────────
const CANVAS_SHAPES = [
  { id: "rectangle" as Tool, icon: <Square size={16} />,   label: "Rectangle" },
  { id: "circle"    as Tool, icon: <Circle size={16} />,   label: "Circle" },
  { id: "oval"      as Tool, icon: <Circle size={16} className="scale-x-[1.6]" />, label: "Oval" },
  { id: "diamond"   as Tool, icon: <Diamond size={16} />,  label: "Diamond" },
  { id: "triangle"  as Tool, icon: <Triangle size={16} />, label: "Triangle" },
  { id: "star"      as Tool, icon: <Star size={16} />,     label: "Star" },
  { id: "hexagon"   as Tool, icon: <Hexagon size={16} />,  label: "Hexagon" },
];

const SHAPE_TOOL_IDS = new Set(CANVAS_SHAPES.map((s) => s.id));

// ─── Canvas primary tools (non-shape) ────────────────────────────────────────
const CANVAS_TOOLS: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: "select",  icon: <MousePointer2 size={16} />, label: "Select", shortcut: "V" },
  { id: "pan",     icon: <Hand size={16} />,          label: "Pan",    shortcut: "H" },
  { id: "pencil",  icon: <PenTool size={16} />,       label: "Draw",   shortcut: "P" },
  { id: "text",    icon: <Type size={16} />,          label: "Text",   shortcut: "T" },
  { id: "eraser",  icon: <Eraser size={16} />,        label: "Eraser", shortcut: "E" },
];

const FLOWCHART_TOOLS: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: "select",    icon: <MousePointer2 size={16} />, label: "Select",    shortcut: "V" },
  { id: "pan",       icon: <Hand size={16} />,          label: "Pan",       shortcut: "H" },
  { id: "text",      icon: <Type size={16} />,          label: "Text",      shortcut: "T" },
  { id: "rectangle", icon: <Square size={16} />,        label: "Node",      shortcut: "R" },
  { id: "oval",      icon: <Circle size={16} className="scale-x-125" />, label: "Start/End", shortcut: "O" },
  { id: "circle",    icon: <Circle size={16} />,        label: "Circle",    shortcut: "C" },
  { id: "diamond",   icon: <Diamond size={16} />,       label: "Decision",  shortcut: "D" },
  { id: "eraser",    icon: <Eraser size={16} />,        label: "Eraser",    shortcut: "E" },
];

// ─── Brush Size Dropdown ──────────────────────────────────────────────────────
function BrushSizeDropdown({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = BRUSH_SIZES.find((b) => b.value === value) || BRUSH_SIZES[4];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 h-10 border transition-all ${open ? "border-violet-500 bg-violet-500/10" : "border-slate-200 dark:border-white/10 bg-white dark:bg-black hover:border-violet-500/50"}`}
      >
        <svg viewBox="0 0 40 20" width="40" height="20" className="flex-shrink-0">
          <line x1="4" y1="10" x2="36" y2="10"
            stroke={color === "#ffffff" ? "#94a3b8" : color === "#0f0f0f" ? "#1e293b" : color}
            strokeWidth={Math.min(value, 14)} strokeLinecap="round" />
        </svg>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:block">{current.label}</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 w-[180px] bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 shadow-xl z-50 py-1">
          <div className="px-3 pt-2 pb-1"><span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Brush Size</span></div>
          {BRUSH_SIZES.map((bs) => (
            <button key={bs.value} onClick={() => { onChange(bs.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 h-10 hover:bg-violet-500/8 dark:hover:bg-violet-500/10 transition-colors group ${value === bs.value ? "bg-violet-500/10" : ""}`}>
              <svg viewBox="0 0 60 24" width="60" height="24" className="flex-shrink-0">
                <line x1="4" y1="12" x2="56" y2="12"
                  stroke={value === bs.value ? "#8b5cf6" : "#94a3b8"}
                  strokeWidth={Math.min(bs.value, 20)} strokeLinecap="round"
                  className="group-hover:stroke-violet-500 transition-colors" />
              </svg>
              <span className={`text-xs font-mono flex-1 text-left ${value === bs.value ? "text-violet-600 dark:text-violet-400 font-bold" : "text-slate-500 dark:text-slate-400"}`}>{bs.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">{bs.value}px</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shapes Popover (PowerPoint-style) ───────────────────────────────────────
function ShapesPopover({ activeTool, onSelect }: { activeTool: Tool; onSelect: (t: Tool) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = SHAPE_TOOL_IDS.has(activeTool);
  const active = CANVAS_SHAPES.find((s) => s.id === activeTool);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative group">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Shapes [S]"
        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-150 ${
          isActive
            ? "bg-violet-500/15 border border-violet-500 text-violet-600 dark:text-violet-400 shadow-[inset_0_0_10px_rgba(124,58,237,0.15)]"
            : "border border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        {isActive && active ? active.icon : <Shapes size={16} />}
      </button>

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-slate-900 dark:bg-black border border-white/10 text-violet-300 font-mono text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg hidden sm:block z-50">
        Shapes <span className="text-slate-500 ml-1">[S]</span>
      </div>

      {/* Popover grid */}
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom" style={{ minWidth: 280 }}>
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Shapes</p>
          </div>
          <div className="p-2 grid gap-1.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {CANVAS_SHAPES.map((shape) => (
              <button
                key={shape.id}
                onClick={() => { onSelect(shape.id); setOpen(false); }}
                title={shape.label}
                className={`flex flex-col items-center justify-center gap-1.5 border transition-all ${
                  activeTool === shape.id
                    ? "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400"
                    : "border-slate-200 dark:border-white/8 text-slate-500 dark:text-slate-400 hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-400"
                }`}
                style={{ width: 60, height: 56, flexShrink: 0 }}
              >
                {shape.icon}
                <span className="text-[9px] font-mono leading-none text-center truncate w-full px-0.5">{shape.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Font Size Dropdown ───────────────────────────────────────────────────────
function FontSizeDropdown({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 h-9 border text-sm font-mono transition-all min-w-[64px] justify-between ${open ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400" : "border-slate-200 dark:border-white/10 bg-white dark:bg-black text-slate-600 dark:text-slate-300 hover:border-violet-500/50"}`}
      >
        <span>{value}px</span>
        <ChevronDown size={11} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 w-[100px] bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 shadow-xl z-50 py-1">
          {FONT_SIZES.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm font-mono transition-colors ${value === s ? "text-violet-600 dark:text-violet-400 bg-violet-500/10" : "text-slate-600 dark:text-slate-300 hover:bg-violet-500/8"}`}>
              {s}px
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────
export function Toolbar({ boardType = "canvas" }: { boardType?: "canvas" | "flowchart" }) {
  const {
    tool, setTool,
    strokeColor, setStrokeColor,
    strokeWidth, setStrokeWidth,
    textColor, setTextColor,
    fontSize, setFontSize,
    fontBold, setFontBold,
    fontItalic, setFontItalic,
  } = useBoardStore();

  const colorInputRef = useRef<HTMLInputElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for "S" → open shapes default (rectangle)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "S" || e.key === "s") setTool("rectangle");
      if (e.key === "V" || e.key === "v") setTool("select");
      if (e.key === "H" || e.key === "h") setTool("pan");
      if (e.key === "P" || e.key === "p") setTool("pencil");
      if (e.key === "T" || e.key === "t") setTool("text");
      if (e.key === "E" || e.key === "e") setTool("eraser");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setTool]);

  const activeTools = boardType === "flowchart" ? FLOWCHART_TOOLS : CANVAS_TOOLS;
  const dividerIndex = activeTools.length - 1;

  // Which tools show the color palette?
  const isDrawingTool = boardType === "flowchart"
    ? ["rectangle", "circle", "text", "diamond", "arrow", "oval"].includes(tool)
    : ["pencil", "rectangle", "circle", "text", "diamond", "arrow", "oval", "triangle", "star", "hexagon"].includes(tool);

  // Text formatting bar for text tool
  const showTextFormat = tool === "text" || (boardType === "flowchart" && ["rectangle", "circle", "diamond", "oval"].includes(tool));

  return (
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-2 w-full max-w-[calc(100vw-2rem)] sm:max-w-none sm:w-auto">

      {/* ── Text Formatting Bar ── */}
      {showTextFormat && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <FontSizeDropdown value={fontSize} onChange={setFontSize} />
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />
            <button
              onClick={() => setFontBold(!fontBold)}
              title="Bold"
              className={`w-8 h-8 flex items-center justify-center border text-sm font-bold transition-all ${fontBold ? "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400" : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            ><Bold size={14} /></button>
            <button
              onClick={() => setFontItalic(!fontItalic)}
              title="Italic"
              className={`w-8 h-8 flex items-center justify-center border text-sm transition-all ${fontItalic ? "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-400" : "border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            ><Italic size={14} /></button>
          </div>
        </div>
      )}

      {/* ── Main Row ── */}
      <div className="flex items-center gap-2 flex-wrap justify-center">

        {/* Tools container */}
        <div className="flex items-center p-1 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.8)] relative flex-shrink-0">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

          {activeTools.map((t, i) => (
            <div key={t.id} className="flex items-center">
              {i === dividerIndex && <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />}
              <div className="group relative">
                <button onClick={() => setTool(t.id)}
                  title={`${t.label} [${t.shortcut}]`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-150 ${
                    tool === t.id
                      ? "bg-violet-500/15 border border-violet-500 text-violet-600 dark:text-violet-400 shadow-[inset_0_0_10px_rgba(124,58,237,0.15)]"
                      : "border border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}>
                  {t.icon}
                </button>
                {/* Tooltip above */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-slate-900 dark:bg-black border border-white/10 text-violet-300 font-mono text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg hidden sm:block z-50">
                  {t.label} <span className="text-slate-500 ml-1">[{t.shortcut}]</span>
                </div>
              </div>
            </div>
          ))}

          {/* Shapes popover — canvas only */}
          {boardType === "canvas" && (
            <>
              <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />
              <ShapesPopover activeTool={tool} onSelect={setTool} />
            </>
          )}
        </div>

        {/* ── Color + text color palettes ── */}
        {isDrawingTool && (
          <div className="flex items-center gap-2 flex-wrap justify-center animate-in fade-in zoom-in-95 duration-150">

            {/* Stroke color swatches */}
            <div className="flex items-center px-2 py-1 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg gap-1.5 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
              {COLORS.map((color) => (
                <button key={color} onClick={() => setStrokeColor(color)}
                  className={`w-5 h-5 transition-all duration-100 flex-shrink-0 ${strokeColor === color ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-black ring-violet-500 scale-110" : "hover:scale-110 opacity-75 hover:opacity-100"}`}
                  style={{ backgroundColor: color, border: color === "#ffffff" ? "1px solid #e2e8f0" : color === "#0f0f0f" ? "1px solid #374151" : "none" }}
                  title={color} />
              ))}
              <button onClick={() => colorInputRef.current?.click()}
                className="w-5 h-5 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-violet-500 text-slate-400 hover:text-violet-500 hover:scale-110 transition-all bg-white dark:bg-black text-[10px] font-bold flex-shrink-0"
                style={!COLORS.includes(strokeColor) ? { backgroundColor: strokeColor } : {}}>+</button>
              <input ref={colorInputRef} type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
            </div>

            {/* Text color swatches — for shapes & text tools */}
            {["rectangle", "circle", "diamond", "oval", "text", "arrow", "triangle", "star", "hexagon"].includes(tool) && (
              <div className="flex items-center px-2 py-1 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg gap-1.5 relative">
                <Type size={12} className="text-slate-400 mr-0.5 flex-shrink-0" />
                {COLORS.map((color) => (
                  <button key={`text-${color}`} onClick={() => setTextColor(color)}
                    className={`w-4 h-4 transition-all duration-100 flex-shrink-0 ${textColor === color ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-black ring-violet-500 scale-110" : "hover:scale-110 opacity-75 hover:opacity-100"}`}
                    style={{ backgroundColor: color, border: color === "#ffffff" ? "1px solid #e2e8f0" : color === "#0f0f0f" ? "1px solid #374151" : "none", borderRadius: "2px" }}
                    title={`Text: ${color}`} />
                ))}
                <button onClick={() => textColorInputRef.current?.click()}
                  className="w-4 h-4 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-violet-500 text-slate-400 hover:text-violet-500 hover:scale-110 transition-all text-[9px] font-bold"
                  style={!COLORS.includes(textColor) ? { backgroundColor: textColor } : {}}>+</button>
                <input ref={textColorInputRef} type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
              </div>
            )}

            {/* Brush size — canvas freehand only */}
            {boardType !== "flowchart" && tool === "pencil" && (
              <BrushSizeDropdown value={strokeWidth} onChange={setStrokeWidth} color={strokeColor} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
