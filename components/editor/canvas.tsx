"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useMyPresence, useUndo, useRedo } from "@liveblocks/react/suspense";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  type ReactFlowInstance,
  type Connection,
} from "@xyflow/react";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasTemplate } from "./starter-templates";
import { nodeTypes } from "./canvas-node";
import { edgeTypes } from "./canvas-edge";
import {
  ShapePanel,
  DRAG_PAYLOAD_KEY,
  type ShapeDragPayload,
} from "./shape-panel";
import { CanvasControls } from "./canvas-controls";
import { LiveCursors } from "./live-cursors";
import { PresenceAvatarGroup } from "./presence-avatar-group";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

// ---------------------------------------------------------------------------
// ID generators — timestamp + monotonic counter avoids duplicates even when
// two edges share the same source and target.
// ---------------------------------------------------------------------------

let _nodeCounter = 0;
let _edgeCounter = 0;

function generateNodeId(shape: NodeShape): string {
  return `${shape}-${Date.now()}-${++_nodeCounter}`;
}

function generateEdgeId(): string {
  return `edge-${Date.now()}-${++_edgeCounter}`;
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

interface CanvasProps {
  projectId: string;
  templateImport: {
    id: number;
    template: CanvasTemplate;
  } | null;
  onSaveStatusChange?: (status: SaveStatus) => void;
}

/**
 * Inner canvas component.
 * Must be rendered inside a Liveblocks `RoomProvider` + `ClientSideSuspense`
 * boundary — both provided by `CanvasWrapper`.
 */
export function Canvas({ projectId, templateImport, onSaveStatusChange }: CanvasProps) {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const [, updateMyPresence] = useMyPresence();

  // onConnect from useLiveblocksFlow calls React Flow's addEdge() which never
  // sets a custom edge type. We replace it entirely so every new edge gets
  // type: "canvasEdge", a collision-safe ID, and an empty label payload.
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const handleConnect = useCallback(
    (connection: Connection) => {
      // Guard: React Flow guarantees source/target are non-null here, but
      // the Connection type has them as string so no null-check is needed.
      const newEdge: CanvasEdge = {
        id: generateEdgeId(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: "canvasEdge",
        data: { label: "" },
      };
      // Route through the Liveblocks onEdgesChange handler so the new edge
      // is written to shared storage and synced to all collaborators.
      onEdgesChange([{ type: "add", item: newEdge }]);
    },
    [onEdgesChange],
  );

  // Liveblocks history — passed to the keyboard shortcuts hook and to the
  // control bar component for collaborative undo/redo.
  const undo = useUndo();
  const redo = useRedo();

  // -------------------------------------------------------------------------
  // Autosave — debounced persistence to Vercel Blob
  // -------------------------------------------------------------------------

  const { saveStatus } = useCanvasAutosave({ projectId, nodes, edges });

  // Bubble saveStatus up to the parent so CanvasControls can display it.
  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  // -------------------------------------------------------------------------
  // Load saved canvas state when room is empty
  // -------------------------------------------------------------------------

  const hasLoadedRef = useRef(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // If the Liveblocks room already has nodes or edges, skip the load
    // entirely to avoid overwriting active collaboration.
    if (nodes.length > 0 || edges.length > 0) return;

    let cancelled = false;

    async function loadSavedCanvas() {
      setIsRestoring(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (!res.ok || cancelled) return;

        const data = await res.json() as { canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null };
        if (cancelled || !data.canvas) return;

        const { nodes: savedNodes, edges: savedEdges } = data.canvas;

        if (savedNodes.length > 0) {
          onNodesChange(savedNodes.map((node) => ({ type: "add" as const, item: node })));
        }
        if (savedEdges.length > 0) {
          onEdgesChange(savedEdges.map((edge) => ({ type: "add" as const, item: edge })));
        }

        // Fit the restored canvas into view.
        window.requestAnimationFrame(() => {
          rfInstance.current?.fitView({ duration: 300, padding: 0.2 });
        });
      } catch {
        // Silently fail — the user can still work on a fresh canvas.
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    void loadSavedCanvas();

    return () => {
      cancelled = true;
    };
    // Only run once on mount — nodes/edges refs are from the initial render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, onNodesChange, onEdgesChange]);

  // Capture the ReactFlow instance on mount so we can call screenToFlowPosition
  // inside event handlers that live outside the ReactFlow context tree.
  const rfInstance = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  );

  // Wire keyboard shortcuts — +/= zoom in, - zoom out, Ctrl+Z undo, etc.
  useKeyboardShortcuts({ rfInstance, undo, redo });

  useEffect(() => {
    if (!templateImport) return;

    const edgeRemovals = edges.map((edge) => ({
      id: edge.id,
      type: "remove" as const,
    }));
    const nodeRemovals = nodes.map((node) => ({
      id: node.id,
      type: "remove" as const,
    }));
    const edgeAdditions = templateImport.template.edges.map((edge) => ({
      type: "add" as const,
      item: {
        ...edge,
        data: { ...edge.data },
      },
    }));
    const nodeAdditions = templateImport.template.nodes.map((node) => ({
      type: "add" as const,
      item: {
        ...node,
        position: { ...node.position },
        data: { ...node.data },
      },
    }));

    onEdgesChange([...edgeRemovals, ...edgeAdditions]);
    onNodesChange([...nodeRemovals, ...nodeAdditions]);

    window.requestAnimationFrame(() => {
      rfInstance.current?.fitView({ duration: 300, padding: 0.2 });
    });
    // `templateImport.id` is the import trigger; nodes and edges are read from
    // the render that receives that trigger so repeat imports replace the graph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateImport?.id, onEdgesChange, onNodesChange]);

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bounds = e.currentTarget.getBoundingClientRect();
      updateMyPresence({
        cursor: {
          x: e.clientX - bounds.left,
          y: e.clientY - bounds.top,
        },
      });
    },
    [updateMyPresence],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <ReactFlow<CanvasNode, CanvasEdge>
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onDelete={onDelete}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{ type: "canvasEdge" }}
      connectionMode={ConnectionMode.Loose}
      onInit={(instance) => {
        rfInstance.current = instance;
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      fitView
    >
      <LiveCursors currentUserId={currentUserId} />
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="rgba(255,255,255,0.06)"
      />
      <Panel position="bottom-left" className="ml-4 mb-4">
        <CanvasControls saveStatus={saveStatus} />
      </Panel>
      <Panel position="bottom-center" className="mb-4">
        <ShapePanel />
      </Panel>
      <Panel position="top-right" className="mr-4 mt-4">
        <PresenceAvatarGroup />
      </Panel>
    </ReactFlow>
  );
}
