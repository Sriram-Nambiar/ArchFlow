"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectItem } from "@/lib/types";

interface ProjectStub {
  id: string;
  name: string;
  ownerId: string;
}

interface EditorWorkspaceClientProps {
  project: ProjectStub;
  isOwner: boolean;
  ownedProjects: ProjectItem[];
  sharedProjects: ProjectItem[];
}

export function EditorWorkspaceClient({
  project,
  isOwner,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
  } = useProjectActions();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <EditorNavbar
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        onShareClick={() => setIsShareOpen(true)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={openCreateDialog}
        onRename={openRenameDialog}
        onDelete={openDeleteDialog}
        activeRoomId={project.id}
      />

      <main className="flex flex-1 overflow-hidden pt-14">
        {/* Canvas area */}
        <div className="relative flex flex-1 overflow-hidden">
          <CanvasWrapper roomId={project.id} />
        </div>

        {/* AI sidebar placeholder */}
        <aside className="hidden w-80 flex-col border-l border-border-default bg-surface lg:flex">
          <div className="flex h-14 items-center border-b border-border-default px-4">
            <h2 className="text-sm font-medium text-copy-primary">
              AI Assistant
            </h2>
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <p className="text-sm text-copy-muted">AI chat coming soon</p>
              <p className="text-xs text-copy-faint mt-1">
                Ask questions about your architecture
              </p>
            </div>
          </div>
        </aside>
      </main>

      <CreateProjectDialog
        open={dialogState.activeDialog === "create"}
        onOpenChange={(open) => {
          if (!open && !dialogState.isLoading) closeDialog();
        }}
        projectName={dialogState.projectName}
        projectSlug={
          dialogState.activeDialog === "create"
            ? roomIdPreview
            : dialogState.projectSlug
        }
        onNameChange={setProjectName}
        onCreate={handleCreate}
        isLoading={dialogState.isLoading}
      />

      <RenameProjectDialog
        open={dialogState.activeDialog === "rename"}
        onOpenChange={(open) => {
          if (!open && !dialogState.isLoading) closeDialog();
        }}
        projectName={dialogState.projectName}
        targetProject={dialogState.targetProject}
        onNameChange={setProjectName}
        onRename={handleRename}
        isLoading={dialogState.isLoading}
      />

      <DeleteProjectDialog
        open={dialogState.activeDialog === "delete"}
        onOpenChange={(open) => {
          if (!open && !dialogState.isLoading) closeDialog();
        }}
        targetProject={dialogState.targetProject}
        onDelete={() => handleDelete()}
        isLoading={dialogState.isLoading}
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={project.id}
        isOwner={isOwner}
      />
    </div>
  );
}
