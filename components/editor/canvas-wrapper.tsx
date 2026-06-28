"use client";

import React from "react";
import { ClientSideSuspense } from "@liveblocks/react";
import { Canvas } from "./canvas";
import type { CanvasTemplate } from "./starter-templates";

// ---------------------------------------------------------------------------
// Error boundary for Liveblocks connection failures
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class LiveblocksErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Loading and error UI
// ---------------------------------------------------------------------------

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-default border-t-brand" />
        <p className="text-xs text-copy-faint">Connecting to canvas…</p>
      </div>
    </div>
  );
}

export function LiveblocksError() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-copy-primary">
          Canvas unavailable
        </p>
        <p className="text-xs text-copy-muted">
          Unable to connect to the collaboration server. Refresh the page to
          retry.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface CanvasWrapperProps {
  roomId: string;
  projectId: string;
  templateImport: {
    id: number;
    template: CanvasTemplate;
  } | null;
}

export function CanvasWrapper({ roomId, projectId, templateImport }: CanvasWrapperProps) {
  return (
    <ClientSideSuspense fallback={<CanvasLoading />}>
      <Canvas projectId={projectId} templateImport={templateImport} />
    </ClientSideSuspense>
  );
}
