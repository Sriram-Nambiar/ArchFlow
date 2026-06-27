"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  projectSlug: string
  onNameChange: (name: string) => void
  onCreate: () => void
  isLoading: boolean
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  projectName,
  projectSlug,
  onNameChange,
  onCreate,
  isLoading,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Create Project</DialogTitle>
        <DialogDescription>
          Give your architecture project a name.
        </DialogDescription>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="text-xs font-medium text-copy-secondary">
              Project name
            </label>
            <Input
              id="project-name"
              placeholder="e.g. Payment System"
              value={projectName}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
                disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-copy-faint">Slug preview</p>
            <div className="rounded-xl border border-border-default bg-subtle px-3 py-2 font-mono text-xs text-copy-muted">
              {projectSlug || "—"}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!projectName.trim() || isLoading}>
            {isLoading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
