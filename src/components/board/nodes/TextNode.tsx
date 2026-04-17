// src/components/board/nodes/TextNode.tsx
"use client";
import { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useFlowStore } from "../../../store/useFlowStore";

export function TextNode({ id, data, selected }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label as string || "Text");
  const updateNodeLabel = useFlowStore((s) => s.updateNodeLabel);

  const color = (data.color as string) || "#ede9fe";
  // Subdued selection box (a light outline since text has no clear boundary)
  const shadow = selected ? `0 0 0 2px ${color}55` : "none";

  const onDoubleClick = useCallback(() => setEditing(true), []);
  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setEditing(false);
      setLabel(e.target.value);
      updateNodeLabel(id, e.target.value);
    },
    [id, updateNodeLabel]
  );

  return (
    <div
      onDoubleClick={onDoubleClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minWidth: 100, minHeight: 40, padding: "8px 12px",
        borderRadius: 6,
        background: selected ? "rgba(255, 255, 255, 0.03)" : "transparent",
        boxShadow: shadow,
        transition: "box-shadow 0.2s, background 0.2s, transform 0.15s",
        cursor: "text", position: "relative",
        transform: selected ? "translateY(-1px)" : "none",
      }}
    >
      <Handle type="source" position={Position.Top}    id="top"    style={{ opacity: selected ? 1 : 0, transition: 'opacity 0.2s' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ opacity: selected ? 1 : 0, transition: 'opacity 0.2s' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: selected ? 1 : 0, transition: 'opacity 0.2s' }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ opacity: selected ? 1 : 0, transition: 'opacity 0.2s' }} />

      {editing ? (
        <textarea
          autoFocus defaultValue={label} onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
            if (e.key === "Escape") setEditing(false);
          }}
          className="bg-transparent outline-none resize-none text-center pointer-events-auto w-full"
          style={{ fontSize: 16, fontFamily: "Inter, sans-serif", color: color, fontWeight: 600, lineHeight: 1.4 }}
          rows={Math.max(1, label.split("\n").length)}
        />
      ) : (
        <span style={{ fontSize: 16, fontFamily: "Inter, sans-serif", color: color, fontWeight: 600, textAlign: "center", userSelect: "none", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
          {label}
        </span>
      )}
    </div>
  );
}
