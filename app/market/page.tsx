import { Activity, BarChart3, TrendingUp } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { MarketPulse } from "@/components/dashboard/market-pulse"
import { MarketTable } from "@/components/market/market-table"
import { Card } from "@/components/ui/card"
import { getActiveProperty } from "@/lib/property"
import { getMarketData } from "@/lib/queries"
import { formatCurrency } from "@/lib/format"

export default async function MarketPage() {
  const property = await getActiveProperty()
  const market = await getMarketData(property.city)

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
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Market Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Benchmark your pricing against the competitive set in {property.city} and spot revenue opportunities.
          </p>
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
