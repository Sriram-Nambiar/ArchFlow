"use client";

import { useState, useCallback } from "react";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode } from "@/types/canvas";

// ---------------------------------------------------------------------------
// Individual color swatch
// ---------------------------------------------------------------------------

interface ColorSwatchProps {
  fill: string;
  textColor: string;
  isActive: boolean;
  onSelect: () => void;
}

function ColorSwatch({ fill, textColor, isActive, onSelect }: ColorSwatchProps) {
  const [hovered, setHovered] = useState(false);

  // Active: vivid ring in the pair's text color + dark gap ring.
  // Hover:  tight, low-opacity glow in the pair's text color.
  const boxShadow = isActive
    ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${textColor}`
    : hovered
      ? `0 0 5px 1.5px ${textColor}55`
      : "none";

  return (
    <button
      type="button"
      aria-label={`Set node color to ${fill}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="nodrag nopan"
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        backgroundColor: fill,
        border: isActive
          ? `1.5px solid ${textColor}`
          : "1.5px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        boxShadow,
        transition: "box-shadow 0.12s ease, border-color 0.12s ease",
        flexShrink: 0,
        outline: "none",
        padding: 0,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Toolbar — rendered via NodeToolbar so it floats above the node in a portal
// ---------------------------------------------------------------------------

interface NodeColorToolbarProps {
  /** React Flow node id — identifies which node to update. */
  nodeId: string;
  /** Current fill color of the node; used to mark the active swatch. */
  activeFill: string;
  /** Mirror the node's `selected` prop so the toolbar shows/hides correctly. */
  selected?: boolean;
}

export function NodeColorToolbar({
  nodeId,
  activeFill,
  selected,
}: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode>();

  const handleSelect = useCallback(
    (fill: string) => {
      updateNodeData(nodeId, { color: fill });
    },
    [nodeId, updateNodeData],
  );

  return (
    <NodeToolbar
      nodeId={nodeId}
      isVisible={selected}
      position={Position.Top}
      offset={10}
    >
      {/*
        nodrag + nopan prevent the toolbar container itself from accidentally
        triggering canvas drag or pan when the user interacts with swatches.
        onMouseDown/onPointerDown are stopped at this level as a safety net.
      */}
      <div
        className="nodrag nopan flex items-center gap-1 px-1.5 py-1 rounded-xl"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {NODE_COLORS.map((pair) => (
          <ColorSwatch
            key={pair.fill}
            fill={pair.fill}
            textColor={pair.text}
            isActive={activeFill === pair.fill}
            onSelect={() => handleSelect(pair.fill)}
          />
        ))}
      </div>
    </NodeToolbar>
  );
}
