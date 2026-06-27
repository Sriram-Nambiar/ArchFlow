"use client";

import type { ComponentType } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

// ---------------------------------------------------------------------------
// SVG shape geometry
// Each shape is rendered inside an <svg> that exactly covers the node bounds.
// Stroke is centered on the path, so geometry starts at sw/2 to stay in-bounds.
// ---------------------------------------------------------------------------

interface ShapeGeometryProps {
  shape: NodeShape;
  w: number;
  h: number;
  fill: string;
  stroke: string;
}

function ShapeGeometry({ shape, w, h, fill, stroke }: ShapeGeometryProps) {
  const sw = 1.5; // stroke width
  const half = sw / 2;

  switch (shape) {
    // -- Circle / ellipse -------------------------------------------------------
    case "circle":
      return (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - half}
          ry={h / 2 - half}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );

    // -- Diamond (rotated square) -----------------------------------------------
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

    // -- Pill (stadium / capsule) -----------------------------------------------
    case "pill":
      return (
        <rect
          x={half}
          y={half}
          width={w - sw}
          height={h - sw}
          rx={h / 2}
          ry={h / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );

    // -- Cylinder ---------------------------------------------------------------
    // Body: two vertical lines + bottom arc, then top ellipse cap on top.
    case "cylinder": {
      const ey = Math.max(h * 0.18, 8); // top/bottom ellipse y-radius
      const rx = w / 2 - half;

      // Body path: left edge → bottom arc → right edge (top covered by cap ellipse)
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

    // -- Hexagon ---------------------------------------------------------------
    // Pointy-top hexagon: first point at the top centre.
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

    // -- Rectangle (default) ---------------------------------------------------
    case "rectangle":
    default:
      return (
        <rect
          x={half}
          y={half}
          width={w - sw}
          height={h - sw}
          rx={10}
          ry={10}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Node renderer
// ---------------------------------------------------------------------------

export function CanvasNodeComponent({
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
  const stroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  return (
    <div style={{ width: w, height: h }} className="relative select-none">
      {/*
        All 4 handles use type="source" with unique IDs.
        ConnectionMode.Loose (set on <ReactFlow>) lets any handle connect to
        any other handle, so the user's drag direction fully controls which
        end is source and which is target — no forced topology.

        Unique IDs are critical: without them React Flow conflates all handles
        of the same type into one connection point, limiting to a single edge.
      */}
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />

      {/* SVG shape background */}
      <svg
        width={w}
        height={h}
        className="absolute inset-0"
        style={{ pointerEvents: "none", overflow: "visible" }}
      >
        <ShapeGeometry
          shape={shape}
          w={w}
          h={h}
          fill={colorPair.fill}
          stroke={stroke}
        />
      </svg>

      {/* Centered label */}
      <div
        className="absolute inset-0 flex items-center justify-center px-3 py-1 text-xs font-medium text-center leading-tight pointer-events-none"
        style={{ color: colorPair.text }}
      >
        {data.label}
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
