"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NodeShape } from "@/types/canvas";

// ---------------------------------------------------------------------------
// Drag payload
// ---------------------------------------------------------------------------

/** MIME-style key used to identify shape drag events. */
export const DRAG_PAYLOAD_KEY = "application/ghostflow-shape";

/** Data serialized into dataTransfer when the user drags a shape. */
export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Shape definitions with sensible default sizes
// ---------------------------------------------------------------------------

interface ShapeItem {
  shape: NodeShape;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
}

const SHAPE_ITEMS: ShapeItem[] = [
  {
    shape: "rectangle",
    label: "Rectangle",
    icon: RectangleHorizontal,
    width: 160,
    height: 80,
  },
  {
    shape: "diamond",
    label: "Diamond",
    icon: Diamond,
    width: 128,
    height: 128,
  },
  { shape: "circle", label: "Circle", icon: Circle, width: 80, height: 80 },
  { shape: "pill", label: "Pill", icon: Pill, width: 140, height: 60 },
  {
    shape: "cylinder",
    label: "Cylinder",
    icon: Cylinder,
    width: 80,
    height: 100,
  },
  {
    shape: "hexagon",
    label: "Hexagon",
    icon: Hexagon,
    width: 100,
    height: 100,
  },
];

// ---------------------------------------------------------------------------
// Drag-preview shape renderer
// Mirrors the node renderer: CSS for rectangle/pill/circle, SVG for the rest.
// ---------------------------------------------------------------------------

interface PreviewShapeProps {
  shape: NodeShape;
  width: number;
  height: number;
}

function PreviewShape({ shape, width: w, height: h }: PreviewShapeProps) {
  const fill = "#1F1F1F";
  const stroke = "var(--accent-primary)";
  const sw = 1.5;
  const half = sw / 2;

  // CSS shapes ----------------------------------------------------------------
  if (shape === "rectangle") {
    return (
      <div
        style={{
          width: w,
          height: h,
          backgroundColor: fill,
          border: `1.5px solid ${stroke}`,
          borderRadius: "10px",
        }}
      />
    );
  }
  if (shape === "pill") {
    return (
      <div
        style={{
          width: w,
          height: h,
          backgroundColor: fill,
          border: `1.5px solid ${stroke}`,
          borderRadius: `${h / 2}px`,
        }}
      />
    );
  }
  if (shape === "circle") {
    return (
      <div
        style={{
          width: w,
          height: h,
          backgroundColor: fill,
          border: `1.5px solid ${stroke}`,
          borderRadius: "50%",
        }}
      />
    );
  }

  // SVG shapes ----------------------------------------------------------------
  const renderSvgContent = () => {
    switch (shape) {
      case "diamond": {
        const pts = [
          `${w / 2},${half}`,
          `${w - half},${h / 2}`,
          `${w / 2},${h - half}`,
          `${half},${h / 2}`,
        ].join(" ");
        return (
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />
        );
      }
      case "cylinder": {
        const ey = Math.max(h * 0.18, 8);
        const rx = w / 2 - half;
        const body = [
          `M ${half},${ey}`,
          `L ${half},${h - ey}`,
          `A ${rx},${ey} 0 0 0 ${w - half},${h - ey}`,
          `L ${w - half},${ey}`,
          "Z",
        ].join(" ");
        return (
          <g>
            <path d={body} fill={fill} stroke={stroke} strokeWidth={sw} />
            <ellipse
              cx={w / 2}
              cy={ey}
              rx={rx}
              ry={ey}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          </g>
        );
      }
      case "hexagon": {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const px = w / 2 + (w / 2 - half) * Math.cos(angle);
          const py = h / 2 + (h / 2 - half) * Math.sin(angle);
          return `${px},${py}`;
        }).join(" ");
        return (
          <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />
        );
      }
      default:
        return null;
    }
  };

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      {renderSvgContent()}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------

interface DragState {
  shape: NodeShape;
  width: number;
  height: number;
  /** Current cursor X in viewport coordinates. */
  x: number;
  /** Current cursor Y in viewport coordinates. */
  y: number;
}

// ---------------------------------------------------------------------------
// ShapePanel
// ---------------------------------------------------------------------------

export function ShapePanel() {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // A transparent 1×1 GIF used to suppress the browser's default drag ghost.
  const emptyImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    // 1×1 transparent GIF (synchronously decoded from the data URL)
    img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    emptyImgRef.current = img;
  }, []);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-0.5 rounded-full border border-border-default bg-elevated px-2.5 py-1.5 shadow-lg">
        {SHAPE_ITEMS.map(({ shape, label, icon: Icon, width, height }) => {
          const payload: ShapeDragPayload = { shape, width, height };

          return (
            <button
              key={shape}
              title={label}
              draggable
              onDragStart={(e) => {
                // Serialize drop payload for the canvas drop handler.
                e.dataTransfer.setData(
                  DRAG_PAYLOAD_KEY,
                  JSON.stringify(payload),
                );
                e.dataTransfer.effectAllowed = "copy";

                // Suppress the browser's default drag ghost so our custom
                // preview is the only visual feedback during the drag.
                if (emptyImgRef.current) {
                  e.dataTransfer.setDragImage(emptyImgRef.current, 0, 0);
                }

                setDragState({
                  shape,
                  width,
                  height,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              onDrag={(e) => {
                // The browser fires drag events with (0, 0) when the cursor
                // leaves the window — skip those to avoid a jump to the corner.
                if (e.clientX === 0 && e.clientY === 0) return;
                setDragState((prev) =>
                  prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
                );
              }}
              onDragEnd={() => setDragState(null)}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-xl text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Drag preview — fixed overlay portal, centered on the cursor        */}
      {/* ------------------------------------------------------------------ */}
      {dragState &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: dragState.x - dragState.width / 2,
              top: dragState.y - dragState.height / 2,
              width: dragState.width,
              height: dragState.height,
              opacity: 0.72,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            <PreviewShape
              shape={dragState.shape}
              width={dragState.width}
              height={dragState.height}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
