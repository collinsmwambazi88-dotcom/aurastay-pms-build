import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { query } from "@/lib/db"

// Stripe requires the raw request body for signature verification — opt out of
// Next.js body parsing for this route.
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return new Response("Stripe webhook secret not configured", { status: 500 })
  }

  const body = await req.text()
  const headerPayload = await headers()
  const signature = headerPayload.get("stripe-signature")

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  let event: import("stripe").Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[stripe-webhook] Signature verification failed:", message)
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 })
  }

  // ── account.updated ──────────────────────────────────────────────────────
  // Fired whenever a connected account's details change. We use this to mark
  // stripe_onboarding_complete = true once charges and payouts are enabled.
  if (event.type === "account.updated") {
    const account = event.data.object as import("stripe").Stripe.Account

    const chargesEnabled  = account.charges_enabled  ?? false
    const payoutsEnabled  = account.payouts_enabled   ?? false
    const detailsSubmitted = account.details_submitted ?? false

    if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
      await query(
        `UPDATE properties
         SET stripe_onboarding_complete = true
         WHERE stripe_account_id = $1`,
        [account.id],
      )
    } else {
      // Account was disabled or restricted — mark as incomplete
      await query(
        `UPDATE properties
         SET stripe_onboarding_complete = false
         WHERE stripe_account_id = $1`,
        [account.id],
      )
    }
  }

  // ── payment_intent.succeeded ─────────────────────────────────────────────
  // Automatically settle the linked invoice when Stripe confirms the payment.
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as import("stripe").Stripe.PaymentIntent
    const invoiceId = intent.metadata?.invoice_id

    if (invoiceId) {
      await query(
        `UPDATE invoices SET status = 'paid' WHERE id = $1 AND status != 'paid'`,
        [Number(invoiceId)],
      )
    }
  }

  return new Response("OK", { status: 200 })
}
