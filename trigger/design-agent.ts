import { task, metadata } from "@trigger.dev/sdk";
import OpenAI from "openai";
import { setAiPresence, patchStorage } from "@/lib/liveblocks-agent";

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// ---------------------------------------------------------------------------
// LLM response shape
// ---------------------------------------------------------------------------

interface GeneratedNode {
  id: string;
  label: string;
  shape: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GeneratedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface GeneratedDesign {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert software architect. Given a user prompt, generate a system architecture diagram as a JSON object.

Output format — a single JSON object with two arrays:
{
  "nodes": [...],
  "edges": [...]
}

Each node object must have:
- "id": a meaningful string like "{shape}-{purpose}" (e.g. "pill-api-gateway", "cylinder-user-db")
- "label": a short human-readable name for the component
- "shape": one of "rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"
- "color": a fill color from this exact list: "#1F1F1F", "#10233D", "#2E1938", "#331B00", "#3C1618", "#3A1726", "#0F2E18", "#062822"
- "x": horizontal position in pixels
- "y": vertical position in pixels
- "width": node width in pixels (default 180)
- "height": node height in pixels (default 80)

Each edge object must have:
- "id": a unique string (e.g. "edge-api-to-db")
- "source": the id of the source node
- "target": the id of the target node
- "label": (optional) a short label for the connection

Shape guidelines:
- "pill" for services, APIs, and microservices
- "cylinder" for databases and data stores
- "diamond" for decision points and gateways
- "hexagon" for external systems and third-party services
- "rectangle" for general components and modules
- "circle" for events, triggers, and endpoints

Default dimensions: width 180, height 80. Adjust for circles (80x80) and diamonds (100x100).

Layout guidelines:
- Arrange nodes in a top-to-bottom flow layout
- Use approximately 200px vertical spacing between rows
- Use approximately 250px horizontal spacing between columns
- Center the layout around x=400
- Use varied colors from the palette for visual clarity — do not make every node the same color

CRITICAL: Output ONLY the raw JSON object. No markdown code fences. No explanation. No text before or after the JSON.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDesignJson(raw: string): GeneratedDesign {
  // Try direct parse first
  try {
    const parsed = JSON.parse(raw) as GeneratedDesign;
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed;
    }
  } catch {
    // Fall through to code-fence extraction
  }

  // Try to extract JSON from markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]) {
    const parsed = JSON.parse(fenceMatch[1]) as GeneratedDesign;
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed;
    }
  }

  throw new Error("LLM response is not valid JSON with nodes and edges arrays");
}

// ---------------------------------------------------------------------------
// Shared Status Feed Helper
// ---------------------------------------------------------------------------

async function addStatusMessage(roomId: string, status: string, text?: string) {
  const msgId = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const message = {
    id: msgId,
    status,
    text,
    timestamp: Date.now(),
  };

  try {
    await patchStorage(roomId, [
      {
        op: "add",
        path: "/ai-status-feed/-",
        value: message,
      },
    ]);
  } catch (error) {
    console.error("Failed to add status message to Liveblocks feed:", error);
  }
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 540, // 9 minutes — NVIDIA API can be slow
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;

    try {
      // -----------------------------------------------------------------------
      // 1. Set initial presence
      // -----------------------------------------------------------------------
      await setAiPresence(roomId, { cursor: null, thinking: true }, 60);
      metadata.set("status", "starting");
      await addStatusMessage(roomId, "starting", "Starting design generation…");

      // -----------------------------------------------------------------------
      // 2. Call NVIDIA LLM
      // -----------------------------------------------------------------------
      metadata.set("status", "generating-design");
      await addStatusMessage(roomId, "generating-design", "Generating architecture with AI…");

      const openai = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
        timeout: 4 * 60 * 1000, // 4-minute timeout for NVIDIA API
      });

      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("LLM returned an empty response");
      }

      // -----------------------------------------------------------------------
      // 3. Parse the LLM response
      // -----------------------------------------------------------------------
      const parsedDesign = parseDesignJson(content);

      // -----------------------------------------------------------------------
      // 4. Apply nodes to canvas
      // -----------------------------------------------------------------------
      metadata.set("status", "applying-nodes");
      await setAiPresence(roomId, { cursor: null, thinking: true }, 60);
      await addStatusMessage(roomId, "applying-nodes", "Adding nodes to canvas…");

      const nodeOps = parsedDesign.nodes.map((node) => ({
        op: "add" as const,
        path: `/flow/nodes/${node.id}`,
        value: {
          id: node.id,
          type: "canvasNode",
          position: {
            x: node.x,
            y: node.y,
          },
          data: {
            label: node.label,
            color: node.color || "#1F1F1F",
            shape: node.shape || "rectangle",
          },
          width: node.width || 180,
          height: node.height || 80,
        },
      }));
      await patchStorage(roomId, nodeOps);

      // -----------------------------------------------------------------------
      // 5. Apply edges to canvas
      // -----------------------------------------------------------------------
      metadata.set("status", "applying-edges");
      await setAiPresence(roomId, { cursor: null, thinking: true }, 60);
      await addStatusMessage(roomId, "applying-edges", "Connecting nodes…");

      const edgeOps = parsedDesign.edges.map((edge) => ({
        op: "add" as const,
        path: `/flow/edges/${edge.id}`,
        value: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: null,
          targetHandle: null,
          type: "canvasEdge",
          data: { label: edge.label || "" },
        },
      }));
      await patchStorage(roomId, edgeOps);

      // -----------------------------------------------------------------------
      // 6. Complete
      // -----------------------------------------------------------------------
      metadata.set("status", "complete");
      await setAiPresence(roomId, { cursor: null, thinking: false }, 5);
      await addStatusMessage(roomId, "complete", "Design applied to canvas!");

      return {
        success: true as const,
        nodesCount: parsedDesign.nodes.length,
        edgesCount: parsedDesign.edges.length,
      };
    } catch (error) {
      // -----------------------------------------------------------------------
      // 7. Error handling
      // -----------------------------------------------------------------------
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      metadata.set("status", "error");
      metadata.set("error", message);
      await addStatusMessage(roomId, "error", `Something went wrong: ${message}`);

      try {
        await setAiPresence(roomId, { cursor: null, thinking: false }, 5);
      } catch {
        // Swallow presence cleanup errors to surface the original failure
      }

      return { success: false as const, error: message };
    }
  },
});
