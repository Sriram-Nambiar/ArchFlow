"use client";

import { shallow, useOthers } from "@liveblocks/react/suspense";
import { Loader2 } from "lucide-react";

interface LiveCursor {
  connectionId: number;
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number };
  thinking: boolean;
}

export function LiveCursors({ currentUserId }: { currentUserId: string | null }) {
  const cursors = useOthers(
    (others) =>
      others
        .filter(
          (other) =>
            other.id !== currentUserId &&
            other.presence?.cursor !== null &&
            other.presence?.cursor !== undefined,
        )
        .map((other) => ({
          connectionId: other.connectionId,
          id: other.id,
          name: other.info?.name ?? "",
          color: other.info?.cursorColor ?? (other.info as any)?.color ?? "#6457f9",
          cursor: other.presence.cursor!,
          thinking: other.presence?.thinking ?? false,
        })),
    shallow,
  ).filter(
    (cursor): cursor is LiveCursor =>
      cursor.cursor !== null && cursor.cursor !== undefined,
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {cursors.map((cursor) => (
        <div
          key={cursor.connectionId}
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${cursor.cursor.x}px, ${cursor.cursor.y}px)`,
          }}
        >
          <svg
            className="block h-5 w-5 drop-shadow"
            viewBox="0 0 18 18"
            aria-hidden="true"
          >
            <path
              d="M2 1.5 15.5 7 9 9.4 6.4 16.2 2 1.5Z"
              fill={cursor.color}
              stroke="var(--bg-base)"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <div
            className="ml-4 mt-0.5 max-w-36 truncate rounded-xl px-2 py-1 text-xs font-medium text-copy-primary shadow-lg flex items-center gap-1.5"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.thinking && (
              <Loader2 className="h-3 w-3 animate-spin text-copy-primary shrink-0" />
            )}
            <span>{cursor.name || cursor.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
