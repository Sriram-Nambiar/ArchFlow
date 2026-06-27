import { getOwnedProjects, getSharedProjects } from "@/lib/project-data"
import { EditorHomeClient } from "@/components/editor/editor-home-client"

export default async function EditorPage() {
  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ])

  return (
    <EditorHomeClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
