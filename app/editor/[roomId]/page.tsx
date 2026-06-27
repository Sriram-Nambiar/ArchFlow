import { redirect } from "next/navigation"
import { getClerkIdentity, checkProjectAccess } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client"
import { getOwnedProjects, getSharedProjects } from "@/lib/project-data"

interface EditorWorkspacePageProps {
  params: Promise<{ roomId: string }>
}

export default async function EditorWorkspacePage({ params }: EditorWorkspacePageProps) {
  const { roomId } = await params

  const identity = await getClerkIdentity()
  if (!identity) {
    redirect("/sign-in")
  }

  const hasAccess = await checkProjectAccess(roomId, identity.userId, identity.emails)
  if (!hasAccess) {
    return <AccessDenied />
  }

  const project = await prisma.project.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, ownerId: true },
  })

  if (!project) {
    return <AccessDenied />
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(identity.userId),
    getSharedProjects(identity.emails, identity.userId),
  ])

  return (
    <EditorWorkspaceClient
      project={project}
      isOwner={project.ownerId === identity.userId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
