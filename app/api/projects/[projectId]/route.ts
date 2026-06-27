import {
  badRequestResponse,
  forbiddenResponse,
  getAuthenticatedUserId,
  getProjectOwnerId,
  jsonResponse,
  notFoundResponse,
  projectSelect,
  readJsonObject,
  readRequiredProjectName,
  unauthorizedResponse,
} from "@/lib/project-api";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;
  const ownerId = await getProjectOwnerId(projectId);

  if (!ownerId) {
    return notFoundResponse();
  }

  if (ownerId !== userId) {
    return forbiddenResponse();
  }

  const body = await readJsonObject(request);

  if (!body) {
    return badRequestResponse("Request body must be a JSON object");
  }

  const name = readRequiredProjectName(body);

  if (!name) {
    return badRequestResponse("Project name is required");
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
    select: projectSelect,
  });

  return jsonResponse({ project });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const { projectId } = await params;
  const ownerId = await getProjectOwnerId(projectId);

  if (!ownerId) {
    return notFoundResponse();
  }

  if (ownerId !== userId) {
    return forbiddenResponse();
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return jsonResponse({ projectId });
}
