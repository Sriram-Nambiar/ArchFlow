"use client";

import { useCallback, useRef } from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  Panel,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { nodeTypes } from "./canvas-node";
import {
  ShapePanel,
  DRAG_PAYLOAD_KEY,
  type ShapeDragPayload,
} from "./shape-panel";

// ---------------------------------------------------------------------------
// Node ID generator  —  shape + timestamp + monotonic counter
// ---------------------------------------------------------------------------

let _nodeCounter = 0;

function generateNodeId(shape: NodeShape): string {
  return `${shape}-${Date.now()}-${++_nodeCounter}`;
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

/**
 * Inner canvas component.
 * Must be rendered inside a Liveblocks `RoomProvider` + `ClientSideSuspense`
 * boundary — both provided by `CanvasWrapper`.
 */
export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  // Capture the ReactFlow instance on mount so we can call screenToFlowPosition
  // inside event handlers that live outside the ReactFlow context tree.
  const rfInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  );

  // -------------------------------------------------------------------------
  // Drag-over: allow drops by preventing the default "no-drop" browser action
  // -------------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes(DRAG_PAYLOAD_KEY)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // -------------------------------------------------------------------------
  // Drop: parse payload, convert coords, create node via Liveblocks handler
  // -------------------------------------------------------------------------

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      const raw = e.dataTransfer.getData(DRAG_PAYLOAD_KEY);
      if (!raw || !rfInstance.current) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      // Convert browser-space drop coordinates to React Flow canvas coordinates.
      const canvasPos = rfInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      // Center the new node on the drop point.
      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position: {
          x: canvasPos.x - payload.width / 2,
          y: canvasPos.y - payload.height / 2,
        },
        data: {
          label: "",
          color: NODE_COLORS[0].fill,
          shape: payload.shape,
        },
        width: payload.width,
        height: payload.height,
      };

      // Pass the new node through the Liveblocks-aware change handler so it
      // gets written to shared storage and synced to all collaborators.
      onNodesChange([{ type: "add", item: newNode }]);
    },
    [onNodesChange],
  );

  return (
    <ReactFlow<CanvasNode, CanvasEdge>
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      nodeTypes={nodeTypes}
      connectionMode={ConnectionMode.Loose}
      onInit={(instance) => {
        rfInstance.current = instance;
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      fitView
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="rgba(255,255,255,0.06)"
      />
      <MiniMap
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
        }}
        maskColor="rgba(0,0,0,0.4)"
      />
      <Panel position="bottom-center" className="mb-4">
        <ShapePanel />
      </Panel>
    </ReactFlow>
  );
}
