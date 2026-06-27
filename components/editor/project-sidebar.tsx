"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Plus, X, Pencil, Trash2 } from "lucide-react"
import type { ProjectItem } from "@/lib/types"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectItem[]
  sharedProjects: ProjectItem[]
  onNewProject: () => void
  onRename: (project: ProjectItem) => void
  onDelete: (project: ProjectItem) => void
  activeRoomId?: string
  className?: string
}

function SidebarProjectItem({
  project,
  onRename,
  onDelete,
  isActive,
}: {
  project: ProjectItem
  onRename: (project: ProjectItem) => void
  onDelete: (project: ProjectItem) => void
  isActive?: boolean
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-subtle",
        isActive && "bg-subtle"
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-brand" />
      )}
      <Link href={`/editor/${project.id}`} className="min-w-0 flex-1 pl-1">
        <p className={cn("truncate text-sm", isActive ? "text-brand font-medium" : "text-copy-primary")}>
          {project.name}
        </p>
        <p className="truncate text-xs text-copy-faint">{project.slug}</p>
      </Link>
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
  activeRoomId,
}: {
  projects: ProjectItem[]
  label: string
  onRename: (project: ProjectItem) => void
  onDelete: (project: ProjectItem) => void
  activeRoomId?: string
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
        <SidebarProjectItem
          key={project.id}
          project={project}
          onRename={onRename}
          onDelete={onDelete}
          isActive={activeRoomId === project.id}
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
  activeRoomId,
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
              activeRoomId={activeRoomId}
            />
          </TabsContent>
          <TabsContent value="shared" className="flex flex-1 flex-col">
            <ProjectList
              projects={sharedProjects}
              label="shared"
              onRename={onRename}
              onDelete={onDelete}
              activeRoomId={activeRoomId}
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
