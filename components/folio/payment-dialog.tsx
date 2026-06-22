"use client"

import { useCallback, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, LockKeyhole } from "lucide-react"

// Initialise once outside render to avoid re-instantiation
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
)

// ─── Inner form — lives inside <Elements> so it can use stripe hooks ─────────

function CheckoutForm({
  amountFormatted,
  currency,
  onSuccess,
  onClose,
}: {
  amountFormatted: string
  currency: string
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!stripe || !elements) return

      setSubmitting(true)
      setErrorMessage(null)

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // No redirect — we handle success inline
          return_url: window.location.href,
        },
        redirect: "if_required",
      })

      if (error) {
        setErrorMessage(error.message ?? "Payment failed. Please try again.")
        setSubmitting(false)
      } else {
        onSuccess()
      }
    },
    [stripe, elements, onSuccess],
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Stripe PaymentElement — renders card, Apple Pay, etc. */}
      <div className="rounded-xl border border-border bg-background p-4">
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "auto", googlePay: "auto" },
          }}
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {/* Security badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
        <span>Payments are encrypted and secured by Stripe</span>
      </div>

      <DialogFooter showCloseButton={false}>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="bg-transparent"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || submitting} className="min-w-32 gap-2">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Pay {amountFormatted}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientSecret: string
  /** Display amount, e.g. "USD 1,250.00" */
  amountFormatted: string
  currency: string
  onSuccess: () => void
}

export function PaymentDialog({
  open,
  onOpenChange,
  clientSecret,
  amountFormatted,
  currency,
  onSuccess,
}: PaymentDialogProps) {
  const appearance: import("@stripe/stripe-js").Appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#4f46e5",       // indigo-600 — matches --primary
      colorBackground: "#ffffff",
      colorText: "#1e1b4b",
      colorDanger: "#ef4444",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "8px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: "1px solid #e2e8f0",
        boxShadow: "none",
        padding: "10px 12px",
      },
      ".Input:focus": {
        outline: "none",
        borderColor: "#4f46e5",
        boxShadow: "0 0 0 3px rgba(79,70,229,0.15)",
      },
      ".Label": {
        fontWeight: "500",
        fontSize: "12px",
        marginBottom: "6px",
        color: "#64748b",
      },
      ".Tab": {
        borderRadius: "8px",
      },
      ".Tab--selected": {
        borderColor: "#4f46e5",
        boxShadow: "0 0 0 1px #4f46e5",
      },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <LockKeyhole className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Secure Card Payment</DialogTitle>
              <DialogDescription className="mt-0.5">
                {amountFormatted} — powered by Stripe
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance,
            fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" }],
          }}
        >
          <CheckoutForm
            amountFormatted={amountFormatted}
            currency={currency}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}
