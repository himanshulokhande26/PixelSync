// src/hooks/useExport.ts
// Export the board as PNG or SVG
import { useCallback } from "react";
import { toPng, toSvg } from "html-to-image";

export function useExport() {
  const exportAs = useCallback(async (
    format: "png" | "svg",
    elementId: string,
    filename: string = "pixelsync-board"
  ) => {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error("Export target not found:", elementId);
      return;
    }

    try {
      let dataUrl: string;
      const opts = {
        quality: 1,
        pixelRatio: 2, // Retina-quality output
        backgroundColor: "#050505",
        style: { borderRadius: "0px" },
      };

      if (format === "png") {
        dataUrl = await toPng(el, opts);
      } else {
        dataUrl = await toSvg(el, opts);
      }

      const link = document.createElement("a");
      link.download = `${filename}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, []);

  const exportCanvas = useCallback(async (
    stage: any, // Konva Stage
    filename: string = "pixelsync-canvas"
  ) => {
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  return { exportAs, exportCanvas };
}
