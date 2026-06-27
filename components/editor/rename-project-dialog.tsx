"use client"

import { useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ProjectItem } from "@/lib/types"

interface RenameProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  targetProject: ProjectItem | null
  onNameChange: (name: string) => void
  onRename: () => void
  isLoading: boolean
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  projectName,
  targetProject,
  onNameChange,
  onRename,
  isLoading,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && projectName.trim()) {
      onRename()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Rename Project</DialogTitle>
        <DialogDescription>
          Rename <span className="text-copy-primary font-medium">&ldquo;{targetProject?.name}&rdquo;</span> to something new.
        </DialogDescription>

        <div className="space-y-1.5 pt-2">
          <label htmlFor="rename-project-name" className="text-xs font-medium text-copy-secondary">
            Project name
          </label>
          <Input
            ref={inputRef}
            id="rename-project-name"
            value={projectName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onRename} disabled={!projectName.trim() || isLoading}>
            {isLoading ? "Renaming…" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
