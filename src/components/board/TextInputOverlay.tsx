// src/components/board/TextInputOverlay.tsx
"use client";
import { useEffect, useRef } from "react";
import { useBoardStore, Element } from "../../store/useBoardStore";

// Same helper as in Canvas.tsx for consistency
function getHandleCoord(el: Element, side: "top" | "bottom" | "left" | "right") {
  const w = el.width || 0;
  const h = el.height || 0;
  const x = el.x || 0;
  const y = el.y || 0;

  if (el.type === "circle") {
    const r = w / 2;
    if (side === "top") return { x, y: y - r };
    if (side === "bottom") return { x, y: y + r };
    if (side === "left") return { x: x - r, y };
    if (side === "right") return { x: x + r, y };
  }
  if (el.type === "oval") {
    const rx = w / 2;
    const ry = h / 2;
    if (side === "top") return { x, y: y - ry };
    if (side === "bottom") return { x, y: y + ry };
    if (side === "left") return { x: x - rx, y };
    if (side === "right") return { x: x + rx, y };
  }
  if (side === "top") return { x: x + w / 2, y };
  if (side === "bottom") return { x: x + w / 2, y: y + h };
  if (side === "left") return { x, y: y + h / 2 };
  if (side === "right") return { x: x + w, y: y + h / 2 };
  return { x, y };
}

function getOrthogonalPoints(p1: { x: number, y: number }, p2: { x: number, y: number }, h1?: string) {
  const o1 = h1 ? (h1 === "top" ? { x: p1.x, y: p1.y-20 } : h1 === "bottom" ? { x: p1.x, y: p1.y+20 } : h1 === "left" ? { x: p1.x-20, y: p1.y } : { x: p1.x+20, y: p1.y }) : p1;
  const pts = [p1.x, p1.y, o1.x, o1.y];
  if (h1 === "top" || h1 === "bottom") {
    pts.push(p2.x, o1.y);
  } else {
    pts.push(o1.x, p2.y);
  }
  pts.push(p2.x, p2.y);
  return pts;
}

interface TextInputOverlayProps {
  elementId: string;
  onUpdate: (id: string, text: string) => void;
  onClose: () => void;
}

export function TextInputOverlay({ elementId, onUpdate, onClose }: TextInputOverlayProps) {
  const { elements, camera } = useBoardStore();
  const element = elements.find((el) => el.id === elementId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize helper
  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      autoResize();
    }
  }, []);

  if (!element) return null;

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onUpdate(elementId, newText);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };


  // Convert element world coordinates to screen space
  // For circle/oval, x and y are the center. For others, they are the top-left.
  let x = element.x || 0;
  let y = element.y || 0;
  let w = element.width || 100;
  let h = element.height || 40;

  if (element.type === "circle" || element.type === "oval") {
    const rw = Math.abs(w) / 2;
    const rh = Math.abs(h || w) / 2;
    x -= rw;
    y -= rh;
    w = rw * 2;
    h = rh * 2;
  } else if (element.type === "arrow") {
    const { elements } = useBoardStore.getState();
    const startNode = element.startElementId ? elements.find(n => n.id === element.startElementId) : null;
    const endNode = element.endElementId ? elements.find(n => n.id === element.endElementId) : null;
    const p1 = startNode ? getHandleCoord(startNode, element.startHandle || "right") : { x: element.x || 0, y: element.y || 0 };
    const p2 = endNode ? getHandleCoord(endNode, element.endHandle || "left") : { x: element.width || element.x || 0, y: element.height || element.y || 0 };
    
    const pts = getOrthogonalPoints(p1, p2, element.startHandle);
    const mIdx = Math.floor(pts.length / 4) * 2;
    x = (pts[mIdx] + pts[mIdx+2])/2 - 50;
    y = (pts[mIdx+1] + pts[mIdx+3])/2 - 20;
    w = 100;
    h = 40;
  }

  const padding = 10;
  const isStandaloneText = element.type === "text";
  const screenX = x * camera.scale + camera.x;
  const screenY = y * camera.scale + camera.y;
  const screenW = Math.max(w * camera.scale, 160);
  const screenH = h * camera.scale;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: screenX,
        top: screenY,
        width: isStandaloneText ? Math.max(screenW, 200) : screenW,
        ...(isStandaloneText ? {} : { height: screenH }),
        display: "flex",
        alignItems: isStandaloneText ? "flex-start" : "center",
        justifyContent: "center",
        padding: isStandaloneText ? 0 : `${padding * camera.scale}px`,
      }}
    >
      <textarea
        ref={textareaRef}
        defaultValue={element.text || ""}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={autoResize}
        className="bg-transparent blur-none font-sans tracking-wide outline-none resize-none w-full pointer-events-auto"
        style={{
          textAlign: isStandaloneText ? "left" : "center",
          color: (element.type === "text" || element.type === "arrow") ? (element.textColor || element.color) : (document.documentElement.classList.contains("dark") ? "#e2e8f0" : "#1e293b"),
          fontSize: `${(element.fontSize || 16) * camera.scale}px`,
          fontWeight: element.fontBold ? "bold" : "normal",
          fontStyle: element.fontItalic ? "italic" : "normal",
          lineHeight: 1.35,
          margin: 0,
          minHeight: `${(element.fontSize || 16) * camera.scale * 1.5}px`,
          caretColor: element.textColor || element.color || "#8b5cf6",
          ...(isStandaloneText ? {
            background: "rgba(124,58,237,0.05)",
            border: "1px dashed rgba(124,58,237,0.4)",
            padding: "6px 10px",
            borderRadius: "4px",
          } : {})
        }}
      />
    </div>
  );
}
