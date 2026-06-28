import { tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";
import {
  jsonResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/project-api";
import { z } from "zod";
import type { generateSpec } from "@/trigger/generate-spec";

// Zod schemas for input validation
const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const NodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: NodePositionSchema,
  data: z.object({
    label: z.string(),
    color: z.string().optional(),
    shape: z.string().optional(),
  }).passthrough(),
  width: z.number().optional(),
  height: z.number().optional(),
}).passthrough();

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  data: z.object({
    label: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

const specInputSchema = z.object({
  roomId: z.string(),
  chatHistory: z.array(z.any()),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export async function POST(request: Request) {
  // 1. Require Clerk authentication
  const identity = await getClerkIdentity();
  if (!identity) {
    return unauthorizedResponse();
  }

  // 2. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("Invalid JSON body");
  }

  // 3. Validate input with Zod
  const result = specInputSchema.safeParse(body);
  if (!result.success) {
    return badRequestResponse("Invalid request schema: " + result.error.message);
  }

  const { roomId, chatHistory, nodes, edges } = result.data;

  // 4. Verify project access using roomId
  const hasAccess = await checkProjectAccess(
    roomId,
    identity.userId,
    identity.emails
  );
  if (!hasAccess) {
    return forbiddenResponse();
  }

  try {
    // 5. Trigger the spec generation background task
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: roomId, // Use verified roomId as projectId
      roomId,
      chatHistory,
      nodes,
      edges,
    });

    const runId = handle.id;

    // 6. Create TaskRun record to track the run and verify ownership later
    await prisma.taskRun.create({
      data: {
        runId,
        projectId: roomId,
        userId: identity.userId,
      },
    });

    // 7. Return the Trigger.dev runId
    return jsonResponse({ runId });
  } catch (error) {
    console.error("Failed to trigger spec generation background task:", error);
    return jsonResponse({ error: "Failed to trigger background task" }, 500);
  }
}
