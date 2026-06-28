"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** Debounce interval in milliseconds. Default: 3000. */
  debounceMs?: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Debounced autosave hook for the canvas.
 *
 * Watches `nodes` and `edges` and persists them to Vercel Blob via the
 * canvas API route after a configurable debounce interval.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  debounceMs = 3000,
}: UseCanvasAutosaveOptions): { saveStatus: SaveStatus } {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Track whether we have seen a meaningful canvas state yet.
  // Skip saving when both arrays are empty to avoid overwriting a saved
  // canvas during the initial empty-room render.
  const hasSeenDataRef = useRef(false);

  // Track whether we have successfully saved a non-empty state.
  // We initialize this to true if the canvas is initially loaded with data.
  const hasSavedNonEmptyRef = useRef(nodes.length > 0 || edges.length > 0);

  // Ref to cancel any in-flight autosave request to avoid concurrency issues.
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep a ref to the latest save function so the debounced call always
  // uses the current nodes/edges snapshot.
  const latestSnapshotRef = useRef({ nodes, edges });
  useEffect(() => {
    latestSnapshotRef.current = { nodes, edges };
  }, [nodes, edges]);

  const save = useCallback(async () => {
    const { nodes: n, edges: e } = latestSnapshotRef.current;

    // Don't save empty canvases unless we have already successfully saved a non-empty state.
    // This prevents overwriting a saved state when the room first loads empty before restore.
    if (n.length === 0 && e.length === 0 && !hasSavedNonEmptyRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSaveStatus("saving");

    try {
      // Deep-clone to strip Liveblocks proxy wrappers — the reactive proxy
      // objects may carry internal metadata that breaks serialization.
      const plainNodes = JSON.parse(JSON.stringify(n));
      const plainEdges = JSON.parse(JSON.stringify(e));

      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: plainNodes, edges: plainEdges }),
        signal: controller.signal,
      });

      if (!isMountedRef.current) return;

      if (res.ok) {
        setSaveStatus("saved");
        if (plainNodes.length > 0 || plainEdges.length > 0) {
          hasSavedNonEmptyRef.current = true;
        }
      } else {
        setSaveStatus("error");
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // Ignore aborted requests
      }
      if (isMountedRef.current) {
        setSaveStatus("error");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [projectId]);

  // Debounce: schedule a save whenever nodes or edges change.
  useEffect(() => {
    // Mark that we've seen data once there is something to save.
    if (nodes.length > 0 || edges.length > 0) {
      hasSeenDataRef.current = true;
    }

    // Only save if we have ever had actual data on canvas.
    if (!hasSeenDataRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void save();
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [nodes, edges, debounceMs, save]);

  // Cleanup on unmount.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { saveStatus };
}
