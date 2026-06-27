"use client"

import { useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { slugify, generateSuffix } from "@/lib/slugify"
import type { ProjectItem } from "@/lib/types"

export type DialogType = "create" | "rename" | "delete" | null

interface ProjectDialogState {
  activeDialog: DialogType
  projectName: string
  projectSlug: string
  targetProject: ProjectItem | null
  isLoading: boolean
}

interface UseProjectActionsReturn {
  dialogState: ProjectDialogState
  roomIdPreview: string
  openCreateDialog: () => void
  openRenameDialog: (project: ProjectItem) => void
  openDeleteDialog: (project: ProjectItem) => void
  closeDialog: () => void
  setProjectName: (name: string) => void
  handleCreate: () => Promise<void>
  handleRename: () => Promise<void>
  handleDelete: (activeProjectId?: string) => Promise<void>
}

const initialDialogState: ProjectDialogState = {
  activeDialog: null,
  projectName: "",
  projectSlug: "",
  targetProject: null,
  isLoading: false,
}

export function useProjectActions(): UseProjectActionsReturn {
  const router = useRouter()
  const [dialogState, setDialogState] = useState<ProjectDialogState>(initialDialogState)
  const createSuffixRef = useRef("")

  const roomIdPreview = dialogState.activeDialog === "create" && dialogState.projectSlug
    ? `${dialogState.projectSlug}-${createSuffixRef.current}`
    : ""

  const openCreateDialog = useCallback(() => {
    createSuffixRef.current = generateSuffix()
    setDialogState({
      activeDialog: "create",
      projectName: "",
      projectSlug: "",
      targetProject: null,
      isLoading: false,
    })
  }, [])

  const openRenameDialog = useCallback((project: ProjectItem) => {
    setDialogState({
      activeDialog: "rename",
      projectName: project.name,
      projectSlug: project.slug,
      targetProject: project,
      isLoading: false,
    })
  }, [])

  const openDeleteDialog = useCallback((project: ProjectItem) => {
    setDialogState({
      activeDialog: "delete",
      projectName: project.name,
      projectSlug: project.slug,
      targetProject: project,
      isLoading: false,
    })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogState(initialDialogState)
  }, [])

  const setProjectName = useCallback((name: string) => {
    setDialogState((prev) => ({
      ...prev,
      projectName: name,
      projectSlug: slugify(name),
    }))
  }, [])

  const handleCreate = useCallback(async () => {
    if (dialogState.isLoading || !dialogState.projectName.trim()) return

    const name = dialogState.projectName.trim()
    const suffix = createSuffixRef.current
    const roomId = `${slugify(name)}-${suffix}`

    setDialogState((prev) => ({ ...prev, isLoading: true }))

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error("Failed to create project")

      const { project } = await res.json()
      closeDialog()
      router.push(`/editor/${project.id}`)
    } catch {
      setDialogState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [dialogState.isLoading, dialogState.projectName, closeDialog, router])

  const handleRename = useCallback(async () => {
    if (dialogState.isLoading || !dialogState.targetProject || !dialogState.projectName.trim()) return

    const targetProjectId = dialogState.targetProject.id
    const name = dialogState.projectName.trim()

    setDialogState((prev) => ({ ...prev, isLoading: true }))

    try {
      const res = await fetch(`/api/projects/${targetProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error("Failed to rename project")

      closeDialog()
      router.refresh()
    } catch {
      setDialogState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [dialogState.isLoading, dialogState.targetProject, dialogState.projectName, closeDialog, router])

  const handleDelete = useCallback(async (activeProjectId?: string) => {
    if (dialogState.isLoading || !dialogState.targetProject) return

    const targetProjectId = dialogState.targetProject.id

    setDialogState((prev) => ({ ...prev, isLoading: true }))

    try {
      const res = await fetch(`/api/projects/${targetProjectId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete project")

      closeDialog()

      if (activeProjectId && targetProjectId === activeProjectId) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch {
      setDialogState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [dialogState.isLoading, dialogState.targetProject, closeDialog, router])

  return {
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
  }
}
