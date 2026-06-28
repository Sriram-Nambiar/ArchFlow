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
  { params }: { params: Promise<{ projectId: string; specId: string }> },
) {
  // 1. Authenticate user
  const identity = await getClerkIdentity();
  if (!identity) {
    return unauthorizedResponse();
  }

  // 2. Retrieve route parameters
  const { projectId, specId } = await params;

  // 3. Verify access to the project
  const hasAccess = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.emails,
  );
  if (!hasAccess) {
    return forbiddenResponse();
  }

  // 4. Verify spec exists and belongs to this project
  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!spec || spec.projectId !== projectId) {
    return jsonResponse({ error: "Specification not found" }, 404);
  }

  if (!spec.filePath) {
    return jsonResponse({ error: "Specification content is not available yet" }, 400);
  }

  try {
    // 5. Fetch specification content from Vercel Blob using filePath
    const response = await fetch(spec.filePath, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch spec from Vercel Blob: ${response.status} ${response.statusText}`);
      return jsonResponse({ error: "Failed to read specification file" }, 500);
    }

    const fileContent = await response.text();

    return jsonResponse({
      id: spec.id,
      projectId: spec.projectId,
      createdAt: spec.createdAt.toISOString(),
      content: fileContent,
      filename: spec.project?.name
        ? `${slugify(spec.project.name)}-spec-${spec.id.substring(0, 6)}.md`
        : `spec-${spec.id.substring(0, 6)}.md`,
    });
  } catch (error) {
    console.error("Error during specification retrieval:", error);
    return jsonResponse({ error: "An unexpected error occurred during retrieval" }, 500);
  }
}
