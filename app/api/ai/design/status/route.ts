import { runs } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import { getClerkIdentity } from "@/lib/project-access";
import {
  jsonResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/project-api";

export async function GET(request: Request) {
  // 1. Require Clerk authentication
  const identity = await getClerkIdentity();
  if (!identity) return unauthorizedResponse();

  // 2. Read runId from URL search params
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  if (!runId) return badRequestResponse("runId query parameter is required");

  // 3. Find the TaskRun record and verify ownership
  const taskRun = await prisma.taskRun.findUnique({ where: { runId } });
  if (!taskRun || taskRun.userId !== identity.userId) {
    return forbiddenResponse();
  }

  try {
    // 4. Retrieve the run from Trigger.dev
    const run = await runs.retrieve(runId);

    // 5. Extract status from metadata, plus the run's own status
    const agentStatus =
      (run.metadata as Record<string, unknown> | null)?.status ?? null;
    const agentError =
      (run.metadata as Record<string, unknown> | null)?.error ?? null;

    return jsonResponse({
      runId,
      taskStatus: run.status, // Trigger.dev run status (EXECUTING, COMPLETED, FAILED, etc.)
      agentStatus: agentStatus, // Our custom status from metadata
      agentError: agentError, // Error message if any
      completedAt: run.finishedAt ?? null,
    });
  } catch (error) {
    console.error("Failed to retrieve run status:", error);
    return jsonResponse({ error: "Failed to retrieve run status" }, 500);
  }
}
