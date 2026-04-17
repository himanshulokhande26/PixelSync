// src/components/board/FlowBoard.tsx
"use client";

import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  EdgeLabelRenderer,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  MarkerType,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "../../styles/flowboard.css";

import { useCallback, useRef, useEffect, useState } from "react";
import { useFlowStore } from "../../store/useFlowStore";
import { useBoardStore } from "../../store/useBoardStore";
import { useSocket } from "../../hooks/useSocket";
import { RectangleNode } from "./nodes/RectangleNode";
import { DiamondNode }   from "./nodes/DiamondNode";
import { OvalNode }      from "./nodes/OvalNode";
import { CircleNode }    from "./nodes/CircleNode";
import { TextNode }      from "./nodes/TextNode";

// ---------------------------------------------------------------------------
// Custom edge — smooth-step with inline label editing
// ---------------------------------------------------------------------------
function EditableSmoothStepEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, label, selected, markerEnd, style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 14,
  });
  const [editing, setEditing] = useState(false);
  const [localLabel, setLocalLabel] = useState(label as string || "");
  const updateEdgeLabel = useFlowStore(s => s.updateEdgeLabel);

  useEffect(() => { setLocalLabel(label as string || ""); }, [label]);

  const commit = (val: string) => {
    setEditing(false);
    setLocalLabel(val);
    updateEdgeLabel(id, val);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all", zIndex: 10 }}
          onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
        >
          {editing ? (
            <input
              autoFocus defaultValue={localLabel}
              onBlur={e => commit(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur(); }}
              className="outline-none text-xs bg-[rgba(15,15,30,0.9)] text-purple-200 border border-purple-500/70 rounded px-2 py-1 min-w-[60px] text-center shadow-lg"
              style={{ maxWidth: 140 }}
            />
          ) : localLabel ? (
            <span className="text-xs bg-[rgba(15,15,30,0.88)] text-purple-300 border border-purple-500/30 rounded px-2 py-0.5 cursor-pointer font-medium select-none shadow">
              {localLabel}
            </span>
          ) : selected ? (
            <span className="text-[10px] text-purple-400/50 cursor-pointer whitespace-nowrap">✏ double-click to label</span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const nodeTypes = { rectangle: RectangleNode, diamond: DiamondNode, oval: OvalNode, circle: CircleNode, text: TextNode };
const edgeTypes = { editableSmoothStep: EditableSmoothStepEdge };

// ---------------------------------------------------------------------------
// FlowBoard
// ---------------------------------------------------------------------------
export function FlowBoard({ boardId, userName }: { boardId: string; userName: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, undo, redo } = useFlowStore();
  const { tool, strokeColor, textColor, fontSize, fontBold, fontItalic } = useBoardStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const hasMounted = useRef(false);

  // ONE shared socket — handles collaborators AND flowchart sync
  const { emitFlowUpdate } = useSocket(boardId, userName);

  // Emit the full flowchart state whenever it changes locally.
  // Skip the very first render (initial empty state) to avoid
  // broadcasting empty nodes before socket/DB state is loaded.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;  // Skip first emission — nodes are empty at mount
    }
    emitFlowUpdate(nodes, edges);
  }, [nodes, edges, emitFlowUpdate]);

  // ── Cursor class ─────────────────────────────────────────────────────────
  const cursorClass =
    tool === "pan"    ? "cursor-grab"    :
    tool === "select" ? "cursor-default" : "cursor-crosshair";

  // ── Place a node on canvas click ─────────────────────────────────────────
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (!["rectangle", "oval", "diamond", "circle", "text"].includes(tool)) return;
    const typeMap: Record<string, string>  = { rectangle: "rectangle", diamond: "diamond", oval: "oval", circle: "circle", text: "text" };
    const labelMap: Record<string, string> = { rectangle: "Process",   diamond: "Decision", oval: "Start / End", circle: "", text: "Type something" };
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNode({ id: crypto.randomUUID(), type: typeMap[tool] || "rectangle", position, data: { label: labelMap[tool] || "Node", color: strokeColor, textColor, fontSize, fontBold, fontItalic } });
  }, [tool, screenToFlowPosition, addNode, strokeColor, textColor, fontSize, fontBold, fontItalic]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Edge defaults ─────────────────────────────────────────────────────────
  const defaultEdgeOptions = {
    type: "editableSmoothStep",
    style: { stroke: strokeColor, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 18, height: 18 },
  };

  const panOnDrag = tool === "pan" ? true : [1, 2] as any;

  return (
    <div ref={wrapperRef} className={`w-full h-full ${cursorClass}`}>
      <div id="flow-board-export" className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: "#a78bfa", strokeWidth: 2, strokeDasharray: "7 3" }}
          snapToGrid snapGrid={[16, 16]}
          fitView fitViewOptions={{ padding: 0.25 }}
          deleteKeyCode={["Delete", "Backspace"]}
          zoomOnScroll zoomOnPinch zoomOnDoubleClick={false}
          panOnDrag={panOnDrag}
          panOnScroll={tool === "pan"}
          selectionOnDrag={tool === "select"}
          style={{ background: "transparent" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="rgba(124,58,237,0.2)" />
          <Controls position="bottom-right" style={{ marginBottom: 80 }} showInteractive />
        </ReactFlow>
      </div>
    </div>
  );
}
