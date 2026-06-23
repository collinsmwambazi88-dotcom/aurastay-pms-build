import { SignIn } from "@clerk/nextjs"
import { Hotel } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Hotel className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-sans text-2xl font-semibold text-foreground">AuraStay</h1>
            <p className="text-sm text-muted-foreground">Property Management Suite</p>
          </div>
        </div>

        {/* Clerk component */}
        <SignIn
          forceRedirectUrl="/portal"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-md border border-border rounded-xl bg-card",
              headerTitle: "text-foreground font-semibold",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
              formFieldInput:
                "border-border bg-background text-foreground focus:ring-primary",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
        />
      </div>
    </div>
  )
}
