"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ComponentType,
} from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

// ---------------------------------------------------------------------------
// Custom canvas edge
// ---------------------------------------------------------------------------

/**
 * Renders a right-angle (smooth-step) edge with:
 *  - a dynamic arrow marker that brightens on hover / selection
 *  - a wider transparent hit area via BaseEdge interactionWidth
 *  - an EdgeLabelRenderer label positioned at the path midpoint returned by
 *    getSmoothStepPath — no manual midpoint calculation
 *  - double-click to enter inline label editing
 */
export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();

  // getSmoothStepPath returns the SVG path string plus the label midpoint
  // coordinates — use those directly instead of computing them manually.
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 6,
  });

  const label = data?.label ?? "";
  const isActive = Boolean(selected) || hovered;

  // Dimmed at rest, full brightness when hovered or selected.
  const strokeColor = isActive
    ? "var(--text-primary)"
    : "rgba(240, 240, 244, 0.35)";

  // Unique marker ID per edge so the arrow colour can change independently.
  const markerId = `canvas-arrow-${id}`;

  // -------------------------------------------------------------------------
  // Label editing
  // -------------------------------------------------------------------------

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Route the update through useReactFlow so it flows into Liveblocks'
      // onEdgesChange handler and syncs to all collaborators.
      updateEdgeData(id, { label: e.target.value });
    },
    [id, updateEdgeData],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        commitEdit();
      }
      // Prevent React Flow from intercepting keyboard events while typing.
      e.stopPropagation();
    },
    [commitEdit],
  );

  // Focus and select-all when the input mounts.
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <>
      {/*
        Arrow marker definition — one per edge, keyed to the edge ID.
        Nesting <defs> inside the edge's <g> is valid SVG and lets the fill
        react to the same strokeColor state as the path.
      */}
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={strokeColor} />
        </marker>
      </defs>

      {/*
        BaseEdge renders:
        - the visible SVG path (stroke + strokeLinecap applied via style)
        - a transparent overlay path whose width is controlled by interactionWidth,
          making the edge easier to hover and click without increasing line thickness
      */}
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        interactionWidth={20}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{ transition: "stroke 150ms ease" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={startEditing}
      />

      {/*
        EdgeLabelRenderer portals an HTML element into the React Flow renderer
        overlay. labelX / labelY come directly from getSmoothStepPath — these
        are the path midpoint coordinates.
      */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {isEditing ? (
            /*
              Auto-sizing input:
              A hidden ghost <span> mirrors the content and drives the
              container width; the real <input> overlays it absolutely.
              This keeps the input as wide as its content with no extra
              JavaScript measurement.
            */
            <div className="relative inline-block">
              <span
                className="invisible text-xs whitespace-pre block px-2 py-0.5 min-w-12"
                aria-hidden
              >
                {label}&nbsp;
              </span>
              <input
                ref={inputRef}
                value={label}
                onChange={handleChange}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                /* Prevent canvas drag / pan while typing. */
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="nodrag nopan absolute inset-0 w-full bg-elevated border border-border-subtle text-copy-primary text-xs rounded-lg px-2 py-0.5 outline-none focus:border-brand"
              />
            </div>
          ) : label ? (
            /* Saved label — displayed as a small pill badge. */
            <button
              className="bg-elevated border border-border-subtle text-copy-secondary text-xs rounded-lg px-2 py-0.5 cursor-text select-none hover:border-border-default transition-colors"
              onDoubleClick={startEditing}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {label}
            </button>
          ) : isActive ? (
            /* Faint hint shown when the edge is active but has no label yet. */
            <button
              className="text-copy-faint text-xs px-1 py-0.5 cursor-text select-none"
              onDoubleClick={startEditing}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              label
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ---------------------------------------------------------------------------
// edgeTypes — stable reference exported for use in <ReactFlow edgeTypes={…} />
// ---------------------------------------------------------------------------

export const edgeTypes = {
  canvasEdge: CanvasEdgeComponent,
} satisfies Record<string, ComponentType<EdgeProps<CanvasEdge>>>;
