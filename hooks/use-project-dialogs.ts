"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { mockProjects, slugify, type MockProject } from "@/lib/mock-projects"

export type DialogType = "create" | "rename" | "delete" | null

interface ProjectDialogState {
  activeDialog: DialogType
  projectName: string
  projectSlug: string
  targetProject: MockProject | null
  isLoading: boolean
}

interface UseProjectDialogsReturn {
  dialogState: ProjectDialogState
  ownedProjects: MockProject[]
  sharedProjects: MockProject[]
  openCreateDialog: () => void
  openRenameDialog: (project: MockProject) => void
  openDeleteDialog: (project: MockProject) => void
  closeDialog: () => void
  setProjectName: (name: string) => void
  handleCreate: () => void
  handleRename: () => void
  handleDelete: () => void
}

const initialDialogState: ProjectDialogState = {
  activeDialog: null,
  projectName: "",
  projectSlug: "",
  targetProject: null,
  isLoading: false,
}

export function useProjectDialogs(): UseProjectDialogsReturn {
  const [dialogState, setDialogState] = useState<ProjectDialogState>(initialDialogState)
  const [projects, setProjects] = useState<MockProject[]>(mockProjects)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPendingTimeout = useCallback(() => {
    if (pendingTimeoutRef.current !== null) {
      clearTimeout(pendingTimeoutRef.current)
      pendingTimeoutRef.current = null
    }
  }, [])

  useEffect(() => clearPendingTimeout, [clearPendingTimeout])

  const ownedProjects = projects.filter((p) => p.isOwner)
  const sharedProjects = projects.filter((p) => !p.isOwner)

  const openCreateDialog = useCallback(() => {
    clearPendingTimeout()
    setDialogState({
      activeDialog: "create",
      projectName: "",
      projectSlug: "",
      targetProject: null,
      isLoading: false,
    })
  }, [clearPendingTimeout])

  const openRenameDialog = useCallback((project: MockProject) => {
    clearPendingTimeout()
    setDialogState({
      activeDialog: "rename",
      projectName: project.name,
      projectSlug: project.slug,
      targetProject: project,
      isLoading: false,
    })
  }, [clearPendingTimeout])

  const openDeleteDialog = useCallback((project: MockProject) => {
    clearPendingTimeout()
    setDialogState({
      activeDialog: "delete",
      projectName: project.name,
      projectSlug: project.slug,
      targetProject: project,
      isLoading: false,
    })
  }, [clearPendingTimeout])

  const closeDialog = useCallback(() => {
    clearPendingTimeout()
    setDialogState(initialDialogState)
  }, [clearPendingTimeout])

  const setProjectName = useCallback((name: string) => {
    setDialogState((prev) => ({
      ...prev,
      projectName: name,
      projectSlug: slugify(name),
    }))
  }, [])

  const handleCreate = useCallback(() => {
    if (dialogState.isLoading || !dialogState.projectName.trim()) return

    const projectName = dialogState.projectName.trim()
    const projectSlug = dialogState.projectSlug

    clearPendingTimeout()
    setDialogState((prev) => ({ ...prev, isLoading: true }))

    pendingTimeoutRef.current = setTimeout(() => {
      const newProject: MockProject = {
        id: `proj_${Date.now()}`,
        name: projectName,
        slug: projectSlug,
        ownerId: "user_current",
        isOwner: true,
        updatedAt: new Date().toISOString().split("T")[0],
      }
      setProjects((prev) => [newProject, ...prev])
      pendingTimeoutRef.current = null
      setDialogState(initialDialogState)
    }, 500)
  }, [clearPendingTimeout, dialogState.isLoading, dialogState.projectName, dialogState.projectSlug])

  const handleRename = useCallback(() => {
    if (dialogState.isLoading || !dialogState.targetProject || !dialogState.projectName.trim()) return

    const targetProjectId = dialogState.targetProject.id
    const projectName = dialogState.projectName.trim()
    const projectSlug = dialogState.projectSlug

    clearPendingTimeout()
    setDialogState((prev) => ({ ...prev, isLoading: true }))

    pendingTimeoutRef.current = setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjectId
            ? { ...p, name: projectName, slug: projectSlug, updatedAt: new Date().toISOString().split("T")[0] }
            : p
        )
      )
      pendingTimeoutRef.current = null
      setDialogState(initialDialogState)
    }, 500)
  }, [clearPendingTimeout, dialogState.isLoading, dialogState.targetProject, dialogState.projectName, dialogState.projectSlug])

  const handleDelete = useCallback(() => {
    if (dialogState.isLoading || !dialogState.targetProject) return

    const targetProjectId = dialogState.targetProject.id

    clearPendingTimeout()
    setDialogState((prev) => ({ ...prev, isLoading: true }))

    pendingTimeoutRef.current = setTimeout(() => {
      setProjects((prev) => prev.filter((p) => p.id !== targetProjectId))
      pendingTimeoutRef.current = null
      setDialogState(initialDialogState)
    }, 500)
  }, [clearPendingTimeout, dialogState.isLoading, dialogState.targetProject])

  return {
    dialogState,
    ownedProjects,
    sharedProjects,
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
