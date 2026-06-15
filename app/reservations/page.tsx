import { AppShell } from "@/components/shell/app-shell"
import { GanttGrid } from "@/components/reservations/gantt-grid"
import { getActiveProperty } from "@/lib/property"
import { getRoomGroups, getRooms, getGanttStays } from "@/lib/queries"
import { reservationStatusMeta } from "@/lib/status"
import { cn } from "@/lib/utils"

export default async function ReservationsPage() {
  const property = await getActiveProperty()
  const [groups, rooms, stays] = await Promise.all([
    getRoomGroups(property.id),
    getRooms(property.id),
    getGanttStays(property.id),
  ])

  return (
    <AppShell title="Reservations">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Reservation Timeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live room-by-room view of arrivals and stays over the next 14 days. Select a booking to manage check-in.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.values(reservationStatusMeta)
              .filter((m) => m.label !== "Cancelled")
              .map((m) => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full", m.dot)} />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
          </div>
        </div>

        <GanttGrid groups={groups} rooms={rooms} stays={stays} />
      </div>
    </AppShell>
  )
}
