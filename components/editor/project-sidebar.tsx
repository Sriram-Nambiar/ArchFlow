"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Plus, X, Pencil, Trash2 } from "lucide-react"
import type { MockProject } from "@/lib/mock-projects"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: MockProject[]
  sharedProjects: MockProject[]
  onNewProject: () => void
  onRename: (project: MockProject) => void
  onDelete: (project: MockProject) => void
  className?: string
}

function ProjectItem({
  project,
  onRename,
  onDelete,
}: {
  project: MockProject
  onRename: (project: MockProject) => void
  onDelete: (project: MockProject) => void
}) {
  return (
    <div className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-subtle">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-copy-primary">{project.name}</p>
        <p className="truncate text-xs text-copy-faint">{project.slug}</p>
      </div>
      {project.isOwner && (
        <div className="ml-2 flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRename(project)}
            aria-label="Rename project"
          >
            <Pencil className="h-3.5 w-3.5 text-copy-muted" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(project)}
            aria-label="Delete project"
          >
            <Trash2 className="h-3.5 w-3.5 text-state-error" />
          </Button>
        </div>
      )}
    </div>
  )
}

function ProjectList({
  projects,
  label,
  onRename,
  onDelete,
}: {
  projects: MockProject[]
  label: string
  onRename: (project: MockProject) => void
  onDelete: (project: MockProject) => void
}) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-copy-muted">No {label} projects</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onNewProject,
  onRename,
  onDelete,
  className,
}: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop scrim for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed top-14 bottom-0 left-0 z-50 flex w-80 flex-col rounded-r-2xl border-r border-border-default bg-surface/95 backdrop-blur-md transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border-default px-4">
          <h2 className="font-medium text-foreground">Projects</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-copy-secondary" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="flex flex-1 flex-col">
          <div className="border-b border-border-default px-4 pt-4">
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="my-projects" className="flex flex-1 flex-col">
            <ProjectList
              projects={ownedProjects}
              label=""
              onRename={onRename}
              onDelete={onDelete}
            />
          </TabsContent>
          <TabsContent value="shared" className="flex flex-1 flex-col">
            <ProjectList
              projects={sharedProjects}
              label="shared"
              onRename={onRename}
              onDelete={onDelete}
            />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border-default p-4">
          <Button className="w-full gap-2" onClick={onNewProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
    </>
  )
}
