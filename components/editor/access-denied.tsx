import Link from "next/link"
import { Lock } from "lucide-react"

export function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Lock className="h-8 w-8 text-copy-muted" />
        </div>
        <h1 className="text-xl font-semibold text-copy-primary">Access Denied</h1>
        <p className="max-w-xs text-sm text-copy-secondary">
          You don&apos;t have permission to view this project, or it doesn&apos;t exist.
        </p>
        <Link
          href="/editor"
          className="mt-2 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap text-copy-primary transition-all hover:bg-muted hover:text-foreground"
        >
          Back to Editor
        </Link>
      </div>
    </div>
  )
}
