"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseKeyboardShortcutsOptions {
  rfInstance: RefObject<ReactFlowInstance<CanvasNode, CanvasEdge> | null>;
  undo: () => void;
  redo: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when the event target is a field the user is actively typing in. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Attaches global keyboard shortcuts for canvas zoom and Liveblocks undo/redo.
 *
 * Shortcuts are ignored while the user is typing in an input, textarea, or
 * any contentEditable field so they do not interfere with text editing.
 *
 * Supported shortcuts:
 *   +  /  =       → zoom in
 *   -             → zoom out
 *   Ctrl/Cmd+Z    → undo
 *   Ctrl/Cmd+Y    → redo
 *   Ctrl/Cmd+⇧+Z  → redo
 */
export function useKeyboardShortcuts({
  rfInstance,
  undo,
  redo,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (isEditableTarget(e.target)) return;

      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Zoom in: + or =  (no modifier required)
      if (!meta && (key === "+" || key === "=")) {
        e.preventDefault();
        rfInstance.current?.zoomIn({ duration: 300 });
        return;
      }

      // Zoom out: -  (no modifier required)
      if (!meta && key === "-") {
        e.preventDefault();
        rfInstance.current?.zoomOut({ duration: 300 });
        return;
      }

      // Undo: Ctrl/Cmd + Z  (without Shift)
      if (meta && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z
      if (meta && e.shiftKey && key === "z") {
        e.preventDefault();
        redo();
        return;
      }

      // Redo: Ctrl/Cmd + Y
      if (meta && key === "y") {
        e.preventDefault();
        redo();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rfInstance, undo, redo]);
}
