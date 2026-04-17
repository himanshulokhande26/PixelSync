"use client";

import { useCollabStore } from "../../store/useCollabStore";
import { useBoardStore } from "../../store/useBoardStore";

// Custom SVG cursor arrow path matching reference image EXACTLY
function CursorArrow({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.4))` }} className="relative z-10">
      {/* Fat Cursor outline */}
      <path
        d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LiveCursors() {
  const { collaborators } = useCollabStore();
  const { camera } = useBoardStore();

  const collabList = Object.values(collaborators);
  if (collabList.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {collabList.map((collab) => {
        if (collab.cursorX == null || collab.cursorY == null) return null;

        // Transform world coordinates → screen coordinates
        const screenX = collab.cursorX * camera.scale + camera.x;
        const screenY = collab.cursorY * camera.scale + camera.y;

        return (
          <div
            key={collab.userId}
            className="absolute top-0 left-0"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
              transition: "transform 60ms linear",
              willChange: "transform",
            }}
          >
            {/* Custom cursor icon */}
            <CursorArrow color={collab.color} />

            {/* Name label — attaches smoothly near the tail */}
            <div
              className="absolute top-[22px] left-[14px] flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-bold text-white select-none shadow-lg z-0"
              style={{
                backgroundColor: collab.color,
                fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                letterSpacing: "0.02em",
                boxShadow: `0 2px 8px ${collab.color}55`,
                fontSize: "11px",
              }}
            >
              {collab.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
