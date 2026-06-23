import Link from "next/link"
import { ShieldOff, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-sans text-2xl font-semibold text-foreground">Access Denied</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You don&apos;t have permission to view this page. Contact your property administrator
            if you believe this is a mistake.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
