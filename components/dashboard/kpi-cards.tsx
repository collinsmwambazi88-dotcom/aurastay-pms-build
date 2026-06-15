import { Card } from "@/components/ui/card"
import { BedDouble, DollarSign, TrendingUp, Users } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import type { DashboardMetrics } from "@/lib/queries"

export function KpiCards({ metrics, currency }: { metrics: DashboardMetrics; currency: string }) {
  const items = [
    {
      label: "Occupancy",
      value: `${metrics.occupancy.toFixed(0)}%`,
      sub: `${metrics.occupiedRooms} of ${metrics.totalRooms} rooms`,
      icon: BedDouble,
      accent: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      label: "ADR",
      value: formatCurrency(metrics.adr, currency),
      sub: "Average daily rate",
      icon: DollarSign,
      accent: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "RevPAR",
      value: formatCurrency(metrics.revpar, currency),
      sub: "Revenue per available room",
      icon: TrendingUp,
      accent: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      label: "In-House Guests",
      value: String(metrics.inHouseGuests),
      sub: `${metrics.arrivals} arrivals \u00b7 ${metrics.departures} departures`,
      icon: Users,
      accent: "text-chart-5",
      bg: "bg-chart-5/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                <span className="font-sans text-3xl font-semibold tracking-tight text-foreground">{item.value}</span>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                <Icon className={`h-5 w-5 ${item.accent}`} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{item.sub}</p>
          </Card>
        )
      })}
    </div>
  )
}
