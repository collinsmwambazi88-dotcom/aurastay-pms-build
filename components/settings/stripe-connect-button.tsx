"use client"

import { useTransition } from "react"
import { Loader2, Zap, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getStripeOnboardingLink } from "@/lib/actions"
import { toast } from "sonner"

export function StripeConnectButton({ mode }: { mode: "connect" | "update" }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await getStripeOnboardingLink()
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.error ?? "Could not start Stripe onboarding. Please try again.")
      }
    })
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      variant={mode === "update" ? "outline" : "default"}
      className={mode === "connect" ? "w-full sm:w-auto" : "w-full sm:w-auto bg-transparent"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : mode === "connect" ? (
        <Zap className="h-4 w-4" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {isPending
        ? "Redirecting to Stripe..."
        : mode === "connect"
          ? "Connect Stripe Account"
          : "Update Stripe Account"}
    </Button>
  )
}
