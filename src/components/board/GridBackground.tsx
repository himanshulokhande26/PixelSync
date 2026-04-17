"use client";

import { useEffect, useRef } from "react";
import { Layer } from "react-konva";
import Konva from "konva";

interface GridBackgroundProps {
  camera: { x: number; y: number; scale: number };
  width: number;
  height: number;
  type: "canvas" | "flowchart";
}

const BASE_STEP = 40; // world units between grid lines

export function GridBackground({ camera, width, height, type }: GridBackgroundProps) {
  const layerRef = useRef<any>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.destroyChildren();

    const { x: camX, y: camY, scale } = camera;

    // Compute how many world units are visible at current zoom
    // World bounds = screen coords transformed back to world space
    const worldLeft   = -camX / scale;
    const worldTop    = -camY / scale;
    const worldRight  = (width  - camX) / scale;
    const worldBottom = (height - camY) / scale;

    // Adaptive step: increase spacing when zoomed out to prevent overcrowding
    let step = BASE_STEP;
    if (scale < 0.4)  step = BASE_STEP * 4;
    else if (scale < 0.7) step = BASE_STEP * 2;

    // Snap start positions to grid
    const startX = Math.floor(worldLeft  / step) * step;
    const startY = Math.floor(worldTop   / step) * step;

    // Vertical lines
    for (let x = startX; x <= worldRight; x += step) {
      layer.add(new Konva.Line({
        points: [x, worldTop, x, worldBottom],
        stroke: "#94a3b8",
        strokeWidth: 0.5 / scale, // Keep stroke width constant regardless of zoom
        opacity: 0.3,
        listening: false,
      }));
    }

    // Horizontal lines
    for (let y = startY; y <= worldBottom; y += step) {
      layer.add(new Konva.Line({
        points: [worldLeft, y, worldRight, y],
        stroke: "#94a3b8",
        strokeWidth: 0.5 / scale,
        opacity: 0.3,
        listening: false,
      }));
    }

    layer.batchDraw();
  }, [camera, width, height, type]);

  return <Layer ref={layerRef} listening={false} />;
}
