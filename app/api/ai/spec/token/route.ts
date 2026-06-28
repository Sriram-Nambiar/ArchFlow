import { auth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getClerkIdentity } from "@/lib/project-access";
import {
  jsonResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/project-api";

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

  const { runId } = body as Record<string, unknown>;

  if (typeof runId !== "string" || !runId.trim()) {
    return badRequestResponse("runId must be a non-empty string");
  }

  // 3. Find the TaskRun record and verify ownership
  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });

  if (!taskRun) {
    // Return forbidden to avoid leaking run IDs
    return forbiddenResponse();
  }

  if (taskRun.userId !== identity.userId) {
    return forbiddenResponse();
  }

  try {
    // 4. Generate a public read token scoped specifically to this run and task
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
          tasks: ["generate-spec"],
        },
      },
      expirationTime: "1h",
    });

    // 5. Return the token to the client
    return jsonResponse({ token: publicToken });
  } catch (error) {
    console.error("Failed to generate Trigger.dev public token for spec generation:", error);
    return jsonResponse({ error: "Failed to generate public token" }, 500);
  }
}
