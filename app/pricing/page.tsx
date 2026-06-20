import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { getActiveProperty } from "@/lib/property"
import { getRateCalendar, getRatePlans, getAddons } from "@/lib/queries"
import { PricingPageClient } from "@/components/pricing/pricing-page-client"
import { hasRole } from "@/lib/auth-utils"

export default async function PricingPage() {
  if (!(await hasRole("admin", "manager", "revenue_manager"))) {
    redirect("/unauthorized")
  }
  const property = await getActiveProperty()
  const [calendar, plans, addons] = await Promise.all([
    getRateCalendar(property.id, 30),
    getRatePlans(property.id),
    getAddons(property.id),
  ])

  return (
    <AppShell title="Rate Manager">
      <PricingPageClient
        propertyId={property.id}
        currency={property.currency}
        initialCalendar={calendar}
        plans={plans}
        addons={addons}
      />
    </AppShell>
  )
}


