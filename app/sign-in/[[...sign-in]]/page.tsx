import { SignIn } from "@clerk/nextjs"

const features = [
  "Real-time collaborative system design",
  "Version-controlled architecture diagrams",
  "Share and review with your team",
  "Export to code in one click",
]

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh font-(family-name:--font-geist-sans)">
      <div className="hidden w-1/2 flex-col justify-center gap-10 border-r border-surface-border bg-surface p-12 lg:flex">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-copy-primary">
            Ghost AI
          </h1>
          <p className="mt-2 text-copy-secondary">
            Design, collaborate, and ship system architectures.
          </p>
        </div>
        <ul className="space-y-4 text-sm text-copy-secondary">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full items-center justify-center bg-base p-6 lg:w-1/2">
        <SignIn />
      </div>
    </div>
  )
}
