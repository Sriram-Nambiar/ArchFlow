"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { useProjectActions } from "@/hooks/use-project-actions"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProjectItem } from "@/lib/types"

interface EditorHomeClientProps {
  ownedProjects: ProjectItem[]
  sharedProjects: ProjectItem[]
}

export function EditorHomeClient({ ownedProjects, sharedProjects }: EditorHomeClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const {
    dialogState,
    roomIdPreview,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    setProjectName,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions()

  return (
    <div className="flex min-h-dvh flex-col">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={openCreateDialog}
        onRename={openRenameDialog}
        onDelete={openDeleteDialog}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 pt-14">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-medium text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </main>

      <CreateProjectDialog
        open={dialogState.activeDialog === "create"}
        onOpenChange={(open) => { if (!open && !dialogState.isLoading) closeDialog() }}
        projectName={dialogState.projectName}
        projectSlug={dialogState.activeDialog === "create" ? roomIdPreview : dialogState.projectSlug}
        onNameChange={setProjectName}
        onCreate={handleCreate}
        isLoading={dialogState.isLoading}
      />

      <RenameProjectDialog
        open={dialogState.activeDialog === "rename"}
        onOpenChange={(open) => { if (!open && !dialogState.isLoading) closeDialog() }}
        projectName={dialogState.projectName}
        targetProject={dialogState.targetProject}
        onNameChange={setProjectName}
        onRename={handleRename}
        isLoading={dialogState.isLoading}
      />

      <DeleteProjectDialog
        open={dialogState.activeDialog === "delete"}
        onOpenChange={(open) => { if (!open && !dialogState.isLoading) closeDialog() }}
        targetProject={dialogState.targetProject}
        onDelete={() => handleDelete()}
        isLoading={dialogState.isLoading}
      />
    </div>
  )
}
