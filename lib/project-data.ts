import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { projectSelect } from "@/lib/project-api"
import { slugify } from "@/lib/slugify"
import type { ProjectItem } from "@/lib/types"

export async function getOwnedProjects(): Promise<ProjectItem[]> {
  const { userId } = await auth()
  if (!userId) return []

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  })

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    ownerId: p.ownerId,
    isOwner: true,
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export async function getSharedProjects(): Promise<ProjectItem[]> {
  const { userId } = await auth()
  if (!userId) return []

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return []

  const projects = await prisma.project.findMany({
    where: {
      collaborators: {
        some: { email },
      },
      ownerId: { not: userId },
    },
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  })

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    ownerId: p.ownerId,
    isOwner: false,
    updatedAt: p.updatedAt.toISOString(),
  }))
}
