import { AppShell } from "@/components/shell/app-shell"
import { getActiveProperty } from "@/lib/property"
import { getRateCalendar, getRatePlans, getAddons } from "@/lib/queries"
import { PricingPageClient } from "@/components/pricing/pricing-page-client"

export default async function PricingPage() {
  const property = await getActiveProperty()
  const [calendar, plans, addons] = await Promise.all([
    getRateCalendar(property.id, 30),
    getRatePlans(property.id),
    getAddons(property.id),
  ])

  return (
    <AppShell title="Rate Manager">
      <PricingPageClient
        property={property}
        initialCalendar={calendar}
        plans={plans}
        addons={addons}
      />
    </AppShell>
  )
}


