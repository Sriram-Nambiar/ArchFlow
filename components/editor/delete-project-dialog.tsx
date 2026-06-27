"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ProjectItem } from "@/lib/types"

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetProject: ProjectItem | null
  onDelete: () => void
  isLoading: boolean
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  targetProject,
  onDelete,
  isLoading,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <span className="text-copy-primary font-medium">&ldquo;{targetProject?.name}&rdquo;</span>? This action cannot be undone.
        </DialogDescription>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading ? "Deleting…" : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
