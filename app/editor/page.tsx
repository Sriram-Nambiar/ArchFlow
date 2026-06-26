import { EditorNavbar } from "@/components/editor/editor-navbar"

export default function EditorPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <EditorNavbar />
      <main className="flex flex-1 items-center justify-center pt-14">
        <p className="text-copy-muted">Canvas coming soon</p>
      </main>
    </div>
  )
}
