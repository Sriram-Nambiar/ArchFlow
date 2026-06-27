"use client";

import { useReactFlow } from "@xyflow/react";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
} from "@liveblocks/react/suspense";
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Check, AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";

// ---------------------------------------------------------------------------
// Internal primitives
// ---------------------------------------------------------------------------

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

function ControlButton({
  onClick,
  disabled = false,
  title,
  children,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-xl text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-copy-muted"
    >
      {children}
    </button>
  );
}

function GroupDivider() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-border-default" />;
}

// ---------------------------------------------------------------------------
// CanvasControls
// ---------------------------------------------------------------------------

/**
 * Floating pill-shaped control bar.
 *
 * Rendered inside a React Flow `<Panel>` so it always floats above the canvas.
 * Must be a descendant of both `ReactFlowProvider` and `RoomProvider`.
 */
interface CanvasControlsProps {
  saveStatus?: SaveStatus;
}

export function CanvasControls({ saveStatus = "idle" }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border-default bg-elevated px-2.5 py-1.5 shadow-lg">
      {/* ------------------------------------------------------------------ */}
      {/* Zoom group                                                          */}
      {/* ------------------------------------------------------------------ */}
      <ControlButton
        onClick={() => zoomOut({ duration: 300 })}
        title="Zoom out (−)"
      >
        <ZoomOut className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => fitView({ duration: 300 })}
        title="Fit view"
      >
        <Maximize2 className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => zoomIn({ duration: 300 })}
        title="Zoom in (+)"
      >
        <ZoomIn className="h-4 w-4" />
      </ControlButton>

      <GroupDivider />

      {/* ------------------------------------------------------------------ */}
      {/* History group                                                       */}
      {/* ------------------------------------------------------------------ */}
      <ControlButton
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </ControlButton>

      {/* ------------------------------------------------------------------ */}
      {/* Save status indicator                                               */}
      {/* ------------------------------------------------------------------ */}
      {saveStatus !== "idle" && (
        <>
          <GroupDivider />
          <div className="flex items-center gap-1.5 px-1.5">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-copy-muted" />
                <span className="text-[11px] text-copy-muted">Saving…</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3.5 w-3.5 text-green-400" />
                <span className="text-[11px] text-green-400">Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-error" />
                <span className="text-[11px] text-error">Error</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
