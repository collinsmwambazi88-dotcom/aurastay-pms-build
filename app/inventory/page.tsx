import { AppShell } from "@/components/shell/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InventoryActions } from "@/components/inventory/inventory-actions"
import { getActiveProperty } from "@/lib/property"
import { getRoomGroups, getRoomsWithGroups, getInventorySummary } from "@/lib/queries"
import { roomStatusMeta } from "@/lib/status"
import { cn } from "@/lib/utils"

export default async function InventoryPage() {
  const property = await getActiveProperty()
  const [roomGroups, rooms, summary] = await Promise.all([
    getRoomGroups(property.id),
    getRoomsWithGroups(property.id),
    getInventorySummary(property.id),
  ])

  const stats = [
    { label: "Total Rooms", value: summary.total, dot: "bg-foreground" },
    { label: "Clean", value: summary.clean, dot: "bg-success" },
    { label: "Occupied", value: summary.occupied, dot: "bg-primary" },
    { label: "Needs Cleaning", value: summary.dirty, dot: "bg-warning" },
    { label: "Out of Order", value: summary.out_of_order, dot: "bg-destructive" },
  ]

  return (
    <AppShell title="Inventory">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-sans text-2xl font-semibold text-foreground">Inventory</h2>
            <p className="text-sm text-muted-foreground">
              Manage room categories and physical units across {property.name}.
            </p>
          </div>
          <InventoryActions propertyId={property.id} roomGroups={roomGroups} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

        <Card>
          <CardContent className="p-0">
            {rooms.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <p className="text-sm font-medium text-foreground">No rooms yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a room group, then add rooms to start selling inventory.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead className="text-right">Housekeeping status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => {
                    const meta = roomStatusMeta[room.status]
                    return (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium text-foreground">{room.room_number}</TableCell>
                        <TableCell className="text-muted-foreground">{room.group_name}</TableCell>
                        <TableCell className="text-muted-foreground">{room.floor}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                            <span className={meta.className}>{meta.label}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
