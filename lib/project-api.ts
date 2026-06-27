import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export const projectSelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  status: true,
  canvasJsonPath: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getAuthenticatedUserId() {
  const { userId } = await auth();

  return userId;
}

export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return Response.json(body, { status });
}

export function unauthorizedResponse() {
  return jsonResponse({ error: "Unauthorized" }, 401);
}

export function forbiddenResponse() {
  return jsonResponse({ error: "Forbidden" }, 403);
}

export function badRequestResponse(message: string) {
  return jsonResponse({ error: message }, 400);
}

export function notFoundResponse() {
  return jsonResponse({ error: "Project not found" }, 404);
}

interface ReadJsonObjectOptions {
  allowEmpty?: boolean;
}

export async function readJsonObject(
  request: Request,
  options: ReadJsonObjectOptions = {},
) {
  try {
    const text = await request.text();

    if (!text.trim()) {
      return options.allowEmpty ? {} : null;
    }

    const body: unknown = JSON.parse(text);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readOptionalProjectName(body: Record<string, unknown>) {
  if (!("name" in body) || body.name === null || body.name === undefined) {
    return "Untitled Project";
  }

  if (typeof body.name !== "string") {
    return null;
  }

  const name = body.name.trim();

  return name.length > 0 ? name : "Untitled Project";
}

export function readRequiredProjectName(body: Record<string, unknown>) {
  if (typeof body.name !== "string") {
    return null;
  }

  const name = body.name.trim();

  return name.length > 0 ? name : null;
}

export async function getProjectOwnerId(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  return project?.ownerId ?? null;
}
