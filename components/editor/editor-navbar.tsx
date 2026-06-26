"use client"

import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

interface EditorNavbarProps {
  isSidebarOpen?: boolean
  onSidebarToggle?: () => void
  className?: string
}

export function EditorNavbar({
  isSidebarOpen = false,
  onSidebarToggle,
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
      <div className="flex flex-1 items-center justify-center" />

      {/* Right section */}
      <div className="flex flex-1 items-center justify-end">
        <UserButton />
      </div>
    </header>
  )
}
