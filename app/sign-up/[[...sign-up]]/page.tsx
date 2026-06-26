import { SignUp } from "@clerk/nextjs"
import { Code2, GitBranch, Share2, Workflow } from "lucide-react"

const features = [
  { icon: Workflow, text: "Real-time collaborative system design" },
  { icon: GitBranch, text: "Version-controlled architecture diagrams" },
  { icon: Share2, text: "Share and review with your team" },
  { icon: Code2, text: "Export to code in one click" },
]

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh font-[family-name:var(--font-geist-sans)]">
      <div className="hidden w-1/2 flex-col justify-center gap-10 p-12 lg:flex bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,200,212,0.15)_0%,rgba(100,87,249,0.10)_100%)]" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-copy-primary">
            Ghost AI
          </h1>
          <p className="mt-2 text-base text-copy-secondary">
            Design, collaborate, and ship system architectures.
          </p>
        </div>
        <ul className="relative z-10 space-y-5">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-copy-secondary">
              <Icon className="h-4 w-4 shrink-0 text-brand" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full items-center justify-center bg-base p-6 lg:w-1/2">
        <SignUp />
      </div>
    </div>
  )
}
