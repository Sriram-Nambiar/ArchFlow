import type { Node, Edge } from "@xyflow/react"

// ---------------------------------------------------------------------------
// Node shapes
// ---------------------------------------------------------------------------

export type NodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon"

// ---------------------------------------------------------------------------
// Node data
// ---------------------------------------------------------------------------

export interface NodeData extends Record<string, unknown> {
  /** Display label for the node. */
  label: string
  /** Fill color hex — should match one of NODE_COLORS[n].fill. */
  color?: string
  /** Rendered shape variant. Defaults to "rectangle". */
  shape?: NodeShape
}

// ---------------------------------------------------------------------------
// Typed React Flow node and edge
// ---------------------------------------------------------------------------

export type CanvasNode = Node<NodeData, "canvasNode">
export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">

// ---------------------------------------------------------------------------
// Color palette — 8 dark fill / vivid text pairs (from ui-context.md)
// ---------------------------------------------------------------------------

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" }, // neutral dark (default)
  { fill: "#10233D", text: "#52A8FF" }, // blue
  { fill: "#2E1938", text: "#BF7AF0" }, // purple
  { fill: "#331B00", text: "#FF990A" }, // orange
  { fill: "#3C1618", text: "#FF6166" }, // red
  { fill: "#3A1726", text: "#F75F8F" }, // pink
  { fill: "#0F2E18", text: "#62C073" }, // green
  { fill: "#062822", text: "#0AC7B4" }, // teal
] as const

// ---------------------------------------------------------------------------
// Shape list (all supported variants)
// ---------------------------------------------------------------------------

export const NODE_SHAPES: readonly NodeShape[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const
