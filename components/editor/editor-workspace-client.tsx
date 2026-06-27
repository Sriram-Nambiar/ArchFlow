"use client";

import { useState, useCallback } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectItem } from "@/lib/types";
import type { CanvasTemplate } from "./starter-templates";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";

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
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [templateImport, setTemplateImport] = useState<{
    id: number;
    template: CanvasTemplate;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const handleSaveStatusChange = useCallback((status: SaveStatus) => {
    setSaveStatus(status);
  }, []);

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
        onTemplatesClick={() => setIsTemplatesOpen(true)}
        onShareClick={() => setIsShareOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onAiSidebarToggle={() => setIsAiSidebarOpen((prev) => !prev)}
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
        <div className="relative flex flex-1 overflow-hidden">
          <CanvasWrapper
            roomId={project.id}
            projectId={project.id}
            templateImport={templateImport}
            onSaveStatusChange={handleSaveStatusChange}
          />
        </div>

        <AiSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
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

      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={(template) =>
          setTemplateImport({ id: Date.now(), template })
        }
      />
    </div>
  );
}
