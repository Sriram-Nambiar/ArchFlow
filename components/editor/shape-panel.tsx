"use client"

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NodeShape } from "@/types/canvas"

// ---------------------------------------------------------------------------
// Drag payload
// ---------------------------------------------------------------------------

/** MIME-style key used to identify shape drag events. */
export const DRAG_PAYLOAD_KEY = "application/ghostflow-shape"

/** Data serialized into dataTransfer when the user drags a shape. */
export interface ShapeDragPayload {
  shape: NodeShape
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Shape definitions with sensible default sizes
// ---------------------------------------------------------------------------

interface ShapeItem {
  shape: NodeShape
  label: string
  icon: LucideIcon
  width: number
  height: number
}

const SHAPE_ITEMS: ShapeItem[] = [
  // rectangles wider than tall
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal, width: 160, height: 80 },
  // diamonds slightly larger so labels have room
  { shape: "diamond", label: "Diamond", icon: Diamond, width: 128, height: 128 },
  // circles are square
  { shape: "circle", label: "Circle", icon: Circle, width: 80, height: 80 },
  { shape: "pill", label: "Pill", icon: Pill, width: 140, height: 60 },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder, width: 80, height: 100 },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon, width: 100, height: 100 },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShapePanel() {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border-default bg-elevated px-2.5 py-1.5 shadow-lg">
      {SHAPE_ITEMS.map(({ shape, label, icon: Icon, width, height }) => {
        const payload: ShapeDragPayload = { shape, width, height }

        return (
          <button
            key={shape}
            title={label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_PAYLOAD_KEY, JSON.stringify(payload))
              e.dataTransfer.effectAllowed = "copy"
            }}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-xl text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
