import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventorySummary } from "@/lib/queries"

const SEGMENTS = [
  { key: "clean", label: "Clean & Ready", color: "bg-chart-2", text: "text-chart-2" },
  { key: "occupied", label: "Occupied", color: "bg-chart-1", text: "text-chart-1" },
  { key: "dirty", label: "Needs Cleaning", color: "bg-chart-4", text: "text-chart-4" },
  { key: "out_of_order", label: "Out of Order", color: "bg-destructive", text: "text-destructive" },
] as const

export function InventoryStatus({ summary }: { summary: InventorySummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Room Inventory</CardTitle>
        <CardDescription>{summary.total} units across the property</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {SEGMENTS.map((s) => {
            const value = summary[s.key]
            const pct = summary.total ? (value / summary.total) * 100 : 0
            if (pct === 0) return null
            return <div key={s.key} className={s.color} style={{ width: `${pct}%` }} />
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SEGMENTS.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <div className="flex flex-col">
                <span className={`font-sans text-xl font-semibold ${s.text}`}>{summary[s.key]}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
