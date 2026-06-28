"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ComponentType,
} from "react";
import { Handle, Position, NodeResizer, useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { NodeColorToolbar } from "./node-color-toolbar";

// ---------------------------------------------------------------------------
// SVG geometry — only for complex shapes that cannot be expressed with CSS.
// Rectangle, pill, and circle use CSS borders + border-radius instead.
// ---------------------------------------------------------------------------

interface SvgShapeGeometryProps {
  shape: "diamond" | "hexagon" | "cylinder";
  w: number;
  h: number;
  fill: string;
  stroke: string;
}

function SvgShapeGeometry({
  shape,
  w,
  h,
  fill,
  stroke,
}: SvgShapeGeometryProps) {
  const sw = 1.5; // stroke width
  const half = sw / 2;

  switch (shape) {
    // -- Diamond (rotated square) -------------------------------------------
    case "diamond": {
      const pts = [
        `${w / 2},${half}`, // top
        `${w - half},${h / 2}`, // right
        `${w / 2},${h - half}`, // bottom
        `${half},${h / 2}`, // left
      ].join(" ");
      return (
        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />
      );
    }

    // -- Cylinder -------------------------------------------------------------
    // Body: two vertical lines + bottom arc; top ellipse cap drawn on top.
    case "cylinder": {
      const ey = Math.max(h * 0.18, 8); // ellipse y-radius for top/bottom caps
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
          {/* cylinder body */}
          <path d={body} fill={fill} stroke={stroke} strokeWidth={sw} />
          {/* top ellipse cap — drawn last so it sits on top */}
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

    // -- Hexagon (pointy-top) ------------------------------------------------
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
  }
}

// ---------------------------------------------------------------------------
// Minimum node dimensions per shape
// ---------------------------------------------------------------------------

function getMinDimensions(shape: string): {
  minWidth: number;
  minHeight: number;
} {
  switch (shape) {
    case "circle":
      return { minWidth: 60, minHeight: 60 };
    case "diamond":
      return { minWidth: 80, minHeight: 80 };
    default:
      return { minWidth: 80, minHeight: 40 };
  }
}

// ---------------------------------------------------------------------------
// Node renderer
// ---------------------------------------------------------------------------

export function CanvasNodeComponent({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const w = width ?? 160;
  const h = height ?? 80;
  const shape = data.shape ?? "rectangle";
  const colorPair =
    NODE_COLORS.find((c) => c.fill === data.color) ?? NODE_COLORS[0];

  // Subtle border at rest; vivid accent border when selected.
  const strokeColor = selected
    ? "var(--accent-primary)"
    : "var(--border-subtle)";

  // CSS shapes: rectangle, pill, circle — expressed through border-radius only.
  const isCssShape =
    shape === "rectangle" || shape === "pill" || shape === "circle";

  const cssRadius =
    shape === "circle" ? "50%" : shape === "pill" ? `${h / 2}px` : "10px"; // rectangle

  // -------------------------------------------------------------------------
  // Inline label editing
  // -------------------------------------------------------------------------

  const [isEditing, setIsEditing] = useState(false);
  // contenteditable div ref — text is set via DOM so React never resets the
  // cursor position on re-renders triggered by Liveblocks label syncs.
  const editRef = useRef<HTMLDivElement>(null);
  const { updateNodeData } = useReactFlow<CanvasNode>();

  // When editing starts: initialise DOM text content and move cursor to end.
  // data.label is intentionally excluded from deps — we only want to seed the
  // editor once when it opens, not on every collaborative update.
  useEffect(() => {
    if (!isEditing || !editRef.current) return;
    const el = editRef.current;
    el.textContent = data.label;
    el.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    if (sel) {
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      updateNodeData(id, { label: e.currentTarget.textContent ?? "" });
    },
    [id, updateNodeData],
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stopEditing();
      }
      // Prevent React Flow keyboard shortcuts from firing while typing.
      e.stopPropagation();
    },
    [stopEditing],
  );

  // -------------------------------------------------------------------------
  // Resize min dimensions
  // -------------------------------------------------------------------------

  const { minWidth, minHeight } = getMinDimensions(shape);

  return (
    <div style={{ width: w, height: h }} className="group relative select-none">
      {/*
        Color toolbar — floats above the node via NodeToolbar portal.
        Only visible when the node is selected.
      */}
      <NodeColorToolbar
        nodeId={id}
        activeFill={colorPair.fill}
        selected={selected}
      />

      {/*
        Resize handles — rendered by @xyflow/react's NodeResizer.
        Only visible when the node is selected. Changes flow through
        onNodesChange, which Liveblocks intercepts and syncs to all
        collaborators.
      */}
      <NodeResizer
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        handleStyle={{
          width: 8,
          height: 8,
          backgroundColor: "var(--bg-elevated)",
          border: "1.5px solid var(--accent-primary)",
          borderRadius: "2px",
          zIndex: 10,
        }}
        lineStyle={{ border: "none" }}
      />

      {/*
        All 4 handles use type="source" with unique IDs.
        ConnectionMode.Loose (set on <ReactFlow>) lets any handle connect to
        any other handle, so the user's drag direction fully controls which
        end is source and which is target — no forced topology.
      {/*
        Each side has paired source + target handles so connections can be
        initiated AND received from any direction. ConnectionMode.Loose on
        the canvas allows any handle to connect to any other handle. Both
        handles at each position are co-located visually (React Flow stacks
        them at the same anchor point).
      */}
      {(["Top", "Right", "Bottom", "Left"] as const).map((pos) => (
        <Handle
          key={`source-${pos}`}
          type="source"
          position={Position[pos]}
          id={`${pos.toLowerCase()}-source`}
          className="!w-2.5 !h-2.5 !min-w-0 !min-h-0 !bg-white !border-2 !border-surface !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        />
      ))}
      {(["Top", "Right", "Bottom", "Left"] as const).map((pos) => (
        <Handle
          key={`target-${pos}`}
          type="target"
          position={Position[pos]}
          id={`${pos.toLowerCase()}-target`}
          className="!w-2.5 !h-2.5 !min-w-0 !min-h-0 !bg-white !border-2 !border-surface !rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        />
      ))}

      {isCssShape ? (
        /* CSS-styled shapes — rectangle, pill, circle */
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: colorPair.fill,
            border: `1.5px solid ${strokeColor}`,
            borderRadius: cssRadius,
            pointerEvents: "none",
          }}
        />
      ) : (
        /* SVG shapes — diamond, hexagon, cylinder; scale with node dimensions */
        <svg
          width={w}
          height={h}
          className="absolute inset-0"
          style={{ pointerEvents: "none", overflow: "visible" }}
        >
          <SvgShapeGeometry
            shape={shape as "diamond" | "hexagon" | "cylinder"}
            w={w}
            h={h}
            fill={colorPair.fill}
            stroke={strokeColor}
          />
        </svg>
      )}

      {/*
        Label area.
        - Double-click opens inline editing.
        - When editing, a contentEditable div overlays the label exactly.
        - Pointer events on the contentEditable div are stopped so React Flow does not
          interpret typing gestures as canvas drag or pan.
        - `nodrag` and `nopan` class names tell React Flow not to initiate
          drag or pan from within this element.
      */}
      <div
        className="absolute inset-0 flex items-center justify-center px-3 py-1"
        onDoubleClick={startEditing}
      >
        {isEditing ? (
          // contenteditable div — sits inside the flex-center container so it
          // is naturally vertically centred. Text is managed via the DOM rather
          // than React so the cursor stays stable while Liveblocks re-renders.
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={stopEditing}
            onKeyDown={handleEditKeyDown}
            /* Stop React Flow from treating typing as canvas drag / pan. */
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag nopan w-full outline-none text-xs font-medium text-center leading-tight break-words"
            style={{
              color: colorPair.text,
              whiteSpace: "pre-wrap",
              minHeight: "1em",
            }}
          />
        ) : (
          <span
            className="text-xs font-medium text-center leading-tight pointer-events-none whitespace-pre-wrap break-words"
            style={{
              color: data.label ? colorPair.text : "var(--text-faint)",
            }}
          >
            {data.label || "Label"}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// nodeTypes — stable reference, defined at module level
// ---------------------------------------------------------------------------

export const nodeTypes = {
  canvasNode: CanvasNodeComponent,
} satisfies Record<string, ComponentType<NodeProps<CanvasNode>>>;
