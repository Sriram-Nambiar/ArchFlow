// ---------------------------------------------------------------------------
// Liveblocks REST API helpers for the Ghost AI agent.
// Uses raw fetch() — the Node SDK does not expose ephemeral presence or
// JSON Patch storage operations.
// ---------------------------------------------------------------------------

const LIVEBLOCKS_BASE = "https://api.liveblocks.io/v2";

function getSecret(): string {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY environment variable is not set");
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

interface AiPresenceData {
  cursor: { x: number; y: number } | null;
  thinking: boolean;
}

/**
 * Sets ephemeral AI presence in a Liveblocks room via the REST API.
 * The presence auto-expires after `ttl` seconds (default 30).
 */
export async function setAiPresence(
  roomId: string,
  data: AiPresenceData,
  ttl: number = 30,
): Promise<void> {
  const secret = getSecret();
  const url = `${LIVEBLOCKS_BASE}/rooms/${encodeURIComponent(roomId)}/presence`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: "ghost-ai",
      data,
      userInfo: {
        name: "Ghost AI",
        avatar: "",
        color: "#6457f9",
      },
      ttl,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Liveblocks presence request failed (${response.status}): ${text}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Storage — JSON Patch
// ---------------------------------------------------------------------------

interface JsonPatchOperation {
  op: string;
  path: string;
  value?: unknown;
}

/**
 * Applies JSON Patch operations to Liveblocks room storage via the REST API.
 */
export async function patchStorage(
  roomId: string,
  operations: JsonPatchOperation[],
): Promise<void> {
  const secret = getSecret();
  const url = `${LIVEBLOCKS_BASE}/rooms/${encodeURIComponent(roomId)}/storage/json-patch`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(operations),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Liveblocks storage patch failed (${response.status}): ${text}`,
    );
  }
}
