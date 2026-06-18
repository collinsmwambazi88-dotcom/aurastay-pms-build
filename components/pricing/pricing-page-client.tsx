"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { RateCalendar } from "@/components/pricing/rate-calendar"
import { RatePlans } from "@/components/pricing/rate-plans"
import { AddonManager } from "@/components/pricing/addon-manager"
import { BulkRateEditor } from "@/components/pricing/bulk-rate-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getRateCalendar } from "@/lib/queries"
import type { RateCalendarRow } from "@/lib/queries"

interface PricingPageClientProps {
  property: any
  initialCalendar: { dates: string[]; rows: RateCalendarRow[] }
  plans: any[]
  addons: any[]
}

export function PricingPageClient({
  property,
  initialCalendar,
  plans,
  addons,
}: PricingPageClientProps) {
  const [horizon, setHorizon] = useState(30)
  const [calendar, setCalendar] = useState(initialCalendar)
  const [isPending, startTransition] = useTransition()

  const handleHorizonChange = (days: number) => {
    if (days === horizon) return
    setHorizon(days)
    startTransition(async () => {
      const result = await getRateCalendar(property.id, days)
      setCalendar(result)
    })
  }

  const horizonOptions = [
    { label: "1W", days: 7 },
    { label: "14D", days: 14 },
    { label: "1M", days: 30 },
    { label: "1Y", days: 365 },
  ]

  return (
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
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Click any cell to edit the nightly base rate. Use the arrows to shift a room type by 5% across the window, or use Bulk Update Rates for long-term pricing strategy.
              </p>
              <BulkRateEditor
                propertyId={property.id}
                roomGroups={calendar.rows}
                currency={property.currency}
                horizon={horizon}
              />
            </div>

            {/* Horizon Selector */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
              {horizonOptions.map(({ label, days }) => (
                <Button
                  key={days}
                  variant={horizon === days ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleHorizonChange(days)}
                  disabled={isPending}
                  className="min-w-12"
                >
                  {isPending && horizon === days ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    label
                  )}
                </Button>
              ))}
            </div>
          </div>

          <RateCalendar
            dates={calendar.dates}
            rows={calendar.rows}
            currency={property.currency}
            horizon={horizon}
          />
        </TabsContent>
        <TabsContent value="plans" className="mt-4">
          <RatePlans plans={plans} />
        </TabsContent>
        <TabsContent value="addons" className="mt-4">
          <AddonManager propertyId={property.id} addons={addons} currency={property.currency} />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
