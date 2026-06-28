import { tasks, auth } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";
import {
  jsonResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/project-api";
import type { designAgentTask } from "@/trigger/design-agent";

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

  if (!body || typeof body !== "object") {
    return badRequestResponse("Request body must be a JSON object");
  }

  const { prompt, roomId, projectId } = body as Record<string, unknown>;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return badRequestResponse("prompt must be a non-empty string");
  }
  if (typeof roomId !== "string" || !roomId.trim()) {
    return badRequestResponse("roomId must be a non-empty string");
  }
  if (typeof projectId !== "string" || !projectId.trim()) {
    return badRequestResponse("projectId must be a non-empty string");
  }

  // 3. Verify project access
  const hasAccess = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails
  );
  if (!hasAccess) {
    return forbiddenResponse();
  }

  try {
    // 4. Trigger the design background task
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId,
    });

    const runId = handle.id;

    // 5. Create TaskRun record to track the run and verify ownership later
    await prisma.taskRun.create({
      data: {
        runId,
        projectId,
        userId: identity.userId,
      },
    });

    // 6. Generate a public read token scoped specifically to this run and task
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
          tasks: ["design-agent"],
        },
      },
      expirationTime: "1h",
    });

    // 7. Return the run ID and public token to the client
    return jsonResponse({ runId, publicToken });
  } catch (error) {
    console.error("Failed to trigger design agent background task:", error);
    return jsonResponse({ error: "Failed to trigger background task" }, 500);
  }
}
