import { AppShell } from "@/components/shell/app-shell"
import { RateCalendar } from "@/components/pricing/rate-calendar"
import { RatePlans } from "@/components/pricing/rate-plans"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getActiveProperty } from "@/lib/property"
import { getRateCalendar, getRatePlans } from "@/lib/queries"

export default async function PricingPage() {
  const property = await getActiveProperty()
  const [calendar, plans] = await Promise.all([
    getRateCalendar(property.id),
    getRatePlans(property.id),
  ])

  return (
    <AppShell title="Rate Manager">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Rate Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set nightly base rates per room type and manage the rate plans applied at booking.
          </p>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">Rate Calendar</TabsTrigger>
            <TabsTrigger value="plans">Rate Plans</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Click any cell to edit the nightly base rate. Use the arrows to shift a room type by 5% across the window.
            </p>
            <RateCalendar dates={calendar.dates} rows={calendar.rows} currency={property.currency} />
          </TabsContent>
          <TabsContent value="plans" className="mt-4">
            <RatePlans plans={plans} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
