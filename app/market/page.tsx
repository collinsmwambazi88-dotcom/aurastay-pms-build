import { redirect } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { MarketIntelView } from "@/components/market/market-intel-view"
import { ManualScrapeButton } from "@/components/market/manual-scrape-button"
import { getActiveProperty } from "@/lib/property"
import { getMarketIntel } from "@/lib/queries"
import { hasRole } from "@/lib/auth-utils"

function formatScrapedAt(iso: string | null): string {
  if (!iso) return "Awaiting first sync"
  const then = new Date(iso)
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  if (!(await hasRole("admin", "manager", "revenue_manager"))) {
    redirect("/unauthorized")
  }

  const { view } = await searchParams
  const mode = view === "history" ? "history" : "upcoming"

  const property = await getActiveProperty()
  const intel = await getMarketIntel(property.city, property.id, mode)

  return (
    <AppShell title="Market Intel">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Market Intelligence</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live Booking.com pricing for the competitive set in {property.city}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ManualScrapeButton city={property.city} propertyId={property.id} />
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-muted-foreground">Last scraped</span>
                <span className="text-sm font-medium text-foreground">{formatScrapedAt(intel.lastScraped)}</span>
              </div>
            </div>
          </div>
        </div>

        {intel.dates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {mode === "history"
                ? `No historical data found for ${property.city} in the past 7 days.`
                : `No market data yet for ${property.city}. Click below to load competitor pricing.`}
            </p>
            <ManualScrapeButton city={property.city} propertyId={property.id} />
          </div>
        ) : (
          <MarketIntelView intel={intel} currency={property.currency} mode={mode} />
        )}
      </div>
    </AppShell>
  )
}
