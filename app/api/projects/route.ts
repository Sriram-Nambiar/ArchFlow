import {
  badRequestResponse,
  getAuthenticatedUserId,
  jsonResponse,
  projectSelect,
  readJsonObject,
  readOptionalProjectName,
  unauthorizedResponse,
} from "@/lib/project-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  });

  return jsonResponse({ projects });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  const body = await readJsonObject(request, { allowEmpty: true });

  if (!body) {
    return badRequestResponse("Request body must be a JSON object");
  }

  const name = readOptionalProjectName(body);

  if (!name) {
    return badRequestResponse("Project name must be a string");
  }

  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name,
    },
    select: projectSelect,
  });

  return jsonResponse({ project }, 201);
}
