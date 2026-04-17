import { create } from "zustand";

export type Tool =
  | "select" | "pencil" | "rectangle" | "circle" | "pan" | "eraser"
  | "text" | "diamond" | "arrow" | "oval"
  | "triangle" | "star" | "hexagon";

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Element {
  id: string;
  type: "path" | "rectangle" | "circle" | "text" | "diamond" | "arrow" | "oval" | "triangle" | "star" | "hexagon";
  points?: Point[]; // For path
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  text?: string;          // For text nodes and label inside shapes
  textColor?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  startElementId?: string; // For arrows
  endElementId?: string;   // For arrows
  startHandle?: "top" | "bottom" | "left" | "right";
  endHandle?: "top" | "bottom" | "left" | "right";
}

interface BoardState {
  tool: Tool;
  elements: Element[];
  camera: { x: number; y: number; scale: number };
  setTool: (tool: Tool) => void;
  addElement: (element: Element) => void;
  updateElement: (id: string, elementData: Partial<Element>) => void;
  setElements: (elements: Element[]) => void;
  setCamera: (camera: { x: number; y: number; scale: number }) => void;
  selectedElementIds: string[];
  setSelectedElementIds: (ids: string[]) => void;
  deleteElements: (ids: string[]) => void;
  strokeColor: string;
  strokeWidth: number;
  textColor: string;
  fontSize: number;
  fontBold: boolean;
  fontItalic: boolean;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setTextColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setFontBold: (bold: boolean) => void;
  setFontItalic: (italic: boolean) => void;
  // Clipboard
  clipboard: Element[];
  copyElements: (ids: string[]) => void;
  pasteElements: () => Element[];
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  _history: Element[][];
  _historyStep: number;
}

const MAX_HISTORY = 50;

export const useBoardStore = create<BoardState>((set, get) => ({
  tool: "pencil",
  elements: [],
  camera: { x: 0, y: 0, scale: 1 },
  selectedElementIds: [],
  strokeColor: "#8b5cf6",
  strokeWidth: 4,
  textColor: "#ffffff",
  fontSize: 16,
  fontBold: false,
  fontItalic: false,
  clipboard: [],

  // History state managed within the store for easier access
  _history: [] as Element[][],
  _historyStep: -1,

  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setTextColor: (color) => set({ textColor: color }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontBold: (bold) => set({ fontBold: bold }),
  setFontItalic: (italic) => set({ fontItalic: italic }),
  setTool: (tool) => set({ tool, selectedElementIds: [] }),
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),

  copyElements: (ids) => {
    const { elements } = get();
    const copied = elements.filter((el) => ids.includes(el.id));
    set({ clipboard: copied });
  },

  pasteElements: () => {
    const { clipboard, elements } = get();
    if (!clipboard.length) return [];
    const newEls: Element[] = clipboard.map((el) => ({
      ...el,
      id: crypto.randomUUID(),
      x: (el.x || 0) + 20,
      y: (el.y || 0) + 20,
      points: el.points?.map((p) => ({ ...p, x: p.x + 20, y: p.y + 20 })),
    }));
    set({ elements: [...elements, ...newEls], selectedElementIds: newEls.map((e) => e.id) });
    get().saveHistory();
    return newEls;
  },

  deleteElements: (ids) => {
    const newState = get().elements.filter((el) => !ids.includes(el.id));
    set({ elements: newState, selectedElementIds: [] });
    get().saveHistory();
  },

  addElement: (element) =>
    set((state) => ({ elements: [...state.elements, element] })),

  setElements: (elements) => set({ elements }),

  updateElement: (id, elementData) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...elementData } : el
      ),
    })),

  setCamera: (camera) => set({ camera }),

  saveHistory: () => {
    const { elements, _history, _historyStep } = get();
    const newHistory = _history.slice(0, _historyStep + 1);
    newHistory.push([...elements]);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ _history: newHistory, _historyStep: newHistory.length - 1 } as any);
  },

  undo: () => {
    const { _history, _historyStep } = get() as any;
    if (_historyStep > 0) {
      const newStep = _historyStep - 1;
      set({ elements: _history[newStep], _historyStep: newStep } as any);
    }
  },

  redo: () => {
    const { _history, _historyStep } = get() as any;
    if (_historyStep < _history.length - 1) {
      const newStep = _historyStep + 1;
      set({ elements: _history[newStep], _historyStep: newStep } as any);
    }
  },
}));
