import {
  badRequestResponse,
  forbiddenResponse,
  jsonResponse,
  unauthorizedResponse,
  getProjectOwnerId,
} from "@/lib/project-api"
import {
  getEnrichedCollaborators,
  addCollaborator,
  removeCollaborator,
} from "@/lib/collaborators"
import { checkProjectAccess, getClerkIdentity } from "@/lib/project-access"
import { normalizeEmail } from "@/lib/email"

async function getAuth() {
  return getClerkIdentity()
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getAuth()
  if (!identity) return unauthorizedResponse()

  const { projectId } = await params
  const ownerId = await getProjectOwnerId(projectId)
  if (!ownerId) return jsonResponse({ error: "Project not found" }, 404)

  const hasAccess = await checkProjectAccess(projectId, identity.userId, identity.emails)
  if (!hasAccess) return forbiddenResponse()

  const collaborators = await getEnrichedCollaborators(projectId)
  return jsonResponse({ collaborators })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getAuth()
  if (!identity) return unauthorizedResponse()

  const { projectId } = await params
  const ownerId = await getProjectOwnerId(projectId)
  if (!ownerId) return jsonResponse({ error: "Project not found" }, 404)
  if (ownerId !== identity.userId) return forbiddenResponse()

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("Invalid JSON body")
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return badRequestResponse("Email is required")
  }

  const email = normalizeEmail(body.email)
  if (!email.includes("@")) {
    return badRequestResponse("Invalid email address")
  }

  try {
    await addCollaborator(projectId, email)
  } catch {
    return jsonResponse({ error: "Collaborator already exists" }, 409)
  }

  const collaborators = await getEnrichedCollaborators(projectId)
  return jsonResponse({ collaborators })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getAuth()
  if (!identity) return unauthorizedResponse()

  const { projectId } = await params
  const ownerId = await getProjectOwnerId(projectId)
  if (!ownerId) return jsonResponse({ error: "Project not found" }, 404)
  if (ownerId !== identity.userId) return forbiddenResponse()

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("Invalid JSON body")
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return badRequestResponse("Email is required")
  }

  const email = normalizeEmail(body.email)

  try {
    await removeCollaborator(projectId, email)
  } catch {
    return jsonResponse({ error: "Collaborator not found" }, 404)
  }

  const collaborators = await getEnrichedCollaborators(projectId)
  return jsonResponse({ collaborators })
}
