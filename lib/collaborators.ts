import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { normalizeEmail } from "@/lib/email"

export interface EnrichedCollaborator {
  email: string
  name: string | null
  avatar: string | null
}

export async function getEnrichedCollaborators(
  projectId: string,
): Promise<EnrichedCollaborator[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      collaborators: {
        select: { email: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!project) return []

  const emails = project.collaborators.map((c) => normalizeEmail(c.email))
  const client = await clerkClient()
  let clerkUsers: Awaited<ReturnType<typeof client.users.getUserList>>['data'] = []

  try {
    const result = await client.users.getUserList({
      emailAddress: emails,
      limit: 100,
    })
    clerkUsers = result.data
  } catch {
    // Clerk API unavailable, fall back to email only
  }

  return emails.map((email) => {
    const clerkUser = clerkUsers.find((u) =>
      u.emailAddresses.some((e) => normalizeEmail(e.emailAddress) === email),
    )

    if (clerkUser) {
      return {
        email,
        name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
        avatar: clerkUser.imageUrl ?? null,
      }
    }

    return { email, name: null, avatar: null }
  })
}

export async function addCollaborator(projectId: string, email: string) {
  await prisma.projectCollaborator.create({
    data: { projectId, email: normalizeEmail(email) },
  })
}

export async function removeCollaborator(projectId: string, email: string) {
  await prisma.projectCollaborator.delete({
    where: {
      projectId_email: { projectId, email: normalizeEmail(email) },
    },
  })
}
