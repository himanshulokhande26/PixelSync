// src/components/board/nodes/RectangleNode.tsx
"use client";
import { useState, useCallback } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useFlowStore } from "../../../store/useFlowStore";

export function RectangleNode({ id, data, selected }: NodeProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label as string || "Process");
  const updateNodeLabel = useFlowStore((s) => s.updateNodeLabel);

  const color = (data.color as string) || "#7c3aed";
  const textColor = (data.textColor as string) || "#ede9fe";
  const elFontSize = (data.fontSize as number) || 14;
  const elFontWeight = data.fontBold ? "bold" : "normal";
  const elFontStyle = data.fontItalic ? "italic" : "normal";
  const fill = color + "22";
  const fillHover = color + "38";
  const shadow = selected ? `0 0 0 4px ${color}44, 0 8px 32px ${color}33` : "none";

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
        minWidth: 140, minHeight: 52, padding: "10px 18px",
        borderRadius: 10,
        border: `2px solid ${color}`,
        background: selected ? fillHover : fill,
        boxShadow: shadow,
        transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s, transform 0.15s",
        cursor: "default", position: "relative",
        transform: selected ? "translateY(-1px)" : "none",
      }}
    >
      <Handle type="source" position={Position.Top}    id="top" />
      <Handle type="source" position={Position.Right}  id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left}   id="left" />

      {editing ? (
        <textarea
          autoFocus defaultValue={label} onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); }
            if (e.key === "Escape") setEditing(false);
          }}
          className="bg-transparent outline-none resize-none text-center pointer-events-auto w-full"
          style={{ fontSize: elFontSize, fontWeight: elFontWeight, fontStyle: elFontStyle, fontFamily: "Inter, sans-serif", color: textColor, lineHeight: 1.4 }}
          rows={2}
        />
      ) : (
        <span style={{ fontSize: elFontSize, fontWeight: elFontWeight, fontStyle: elFontStyle, fontFamily: "Inter, sans-serif", color: textColor, textAlign: "center", userSelect: "none", lineHeight: 1.4 }}>
          {label}
        </span>
      )}
    </div>
  );
}
