import { prisma } from "@/lib/prisma";
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access";
import {
  jsonResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/project-api";
import { slugify } from "@/lib/slugify";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  // 1. Authenticate user
  const identity = await getClerkIdentity();
  if (!identity) {
    return unauthorizedResponse();
  }

  // 2. Retrieve route parameters
  const { projectId } = await params;

  // 3. Verify access to the project
  const hasAccess = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails,
  );
  if (!hasAccess) {
    return forbiddenResponse();
  }

  try {
    // 4. Retrieve specs matching the projectId
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return jsonResponse({
      specs: specs.map((spec) => ({
        id: spec.id,
        projectId: spec.projectId,
        createdAt: spec.createdAt.toISOString(),
        filename: spec.project?.name
          ? `${slugify(spec.project.name)}-spec-${spec.id.substring(0, 6)}.md`
          : `spec-${spec.id.substring(0, 6)}.md`,
      })),
    });
  } catch (error) {
    console.error("Error retrieving specifications list:", error);
    return jsonResponse({ error: "Failed to load specifications" }, 500);
  }
}
