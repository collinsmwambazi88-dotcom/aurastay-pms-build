import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { HousekeepingBoard } from "@/components/housekeeping/housekeeping-board"
import { getActiveProperty } from "@/lib/property"
import { getHousekeepingQueue, getInventorySummary } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { hasPermission } from "@/lib/auth-utils"

export default async function HousekeepingPage() {
  if (!(await hasPermission("housekeeping.cleaning"))) {
    redirect("/unauthorized")
  }

  const property = await getActiveProperty()
  const [queue, summary] = await Promise.all([
    getHousekeepingQueue(property.id),
    getInventorySummary(property.id),
  ])

  const stats = [
    { label: "Needs Cleaning", value: summary.dirty, dot: "bg-warning" },
    { label: "Out of Order", value: summary.out_of_order, dot: "bg-destructive" },
    { label: "Clean & Ready", value: summary.clean, dot: "bg-success" },
    { label: "Occupied", value: summary.occupied, dot: "bg-primary" },
  ]

  return (
    <AppShell title="Housekeeping">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Housekeeping</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The cleaning queue for {property.name}. Mark rooms clean as they are turned over.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <span className="font-sans text-2xl font-semibold text-foreground">{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <HousekeepingBoard rooms={queue} />
      </div>
    </AppShell>
  )
}
