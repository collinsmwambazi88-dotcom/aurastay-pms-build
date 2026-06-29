import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { MarketPulse } from "@/components/dashboard/market-pulse"
import { MovementsPanel } from "@/components/dashboard/movements-panel"
import { InventoryStatus } from "@/components/dashboard/inventory-status"
import { JudgeBanner } from "@/components/dashboard/judge-banner"
import { getActiveProperty } from "@/lib/property"
import { hasPermission } from "@/lib/auth-utils"
import {
  getDashboardMetrics,
  getTodayMovements,
  getInventorySummary,
  getMarketData,
} from "@/lib/queries"

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ judge?: string }>
}) {
  // Smart permission guard: dashboard requires revenue.kpis.
  // If denied, redirect to the first feature the user can access.
  if (!(await hasPermission("revenue.kpis"))) {
    if (await hasPermission("housekeeping.cleaning")) redirect("/housekeeping")
    if (await hasPermission("reservations.view")) redirect("/reservations")
    redirect("/unauthorized")
  }

  const { judge } = await searchParams
  const isJudge = judge === "1"

  const property = await getActiveProperty()
  const [metrics, movements, inventory, market] = await Promise.all([
    getDashboardMetrics(property.id),
    getTodayMovements(property.id),
    getInventorySummary(property.id),
    getMarketData(property.city, property.id),
  ])

  return (
    <AppShell title="Operations">
      <div className="flex flex-col gap-6">
        {isJudge && <JudgeBanner propertyName={property.name} />}
        <div>
          <h2 className="font-sans text-2xl font-semibold text-foreground">Good day at {property.name}</h2>
          <p className="text-sm text-muted-foreground">
            Here is how your property is performing today.
          </p>
        </div>

        <KpiCards metrics={metrics} currency={property.currency} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <MarketPulse data={market} city={property.city} />
          </div>
          <InventoryStatus summary={inventory} />
        </div>

        <MovementsPanel arrivals={movements.arrivals} departures={movements.departures} />
      </div>
    </AppShell>
  )
}
