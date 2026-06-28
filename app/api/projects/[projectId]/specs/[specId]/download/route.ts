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
      return jsonResponse({ error: "Failed to download specification file" }, 500);
    }

    const fileContent = await response.text();

    // 6. Generate a dynamic, safe filename using the project name
    const filename = spec.project?.name
      ? `${slugify(spec.project.name)}-specification.md`
      : "specification.md";

    // 7. Return spec as downloadable Markdown attachment
    return new Response(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error during specification download:", error);
    return jsonResponse({ error: "An unexpected error occurred during download" }, 500);
  }
}
