import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { projectSelect } from "@/lib/project-api";
import { slugify } from "@/lib/slugify";
import type { ProjectItem } from "@/lib/types";
import { normalizeEmails } from "@/lib/email";
import { getClerkIdentity } from "@/lib/project-access";

export async function getOwnedProjects(
  userId?: string,
): Promise<ProjectItem[]> {
  if (!userId) {
    const authResult = await auth();
    userId = authResult.userId ?? undefined;
  }
  if (!userId) return [];

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    ownerId: p.ownerId,
    isOwner: true,
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function getSharedProjects(
  emails?: string[],
  userId?: string,
): Promise<ProjectItem[]> {
  if (!userId || !emails || emails.length === 0) {
    const identity = await getClerkIdentity();
    if (!identity) return [];

    userId = userId ?? identity.userId;
    emails = emails && emails.length > 0 ? emails : identity.emails;
  }

  emails = normalizeEmails(emails);

  if (emails.length === 0) return [];

  const projects = await prisma.project.findMany({
    where: {
      collaborators: {
        some: {
          email: { in: emails },
        },
      },
      ownerId: { not: userId },
    },
    orderBy: { createdAt: "desc" },
    select: {
      ...projectSelect,
      collaborators: {
        select: { email: true },
      },
    },
  });

  return projects
    .filter((p) => {
      const collaboratorEmails = normalizeEmails(
        p.collaborators.map((c) => c.email),
      );

      return collaboratorEmails.some((email) => emails.includes(email));
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: slugify(p.name),
      ownerId: p.ownerId,
      isOwner: false,
      updatedAt: p.updatedAt.toISOString(),
    }));
}
