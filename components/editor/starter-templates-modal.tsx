"use client";

import { Layers3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CanvasEdge, CanvasNode, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 150;
const PREVIEW_PADDING = 18;

function getNodeWidth(node: CanvasNode): number {
  return node.width ?? 160;
}

function getNodeHeight(node: CanvasNode): number {
  return node.height ?? 72;
}

function getBounds(nodes: CanvasNode[]): Bounds {
  return nodes.reduce<Bounds>(
    (bounds, current) => {
      const width = getNodeWidth(current);
      const height = getNodeHeight(current);
      return {
        minX: Math.min(bounds.minX, current.position.x),
        minY: Math.min(bounds.minY, current.position.y),
        maxX: Math.max(bounds.maxX, current.position.x + width),
        maxY: Math.max(bounds.maxY, current.position.y + height),
      };
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
}

function createProjector(nodes: CanvasNode[]) {
  const bounds = getBounds(nodes);
  const boundsWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const boundsHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / boundsWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / boundsHeight,
  );
  const offsetX = (PREVIEW_WIDTH - boundsWidth * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - boundsHeight * scale) / 2;

  return (x: number, y: number) => ({
    x: offsetX + (x - bounds.minX) * scale,
    y: offsetY + (y - bounds.minY) * scale,
  });
}

function nodeCenter(node: CanvasNode, project: (x: number, y: number) => { x: number; y: number }) {
  return project(
    node.position.x + getNodeWidth(node) / 2,
    node.position.y + getNodeHeight(node) / 2,
  );
}

function colorFor(fill: string | undefined) {
  return NODE_COLORS.find((pair) => pair.fill === fill) ?? NODE_COLORS[0];
}

function Shape({
  node,
  project,
}: {
  node: CanvasNode;
  project: (x: number, y: number) => { x: number; y: number };
}) {
  const topLeft = project(node.position.x, node.position.y);
  const bottomRight = project(
    node.position.x + getNodeWidth(node),
    node.position.y + getNodeHeight(node),
  );
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  const shape = node.data.shape ?? "rectangle";
  const colors = colorFor(node.data.color);
  const stroke = "var(--border-subtle)";

  if (shape === "diamond") {
    const points = [
      `${topLeft.x + width / 2},${topLeft.y}`,
      `${topLeft.x + width},${topLeft.y + height / 2}`,
      `${topLeft.x + width / 2},${topLeft.y + height}`,
      `${topLeft.x},${topLeft.y + height / 2}`,
    ].join(" ");
    return <polygon points={points} fill={colors.fill} stroke={stroke} />;
  }

  if (shape === "hexagon") {
    const points = Array.from({ length: 6 }, (_, index) => {
      const angle = (Math.PI / 3) * index - Math.PI / 2;
      const x = topLeft.x + width / 2 + (width / 2) * Math.cos(angle);
      const y = topLeft.y + height / 2 + (height / 2) * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
    return <polygon points={points} fill={colors.fill} stroke={stroke} />;
  }

  if (shape === "cylinder") {
    const capHeight = Math.max(height * 0.22, 4);
    return (
      <g>
        <path
          d={[
            `M ${topLeft.x},${topLeft.y + capHeight}`,
            `L ${topLeft.x},${topLeft.y + height - capHeight}`,
            `A ${width / 2},${capHeight} 0 0 0 ${topLeft.x + width},${topLeft.y + height - capHeight}`,
            `L ${topLeft.x + width},${topLeft.y + capHeight}`,
            "Z",
          ].join(" ")}
          fill={colors.fill}
          stroke={stroke}
        />
        <ellipse
          cx={topLeft.x + width / 2}
          cy={topLeft.y + capHeight}
          rx={width / 2}
          ry={capHeight}
          fill={colors.fill}
          stroke={stroke}
        />
      </g>
    );
  }

  const rxByShape = {
    rectangle: 5,
    pill: height / 2,
    circle: Math.max(width, height) / 2,
  } satisfies Record<Extract<NodeShape, "rectangle" | "pill" | "circle">, number>;

  return (
    <rect
      x={topLeft.x}
      y={topLeft.y}
      width={width}
      height={height}
      rx={rxByShape[shape as "rectangle" | "pill" | "circle"]}
      fill={colors.fill}
      stroke={stroke}
    />
  );
}

function Preview({ template }: { template: CanvasTemplate }) {
  const project = createProjector(template.nodes);
  const nodesById = new Map(template.nodes.map((node) => [node.id, node]));

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="h-full w-full"
      role="img"
      aria-label={`${template.name} preview`}
    >
      <rect
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
        rx="14"
        fill="var(--bg-base)"
      />
      {template.edges.map((edge: CanvasEdge) => {
        const source = nodesById.get(edge.source);
        const target = nodesById.get(edge.target);
        if (!source || !target) return null;
        const start = nodeCenter(source, project);
        const end = nodeCenter(target, project);
        return (
          <line
            key={edge.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--text-faint)"
            strokeWidth="1.5"
          />
        );
      })}
      {template.nodes.map((node) => (
        <Shape key={node.id} node={node} project={project} />
      ))}
    </svg>
  );
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100dvh-2rem))] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <div className="border-b border-border-default bg-surface px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-brand-dim">
              <Layers3 className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Starter Templates</DialogTitle>
              <DialogDescription className="mt-1">
                Replace the current canvas with a prebuilt system diagram.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="grid max-h-[calc(100dvh-9rem)] gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface"
            >
              <div className="h-36 border-b border-border-default bg-base">
                <Preview template={template} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-sm font-medium text-copy-primary">
                  {template.name}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-copy-secondary">
                  {template.description}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    onImport(template);
                    onOpenChange(false);
                  }}
                >
                  Import Template
                </Button>
              </div>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
