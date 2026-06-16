import { Activity, BarChart3, TrendingUp, RefreshCw } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { MarketPulse } from "@/components/dashboard/market-pulse"
import { MarketTable } from "@/components/market/market-table"
import { Card } from "@/components/ui/card"
import { getActiveProperty } from "@/lib/property"
import { getMarketData, getMarketLastScraped } from "@/lib/queries"
import { formatCurrency } from "@/lib/format"

function formatScrapedAt(iso: string | null): string {
  if (!iso) return "Awaiting first sync"
  const then = new Date(iso)
  const diffMs = Date.now() - then.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default async function MarketPage() {
  const property = await getActiveProperty()
  const [market, lastScraped] = await Promise.all([
    getMarketData(property.city, property.id),
    getMarketLastScraped(property.city),
  ])

  const avgOurs = market.length ? market.reduce((s, d) => s + d.our_price, 0) / market.length : 0
  const avgMarket = market.length ? market.reduce((s, d) => s + d.competitor_price, 0) / market.length : 0
  const delta = avgMarket ? ((avgOurs - avgMarket) / avgMarket) * 100 : 0
  const daysAbove = market.filter((d) => d.our_price > d.competitor_price).length

  const stats = [
    {
      label: "Your Average Rate",
      value: formatCurrency(avgOurs, property.currency),
      icon: TrendingUp,
      hint: "Across the next 14 days",
    },
    {
      label: "Market Average",
      value: formatCurrency(avgMarket, property.currency),
      icon: BarChart3,
      hint: `Competitor set in ${property.city}`,
    },
    {
      label: "Rate Position",
      value: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
      icon: Activity,
      hint: `Priced above market ${daysAbove} of ${market.length} days`,
    },
  ]

  return (
    <AppShell title="Market Intel">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Market Intelligence</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Benchmark your pricing against the competitive set in {property.city} and spot revenue opportunities.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-muted-foreground">Last scraped</span>
              <span className="text-sm font-medium text-foreground">{formatScrapedAt(lastScraped)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-sans text-2xl font-semibold text-foreground">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </Card>
            )
          })}
        </div>

        <MarketPulse data={market} city={property.city} />

        <div>
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Daily Rate Comparison</h2>
          <MarketTable data={market} currency={property.currency} />
        </div>
      </div>
    </AppShell>
  )
}
