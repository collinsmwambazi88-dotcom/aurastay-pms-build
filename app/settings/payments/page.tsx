import { redirect } from "next/navigation"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { getActiveProperty } from "@/lib/property"
import { hasRole } from "@/lib/auth-utils"
import { verifyStripeStatus } from "@/lib/actions"
import { StripeConnectButton } from "@/components/settings/stripe-connect-button"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; refresh?: string }>
}) {
  if (!(await hasRole("admin"))) redirect("/unauthorized")

  const [property, params] = await Promise.all([getActiveProperty(), searchParams])

  const justCompleted = params.success === "1"
  const needsRefresh  = params.refresh === "1"

  // Webhook latency fallback: if Stripe redirected back with ?success=1 but the
  // webhook hasn't flipped stripe_onboarding_complete yet, poll Stripe directly.
  if (justCompleted && !property.stripe_onboarding_complete) {
    await verifyStripeStatus(property.id)
    // Re-fetch property so the rest of the render sees the updated state.
    const { getActiveProperty: refetch } = await import("@/lib/property")
    Object.assign(property, await refetch())
  }

  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-6">
        <SettingsTabs active="payments" />

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Stripe Connect</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Connect a Stripe account so guests can pay invoices directly to{" "}
              <span className="font-medium text-foreground">{property.name}</span>.
              AuraStay charges a 2% platform fee per transaction.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            {property.stripe_onboarding_complete ? (
              /* ── Connected state ── */
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Stripe account connected</p>
                    <p className="text-xs text-muted-foreground font-mono">{property.stripe_account_id}</p>
                  </div>
                </div>

                {justCompleted && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400">
                    Onboarding complete. Card payments are now enabled for this property.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <Stat label="Platform fee" value="2% per transaction" />
                  <Stat label="Payouts" value="Directly to your Stripe account" />
                  <Stat label="Status" value="Active" highlight />
                </div>

                {/* Re-enter onboarding to update account details */}
                <StripeConnectButton mode="update" />
              </div>
            ) : (
              /* ── Not connected state ── */
              <div className="flex flex-col gap-4">
                {needsRefresh && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Onboarding was not completed. Click below to try again.
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">Not connected</p>
                  <p className="text-sm text-muted-foreground">
                    Complete Stripe&apos;s guided setup to enable card payments on folios. You will
                    be redirected back here when done.
                  </p>
                </div>

                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {[
                    "Accept card payments on guest invoices",
                    "Funds deposited directly to your bank account",
                    "Stripe handles PCI compliance and fraud protection",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                <StripeConnectButton mode="connect" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-background p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={highlight ? "text-sm font-semibold text-green-600" : "text-sm font-medium text-foreground"}>
        {value}
      </span>
    </div>
  )
}
