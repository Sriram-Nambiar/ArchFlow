export interface MockProject {
  id: string
  name: string
  slug: string
  ownerId: string
  isOwner: boolean
  updatedAt: string
}

const CURRENT_USER_ID = "user_current"

export const mockProjects: MockProject[] = [
  {
    id: "proj_1",
    name: "E-Commerce Platform",
    slug: "e-commerce-platform",
    ownerId: CURRENT_USER_ID,
    isOwner: true,
    updatedAt: "2026-06-25",
  },
  {
    id: "proj_2",
    name: "Microservices Gateway",
    slug: "microservices-gateway",
    ownerId: CURRENT_USER_ID,
    isOwner: true,
    updatedAt: "2026-06-24",
  },
  {
    id: "proj_3",
    name: "Event Processing Pipeline",
    slug: "event-processing-pipeline",
    ownerId: "user_other",
    isOwner: false,
    updatedAt: "2026-06-23",
  },
  {
    id: "proj_4",
    name: "Auth Service",
    slug: "auth-service",
    ownerId: "user_other",
    isOwner: false,
    updatedAt: "2026-06-22",
  },
]

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
