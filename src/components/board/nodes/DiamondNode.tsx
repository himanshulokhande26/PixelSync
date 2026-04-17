// src/components/board/nodes/DiamondNode.tsx
"use client";
import { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useFlowStore } from "../../../store/useFlowStore";

// Fixed dimensions – must match the SVG viewBox exactly
const W = 140;
const H = 90;

// Diamond polygon vertex coords (with 4px inset from SVG edge)
const TOP    = { x: W / 2,   y: 4         }; // top vertex
const RIGHT  = { x: W - 4,   y: H / 2     }; // right vertex
const BOTTOM = { x: W / 2,   y: H - 4     }; // bottom vertex
const LEFT   = { x: 4,       y: H / 2     }; // left vertex

// Converts absolute SVG pixel coords to the CSS percentage+translate style
// that React Flow needs for precisely-placed handles
function handleStyle(pt: { x: number; y: number }) {
  return {
    position: "absolute" as const,
    left: pt.x,
    top:  pt.y,
    transform: "translate(-50%, -50%)",
    // React Flow reads these to detect connection source/target
    background: "#7c3aed",
    border: "2px solid #fff",
    width: 10,
    height: 10,
    borderRadius: "50%",
    opacity: 0,           // controlled by CSS hover/selected
    transition: "opacity 0.2s, transform 0.15s",
    cursor: "crosshair",
    zIndex: 10,
  };
}

export function DiamondNode({ id, data, selected }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(data.label as string || "Decision");
  const updateNodeLabel       = useFlowStore((s) => s.updateNodeLabel);

  const color       = (data.color as string) || "#7c3aed";
  const textColor   = (data.textColor as string) || "#ede9fe";
  const borderColor = selected ? color + "cc" : color;
  const fillColor   = selected ? color + "30" : color + "1a";

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setEditing(false);
      const v = e.target.value;
      setLabel(v);
      updateNodeLabel(id, v);
    },
    [id, updateNodeLabel]
  );

  return (
    <div
      style={{ width: W, height: H, position: "relative" }}
      className={selected ? "rf-diamond-selected" : ""}
      onDoubleClick={onDoubleClick}
    >
      {/* ── Perfect SVG diamond ── */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
      >
        <polygon
          points={`${TOP.x},${TOP.y} ${RIGHT.x},${RIGHT.y} ${BOTTOM.x},${BOTTOM.y} ${LEFT.x},${LEFT.y}`}
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={2}
          style={{
            transition: "fill 0.2s, stroke 0.2s",
            filter: selected ? `drop-shadow(0 0 8px ${color}88)` : "none",
          }}
        />
      </svg>

      {/* ── Label / editor ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 22px",
          zIndex: 1,
        }}
      >
        {editing ? (
          <textarea
            autoFocus
            defaultValue={label}
            onBlur={onBlur}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            className="bg-transparent outline-none resize-none text-center pointer-events-auto w-full"
            style={{
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              color: textColor,
              lineHeight: 1.4,
            }}
            rows={2}
          />
        ) : (
          <span
            style={{
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              color: textColor,
              textAlign: "center",
              userSelect: "none",
              lineHeight: 1.3,
              pointerEvents: "none",
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* ── Handles placed EXACTLY at each diamond vertex ── */}
      {/* React Flow's built-in Position enum only matters for the connection
          direction; the actual visual position is controlled by our style prop */}

      {/* TOP vertex */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        style={handleStyle(TOP)}
      />

      {/* RIGHT vertex */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={handleStyle(RIGHT)}
      />

      {/* BOTTOM vertex */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={handleStyle(BOTTOM)}
      />

      {/* LEFT vertex */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        style={handleStyle(LEFT)}
      />
    </div>
  );
}
