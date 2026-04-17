"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Stage, Layer, Rect, Circle, Transformer, Path, Text, Arrow, Line, Group, Ellipse, RegularPolygon, Star as KonvaStar } from "react-konva";
import { getStroke } from "perfect-freehand";
import { useBoardStore, Element } from "../../store/useBoardStore";
import { useSocket } from "../../hooks/useSocket";
import { LiveCursors } from "./LiveCursors";
import { GridBackground } from "./GridBackground";
import { TextInputOverlay } from "./TextInputOverlay";

// Custom Eraser Cursor SVG (Pink Block)
const ERASER_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="2" fill="%23f472b6" stroke="white" stroke-width="2" transform="rotate(-15 16 16)"/></svg>') 16 16, auto`;

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
}

interface CanvasProps {
  boardId: string;
  userName: string;
  boardType: "canvas" | "flowchart";
}

// Compute the center of any element
function getCenterCoords(el: Element) {
  if (el.type === "circle" || el.type === "oval") return { x: el.x || 0, y: el.y || 0 };
  return {
    x: (el.x || 0) + (el.width || 0) / 2,
    y: (el.y || 0) + (el.height || 0) / 2,
  };
}

// Get coordinate for a specific handle
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

  // Rect/Diamond etc
  if (side === "top") return { x: x + w / 2, y };
  if (side === "bottom") return { x: x + w / 2, y: y + h };
  if (side === "left") return { x, y: y + h / 2 };
  if (side === "right") return { x: x + w, y: y + h / 2 };
  
  return { x, y };
}

// Orthogonal routing logic
function getOrthogonalPoints(p1: { x: number, y: number }, p2: { x: number, y: number }, h1?: string, h2?: string) {
  const offset = 20;
  let points = [p1.x, p1.y];

  const getExit = (p: any, side: any) => {
    if (side === "top") return { x: p.x, y: p.y - offset };
    if (side === "bottom") return { x: p.x, y: p.y + offset };
    if (side === "left") return { x: p.x - offset, y: p.y };
    if (side === "right") return { x: p.x + offset, y: p.y };
    return p;
  };

  const o1 = h1 ? getExit(p1, h1) : p1;
  const o2 = h2 ? getExit(p2, h2) : p2;

  // Simple elbow routing
  // 1. Move to o1
  // 2. Move to a midpoint that aligns with o2 but respects o1 direction
  if (h1 === "top" || h1 === "bottom") {
    points.push(o1.x, o1.y);
    points.push(o2.x, o1.y);
    points.push(o2.x, o2.y);
  } else {
    points.push(o1.x, o1.y);
    points.push(o1.x, o2.y);
    points.push(o2.x, o2.y);
  }

  points.push(p2.x, p2.y);
  return points;
}

export function Canvas({ boardId, userName, boardType }: CanvasProps) {
  const store = useBoardStore();
  const { tool, elements, camera, setCamera, addElement, updateElement, deleteElements, selectedElementIds, setSelectedElementIds, strokeColor, strokeWidth, textColor, fontSize, fontBold, fontItalic, copyElements, pasteElements } = store;
  const { emitDrawElement, emitUpdateElement, emitDeleteElements, emitCursorMove } = useSocket(boardId, userName);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState({ visible: false, startX: 0, startY: 0, x: 0, y: 0, width: 0, height: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  const lastClickRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard Shortcuts (Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") return;
      
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        return;
      }
      if (isMod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        store.redo();
        return;
      }
      // Copy — always read from store so we never have a stale closure
      if (isMod && e.key === "c") {
        const ids = useBoardStore.getState().selectedElementIds;
        if (ids.length > 0) {
          e.preventDefault();
          useBoardStore.getState().copyElements(ids);
        }
        return;
      }
      // Paste
      if (isMod && e.key === "v") {
        e.preventDefault();
        const newEls = useBoardStore.getState().pasteElements();
        newEls.forEach((el) => emitDrawElement(el));
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementIds.length > 0) {
        emitDeleteElements(selectedElementIds);
        deleteElements(selectedElementIds);
        return;
      }
      
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const currentElements = useBoardStore.getState().elements;
        const jump = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -jump : e.key === "ArrowRight" ? jump : 0;
        const dy = e.key === "ArrowUp" ? -jump : e.key === "ArrowDown" ? jump : 0;

        selectedElementIds.forEach((id) => {
          const el = currentElements.find(el => el.id === id);
          if (el && el.x !== undefined && el.y !== undefined) {
            const update = { x: el.x + dx, y: el.y + dy };
            updateElement(id, update);
            emitUpdateElement(id, update);
          }
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteElements, editingTextId, emitDeleteElements, emitUpdateElement, updateElement, selectedElementIds, emitDrawElement]);

  // Sync Transformer nodes
  useEffect(() => {
    if (tool === "select" && transformerRef.current && stageRef.current) {
      const nodes = selectedElementIds.map(id => stageRef.current.findOne("#" + id)).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementIds, tool, elements]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    if (e.evt.ctrlKey) {
      const scaleBy = 1.05;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      if (newScale < 0.1 || newScale > 5) return;
      setCamera({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale, scale: newScale });
    } else {
      setCamera({ x: camera.x - e.evt.deltaX, y: camera.y - e.evt.deltaY, scale: camera.scale });
    }
  }, [camera, setCamera]);

  const getElementUnderPointer = (x: number, y: number) => {
    return [...elements].reverse().find(el => {
      const elX = el.x || 0, elY = el.y || 0;
      if (el.type === "circle" || el.type === "oval") {
        const rx = Math.abs(el.width || 0) / 2;
        const ry = Math.abs(el.height || el.width || 0) / 2;
        const dx = (x - elX) / rx;
        const dy = (y - elY) / ry;
        return (dx * dx + dy * dy) <= 1;
      }
      return x >= elX && x <= elX + (el.width || 0) && y >= elY && y <= elY + (el.height || 0);
    });
  };

  const handlePointerDown = (e: any) => {
    if (tool === "pan" || editingTextId) return;
    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();
    const clickedOnEmpty = e.target === stage || e.target.hasName("grid-layer");

    // ── Robust Double-Click Detection ──────────────────────────────────────
    const now = Date.now();
    const last = lastClickRef.current;
    if (clickedOnEmpty && now - last.time < 350 && Math.abs(pos.x - last.x) < 15 && Math.abs(pos.y - last.y) < 15) {
      e.cancelBubble = true;
      const { strokeColor, strokeWidth, textColor, fontSize, fontBold, fontItalic } = useBoardStore.getState();
      const textId = crypto.randomUUID();
      const newEl: Element = {
        id: textId, type: "text",
        x: pos.x, y: pos.y, width: 200, height: 0,
        color: strokeColor, strokeWidth,
        textColor, fontSize, fontBold, fontItalic,
        text: ""
      };
      
      // Clean up stray element created by the first click of this double-click
      if (activeElementId) {
        deleteElements([activeElementId]);
        emitDeleteElements([activeElementId]);
        setActiveElementId(null);
      }
      
      addElement(newEl);
      emitDrawElement(newEl);
      setEditingTextId(textId);
      setIsDrawing(false);
      setSelectionBox({ ...selectionBox, visible: false });
      setSelectedElementIds([textId]);
      lastClickRef.current = { time: 0, x: 0, y: 0 };
      return;
    }
    lastClickRef.current = { time: now, x: pos.x, y: pos.y };

    if (tool === "select") {
      if (clickedOnEmpty) {
        setSelectedElementIds([]);
        setSelectionBox({ visible: true, startX: pos.x, startY: pos.y, x: pos.x, y: pos.y, width: 0, height: 0 });
      } else {
        // clicking on a shape while in select mode - will be handled by element's onClick
      }
      return;
    }

    const id = crypto.randomUUID();

    if (tool === "pencil") {
      const newEl: Element = { id, type: "path", points: [{ x: pos.x, y: pos.y, pressure: e.evt.pressure || 0.5 }], color: strokeColor, strokeWidth };
      addElement(newEl);
      emitDrawElement(newEl);
      setActiveElementId(id);
      setIsDrawing(true);
    } 
    else if (tool === "rectangle" || tool === "circle" || tool === "diamond" || tool === "text" || tool === "oval" || tool === "triangle" || tool === "star" || tool === "hexagon") {
      const isRadialNew = ["circle", "oval", "triangle", "star", "hexagon"].includes(tool);
      const newEl: Element = {
        id, type: tool,
        x: pos.x, y: pos.y,
        width: tool === "text" ? 160 : (tool === "oval" ? 120 : 0),
        height: tool === "text" ? 40 : (tool === "oval" ? 70 : 0),
        color: strokeColor, strokeWidth,
        textColor, fontSize, fontBold, fontItalic,
        text: tool === "text" ? "" : undefined
      };
      addElement(newEl);
      setActiveElementId(id);
      setIsDrawing(true);
      
      if (tool === "text") {
        setIsDrawing(false);
        setSelectedElementIds([id]);
        setEditingTextId(id);
        emitDrawElement(newEl);
      }
    }
  };

  // Double-click is now robustly handled inside handlePointerDown!
  const handleDblClick = (e: any) => {
    // Left empty because manual double-click detection is better for pointer events.
  };

  const startNodeArrow = (e: any, sourceId: string, side: "top" | "bottom" | "left" | "right") => {
    e.cancelBubble = true;
    const id = crypto.randomUUID();
    const pos = e.target.getStage().getRelativePointerPosition();
    const newEl: Element = {
      id, type: "arrow",
      x: pos.x, y: pos.y, width: pos.x, height: pos.y,
      color: strokeColor, strokeWidth,
      startElementId: sourceId,
      startHandle: side
    };
    addElement(newEl);
    setActiveElementId(id);
    setIsDrawing(true);
    setSelectedElementIds([]);
  };

  const handlePointerMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();
    emitCursorMove(pos.x, pos.y);

    const hovered = getElementUnderPointer(pos.x, pos.y);
    setHoveredElementId(hovered?.id || null);

    if (selectionBox.visible) {
      setSelectionBox({
        ...selectionBox,
        x: Math.min(pos.x, selectionBox.startX),
        y: Math.min(pos.y, selectionBox.startY),
        width: Math.abs(pos.x - selectionBox.startX),
        height: Math.abs(pos.y - selectionBox.startY),
      });
      return;
    }

    if (!isDrawing || !activeElementId) return;
    const activeElement = elements.find((el) => el.id === activeElementId);
    if (!activeElement) return;

    if (tool === "pencil" && activeElement.points) {
      const newPoints = [...activeElement.points, { x: pos.x, y: pos.y, pressure: e.evt.pressure || 0.5 }];
      updateElement(activeElementId, { points: newPoints });
      emitUpdateElement(activeElementId, { points: newPoints });
    } 
    else if (activeElement.type === "arrow") {
      const update = { width: pos.x, height: pos.y };
      updateElement(activeElementId, update);
      emitUpdateElement(activeElementId, update);
    }
    else if (activeElement.x !== undefined && activeElement.y !== undefined) {
      const update = { width: pos.x - activeElement.x, height: pos.y - activeElement.y };
      updateElement(activeElementId, update);
      emitUpdateElement(activeElementId, update);
    }
  };

  const handlePointerUp = (e: any) => {
    if (selectionBox.visible) {
      const selBox = { left: selectionBox.x, right: selectionBox.x + selectionBox.width, top: selectionBox.y, bottom: selectionBox.y + selectionBox.height };
      const newSelections = elements.filter(el => {
        const elLeft = el.id.startsWith("temp") ? 0 : (el.x || 0), elTop = el.y || 0;
        const elRight = elLeft + Math.max(el.width || 0, 50), elBottom = elTop + Math.max(el.height || 0, 50);
        return !(elRight < selBox.left || elLeft > selBox.right || elBottom < selBox.top || elTop > selBox.bottom);
      }).map(el => el.id);
      setSelectedElementIds(newSelections);
      setSelectionBox({ ...selectionBox, visible: false });
    }

    if (isDrawing && activeElementId) {
      const finalElement = elements.find(el => el.id === activeElementId);
      if (finalElement) {
        if (finalElement.type === "arrow") {
          const pos = e.target.getStage().getRelativePointerPosition();
          const target = getElementUnderPointer(pos.x, pos.y);
          if (target && target.id !== finalElement.startElementId) {
            // Find nearest handle on target
            const handles: ("top" | "bottom" | "left" | "right")[] = ["top", "bottom", "left", "right"];
            let minHooks = handles.map(h => ({ handle: h, coord: getHandleCoord(target, h) }));
            let bestH = minHooks.sort((a, b) => Math.hypot(a.coord.x - pos.x, a.coord.y - pos.y) - Math.hypot(b.coord.x - pos.x, b.coord.y - pos.y))[0].handle;

            updateElement(activeElementId, { endElementId: target.id, endHandle: bestH, width: undefined, height: undefined });
            finalElement.endElementId = target.id; 
            finalElement.endHandle = bestH;
            finalElement.width = undefined;
            finalElement.height = undefined;
          }
        }
        emitDrawElement(finalElement);
      }
    }
    setIsDrawing(false);
    setActiveElementId(null);
    if (isDrawing) store.saveHistory();
  };

  const getInteractiveProps = (el: Element) => ({
    id: el.id,
    draggable: tool === "select" && selectedElementIds.includes(el.id),
    onPointerDown: (e: any) => {
      if (tool === "eraser") {
        e.cancelBubble = true;
        emitDeleteElements([el.id]);
        deleteElements([el.id]);
        return;
      }
      if (tool === "text") {
        setEditingTextId(el.id);
      }
    },
    onPointerEnter: (e: any) => {
      if (tool === "eraser" && e.evt.buttons === 1) {
        emitDeleteElements([el.id]);
        deleteElements([el.id]);
      }
    },
    onClick: (e: any) => {
      if (tool === "select") {
        if (e.evt.shiftKey) {
          const isSelected = selectedElementIds.includes(el.id);
          setSelectedElementIds(isSelected ? selectedElementIds.filter(id => id !== el.id) : [...selectedElementIds, el.id]);
        }
        else setSelectedElementIds([el.id]);
      }
    },
    onDblClick: () => {
      if (["rectangle", "circle", "diamond", "text", "oval"].includes(el.type)) {
        setEditingTextId(el.id);
      }
      if (el.type === "arrow") {
        setEditingTextId(el.id);
      }
    },
    onDragEnd: (e: any) => {
      const update = { x: e.target.x(), y: e.target.y() };
      updateElement(el.id, update);
      emitUpdateElement(el.id, update);
      store.saveHistory();
    },
    onTransformEnd: (e: any) => {
      const node = e.target;
      const scaleX = node.scaleX(), scaleY = node.scaleY();
      node.scaleX(1); node.scaleY(1);
      const update = { x: node.x(), y: node.y(), width: Math.max(5, (el.width || 0) * scaleX), height: Math.max(5, (el.height || 0) * scaleY) };
      updateElement(el.id, update);
      emitUpdateElement(el.id, update);
      store.saveHistory();
    }
  });

  if (windowSize.width === 0) return null;

  return (
    <div id="canvas-board-export" className="relative w-full h-full">
      <Stage
        ref={stageRef}
        width={windowSize.width}
        height={windowSize.height}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDblClick={handleDblClick}
        draggable={tool === "pan"}
        style={{ cursor: tool === "eraser" ? ERASER_CURSOR : tool === "pan" ? "grab" : tool === "select" ? "default" : tool === "text" ? "text" : "crosshair" }}
      >
        <GridBackground camera={camera} width={windowSize.width} height={windowSize.height} type={boardType} />
        
        <Layer name="grid-layer">
          {elements.map((el) => {
            const props = getInteractiveProps(el);
            const isHovered = hoveredElementId === el.id;
            const isSelected = selectedElementIds.includes(el.id);
            const fillTint = (isHovered && tool === "select") ? el.color + "4D" : el.color + "33"; 
            
            const isRadial = el.type === "circle" || el.type === "oval" || el.type === "triangle" || el.type === "hexagon" || el.type === "star";
            const labelX = isRadial ? (el.x || 0) - (Math.abs(el.width || 0) / 2) : (el.x || 0);
            const labelY = isRadial ? (el.y || 0) - (Math.abs(el.height || (el.width || 0)) / 2) : (el.y || 0);
            const labelW = Math.abs(el.width || 0) || 60;
            const labelH = Math.abs(el.height || (el.width || 0)) || 30;

            const elFontSize = el.fontSize || 16;
            const elFontStyle = el.fontBold && el.fontItalic ? "bold italic" : el.fontBold ? "bold" : el.fontItalic ? "italic" : "normal";
            const elTextColor = el.type === "text"
              ? (el.textColor || el.color)
              : (el.textColor || (document.documentElement.classList.contains("dark") ? "#fff" : "#1e293b"));

            const LabelGroup = (
              el.text ? (
                <Text
                  x={labelX} y={labelY}
                  width={labelW} height={el.type === "text" ? undefined : labelH}
                  text={el.text}
                  fontSize={elFontSize}
                  fontStyle={elFontStyle}
                  fill={elTextColor}
                  align="center"
                  verticalAlign={el.type === "text" ? "top" : "middle"}
                  fontFamily="Inter, sans-serif"
                  padding={el.type === "text" ? 6 : 10}
                  listening={false}
                  wrap="word"
                />
              ) : null
            );

            if (el.type === "path" && el.points) {
              const strPoints = getStroke(el.points.map(p => [p.x, p.y, p.pressure || 0.5]), { size: el.strokeWidth * 2, thinning: 0.5, streamline: 0.5 });
              return <Path key={el.id} {...props} x={el.x || 0} y={el.y || 0} data={getSvgPathFromStroke(strPoints)} fill={el.color} hitStrokeWidth={Math.max(el.strokeWidth * 2, 20)} />;
            }
            if (el.type === "rectangle") return (
              <React.Fragment key={el.id}>
                <Rect {...props} x={el.x} y={el.y} width={el.width} height={el.height} stroke={el.color} strokeWidth={el.strokeWidth} cornerRadius={6} fill={fillTint} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                {LabelGroup}
              </React.Fragment>
            );
            if (el.type === "circle") return (
              <React.Fragment key={el.id}>
                <Circle {...props} x={el.x} y={el.y} radius={Math.abs(el.width || 0) / 2} scaleY={el.height ? (el.height / (el.width || 1)) : 1} stroke={el.color} strokeWidth={el.strokeWidth} fill={fillTint} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                {LabelGroup}
              </React.Fragment>
            );
            if (el.type === "oval") return (
              <React.Fragment key={el.id}>
                <Ellipse {...props} x={el.x} y={el.y} radiusX={Math.abs(el.width || 0) / 2} radiusY={Math.abs(el.height || 0) / 2} stroke={el.color} strokeWidth={el.strokeWidth} fill={fillTint} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                {LabelGroup}
              </React.Fragment>
            );
            if (el.type === "diamond") {
              const w=el.width||0, h=el.height||0;
              return (
                <React.Fragment key={el.id}>
                  <Line {...props} x={el.x} y={el.y} points={[w/2, 0, w, h/2, w/2, h, 0, h/2]} closed stroke={el.color} strokeWidth={el.strokeWidth} fill={fillTint} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                  {LabelGroup}
                </React.Fragment>
              );
            }
            if (el.type === "text") return (
               <React.Fragment key={el.id}>
                 <Rect {...props} x={el.x} y={el.y} width={Math.max(el.width || 0, 60)} height={Math.max(el.height || 0, 30)} fill="transparent" hitStrokeWidth={20} />
                 {LabelGroup}
               </React.Fragment>
            );
            // ── New shapes ────────────────────────────────────────────────
            if (el.type === "triangle") {
              const r = Math.abs(el.width || 60) / 2;
              return (
                <React.Fragment key={el.id}>
                  <RegularPolygon {...props} x={el.x} y={el.y} sides={3} radius={r} stroke={el.color} strokeWidth={el.strokeWidth} fill={fillTint} rotation={0} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                  {LabelGroup}
                </React.Fragment>
              );
            }
            if (el.type === "hexagon") {
              const r = Math.abs(el.width || 60) / 2;
              return (
                <React.Fragment key={el.id}>
                  <RegularPolygon {...props} x={el.x} y={el.y} sides={6} radius={r} stroke={el.color} strokeWidth={el.strokeWidth} fill={fillTint} rotation={0} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                  {LabelGroup}
                </React.Fragment>
              );
            }
            if (el.type === "star") {
              const r = Math.abs(el.width || 60) / 2;
              return (
                <React.Fragment key={el.id}>
                  <KonvaStar {...props} x={el.x} y={el.y} numPoints={5} outerRadius={r} innerRadius={r * 0.45} stroke={el.color} strokeWidth={el.strokeWidth} fill={fillTint} shadowBlur={isSelected || isHovered ? 10 : 0} shadowColor={el.color} hitStrokeWidth={20} />
                  {LabelGroup}
                </React.Fragment>
              );
            }
            if (el.type === "arrow") {
              let pts = [];
              let midPoint = { x: 0, y: 0 };

              if (el.startElementId && el.endElementId) {
                const startNode = elements.find(n => n.id === el.startElementId);
                const endNode = elements.find(n => n.id === el.endElementId);
                if (startNode && endNode) {
                  const p1 = getHandleCoord(startNode, el.startHandle || "right");
                  const p2 = getHandleCoord(endNode, el.endHandle || "left");
                  pts = getOrthogonalPoints(p1, p2, el.startHandle, el.endHandle);
                }
              } else {
                const startNode = el.startElementId ? elements.find(n => n.id === el.startElementId) : null;
                const p1 = startNode ? getHandleCoord(startNode, el.startHandle || "right") : { x: el.x || 0, y: el.y || 0 };
                const p2 = { x: el.width || el.x || 0, y: el.height || el.y || 0 };
                pts = getOrthogonalPoints(p1, p2, el.startHandle);
              }

              if (pts.length >= 4) {
                // midpoint for text
                const mIdx = Math.floor(pts.length / 4) * 2;
                midPoint = { x: (pts[mIdx] + pts[mIdx+2])/2, y: (pts[mIdx+1] + pts[mIdx+3])/2 };

                return (
                  <Group key={el.id} {...props}>
                    <Line
                      points={pts}
                      stroke={el.color}
                      strokeWidth={el.strokeWidth}
                      lineCap="round"
                      lineJoin="round"
                    />
                    <Arrow
                      points={[pts[pts.length-4], pts[pts.length-3], pts[pts.length-2], pts[pts.length-1]]}
                      stroke={el.color}
                      fill={el.color}
                      strokeWidth={el.strokeWidth}
                      pointerLength={12}
                      pointerWidth={10}
                    />
                    {el.text && (
                      <Group x={midPoint.x - 50} y={midPoint.y - 20}>
                        <Rect width={100} height={40} fill={document.documentElement.classList.contains("dark") ? "#000" : "#fff"} cornerRadius={4} stroke={el.color} strokeWidth={1} />
                        <Text width={100} height={40} text={el.text} align="center" verticalAlign="middle" fill={el.color} />
                      </Group>
                    )}
                  </Group>
                );
              }
            }
            return null;
          })}

          {/* Render Connection Handles for purely selected shape */}
          {selectedElementIds.length === 1 && !isDrawing && tool === "select" && (() => {
            const el = elements.find(e => e.id === selectedElementIds[0]);
            if (!el || !['rectangle', 'circle', 'diamond', 'oval'].includes(el.type)) return null;
            const w = el.width || 0, h = el.height || 0;
            const cx = (el.type === "circle" || el.type === "oval") ? (el.x || 0) : (el.x || 0) + w / 2;
            const cy = (el.type === "circle" || el.type === "oval") ? (el.y || 0) : (el.y || 0) + h / 2;
            const radius = 6;
            
            const coords = [
              { h: "top",    x: cx, y: (el.type === "circle" || el.type === "oval" ? cy - h/2 - 10 : (el.y || 0) - 16) },
              { h: "bottom", x: cx, y: (el.type === "circle" || el.type === "oval" ? cy + h/2 + 10 : (el.y || 0) + h + 16) },
              { h: "left",   x: (el.type === "circle" || el.type === "oval" ? cx - w/2 - 10 : (el.x || 0) - 16), y: cy },
              { h: "right",  x: (el.type === "circle" || el.type === "oval" ? cx + w/2 + 10 : (el.x || 0) + w + 16), y: cy },
            ];

            return (
              <Group>
                {coords.map(c => (
                  <Circle key={c.h} x={c.x} y={c.y} radius={radius} fill="#3b82f6" stroke="#fff" strokeWidth={1.5} onPointerDown={(e) => startNodeArrow(e, el.id, c.h as any)} onMouseEnter={e => e.target.scale({x:1.3, y:1.3})} onMouseLeave={e => e.target.scale({x:1, y:1})} />
                ))}
              </Group>
            );
          })()}

          {/* Selection Drag Box */}
          {selectionBox.visible && <Rect x={selectionBox.x} y={selectionBox.y} width={selectionBox.width} height={selectionBox.height} fill="rgba(124, 58, 237, 0.1)" stroke="#7c3aed" strokeWidth={1} dash={[4, 4]} />}

          {/* Multi-Select Transformer */}
          {tool === "select" && <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />}
        </Layer>
      </Stage>

      {/* Inline Text Editor */}
      {editingTextId && (
        <TextInputOverlay 
          elementId={editingTextId} 
          onUpdate={(id, text) => {
            updateElement(id, { text });
            emitUpdateElement(id, { text });
            store.saveHistory();
          }}
          onClose={() => setEditingTextId(null)} 
        />
      )}

      {/* Live Cursors */}
      <LiveCursors />
    </div>
  );
}
