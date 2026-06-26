"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Plus, X } from "lucide-react"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({
  isOpen,
  onClose,
  className,
}: ProjectSidebarProps) {
  return (
    <div
      className={cn(
        "fixed top-14 bottom-0 left-0 z-50 flex w-80 flex-col border-r border-border-default bg-surface transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border-default px-4">
        <h2 className="text-base font-medium text-copy-primary">Projects</h2>
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
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-copy-muted">No projects yet</p>
          </div>
        </TabsContent>
        <TabsContent value="shared" className="flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-copy-muted">No shared projects</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t border-border-default p-4">
        <Button className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  )
}
