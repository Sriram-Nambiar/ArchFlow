import { Liveblocks } from "@liveblocks/node";

/**
 * Fixed palette of cursor colors.
 * A user always receives the same color for a given user ID.
 */
const CURSOR_COLORS = [
  "#E57373", // red-300
  "#F06292", // pink-300
  "#BA68C8", // purple-300
  "#7986CB", // indigo-300
  "#4FC3F7", // light-blue-300
  "#4DD0E1", // cyan-300
  "#4DB6AC", // teal-300
  "#81C784", // green-300
  "#DCE775", // lime-300
  "#FFD54F", // amber-300
  "#FFB74D", // orange-300
  "#A1887F", // brown-300
] as const;

/**
 * Deterministically maps a user ID to a color from the fixed palette.
 * The same user ID always produces the same color.
 */
export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Cached Liveblocks node client
// Initialised lazily so the env-var check is deferred to request time,
// not to module evaluation time during the Next.js static build.
// ---------------------------------------------------------------------------

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocks?: Liveblocks;
};

/**
 * Returns the cached Liveblocks node client, creating it on first call.
 * Call this inside route handlers — never at the module's top level.
 */
export function getLiveblocksClient(): Liveblocks {
  if (globalForLiveblocks.liveblocks) {
    return globalForLiveblocks.liveblocks;
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is not set");
  }

  const client = new Liveblocks({ secret });

  // Cache in development so Hot Module Replacement doesn't create new clients.
  if (process.env.NODE_ENV !== "production") {
    globalForLiveblocks.liveblocks = client;
  }

  return client;
}
