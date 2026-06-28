// Canvas save/load API routes
import { put } from "@vercel/blob";
import {
  jsonResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
} from "@/lib/project-api";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// PUT — save canvas JSON to Vercel Blob and store the URL on the project
// ---------------------------------------------------------------------------

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getClerkIdentity();

  if (!identity) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return notFoundResponse();
  }

  const hasAccess = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails,
  );

  if (!hasAccess) {
    return forbiddenResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("Request body must be valid JSON");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequestResponse("Request body must be a JSON object");
  }

  const { nodes, edges } = body as Record<string, unknown>;

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return badRequestResponse("Body must contain nodes and edges arrays");
  }

  try {
    const canvasJson = JSON.stringify({ nodes, edges });

    const blob = await put(`canvas/${projectId}.json`, canvasJson, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return jsonResponse({ saved: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Canvas save error:", message);
    return jsonResponse({ error: "Failed to save canvas" }, 500);
  }
}

// ---------------------------------------------------------------------------
// GET — load saved canvas JSON from Vercel Blob
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getClerkIdentity();

  if (!identity) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;

  const hasAccess = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails,
  );

  if (!hasAccess) {
    return forbiddenResponse();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project) {
    return notFoundResponse();
  }

  if (!project.canvasJsonPath) {
    return jsonResponse({ canvas: null });
  }

  try {
    const response = await fetch(project.canvasJsonPath, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return jsonResponse({ canvas: null });
    }

    const canvas = await response.json();
    return jsonResponse({ canvas });
  } catch {
    return jsonResponse({ canvas: null });
  }
}
