// src/store/useFlowStore.ts
import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge, Connection } from "@xyflow/react";

const MAX_HISTORY = 50;

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  _history: Snapshot[];
  _historyStep: number;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  _history: [],
  _historyStep: -1,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    const updated = applyNodeChanges(changes, get().nodes);
    set({ nodes: updated });
    // Save to history when drag finishes
    const hasDragEnd = changes.some((c: any) => c.type === "position" && !c.dragging);
    if (hasDragEnd) get().saveHistory();
  },

  onEdgesChange: (changes) => {
    const updated = applyEdgeChanges(changes, get().edges);
    set({ edges: updated });
    // Save when edges are removed
    const hasRemove = changes.some((c: any) => c.type === "remove");
    if (hasRemove) get().saveHistory();
  },

  onConnect: (connection) => {
    const newEdges = addEdge(
      {
        ...connection,
        type: "editableSmoothStep",
        animated: false,
        style: { stroke: "#7c3aed", strokeWidth: 2 },
        markerEnd: { type: "arrowclosed" as any, color: "#7c3aed" },
      },
      get().edges
    );
    set({ edges: newEdges });
    get().saveHistory();
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
    get().saveHistory();
  },

  updateNodeLabel: (id, label) => {
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)) });
    get().saveHistory();
  },

  updateEdgeLabel: (id, label) => {
    set({ edges: get().edges.map((e) => (e.id === id ? { ...e, label } : e)) });
    get().saveHistory();
  },

  saveHistory: () => {
    const { nodes, edges, _history, _historyStep } = get();
    const trimmed = _history.slice(0, _historyStep + 1);
    trimmed.push({ nodes: [...nodes], edges: [...edges] });
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    set({ _history: trimmed, _historyStep: trimmed.length - 1 });
  },

  undo: () => {
    const { _history, _historyStep } = get();
    if (_historyStep <= 0) return;
    const newStep = _historyStep - 1;
    const snap = _history[newStep];
    set({ nodes: snap.nodes, edges: snap.edges, _historyStep: newStep });
  },

  redo: () => {
    const { _history, _historyStep } = get();
    if (_historyStep >= _history.length - 1) return;
    const newStep = _historyStep + 1;
    const snap = _history[newStep];
    set({ nodes: snap.nodes, edges: snap.edges, _historyStep: newStep });
  },
}));
