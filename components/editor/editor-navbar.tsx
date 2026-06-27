"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen, Share2, MessageSquare } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

interface EditorNavbarProps {
  projectName?: string
  isSidebarOpen?: boolean
  onSidebarToggle?: () => void
  onShareClick?: () => void
  className?: string
}

export function EditorNavbar({
  projectName,
  isSidebarOpen = false,
  onSidebarToggle,
  onShareClick,
  className,
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 flex h-14 items-center border-b border-border-default bg-surface px-4",
        className
      )}
    >
      {/* Left section */}
      <div className="flex flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 text-copy-secondary" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-copy-secondary" />
          )}
        </Button>
      </div>

      {/* Center section */}
      <div className="flex flex-1 items-center justify-center">
        {projectName ? (
          <span className="truncate text-sm font-medium text-copy-primary">
            {projectName}
          </span>
        ) : null}
      </div>

      {/* Right section */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="ghost" size="icon" aria-label="Share project" onClick={onShareClick}>
          <Share2 className="h-5 w-5 text-copy-secondary" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Toggle AI sidebar">
          <MessageSquare className="h-5 w-5 text-copy-secondary" />
        </Button>
        <UserButton />
      </div>
    </header>
  )
}
