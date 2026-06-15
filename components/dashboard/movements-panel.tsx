"use client"

import { useTransition } from "react"
import { LogIn, LogOut, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { checkInReservation, checkOutReservation } from "@/lib/actions"
import { toast } from "sonner"
import type { ArrivalDeparture } from "@/lib/queries"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function MovementsPanel({
  arrivals,
  departures,
}: {
  arrivals: ArrivalDeparture[]
  departures: ArrivalDeparture[]
}) {
  const [isPending, startTransition] = useTransition()

  const handleCheckIn = (id: number, name: string) =>
    startTransition(async () => {
      await checkInReservation(id)
      toast.success(`${name} checked in`)
    })

  const handleCheckOut = (id: number, name: string) =>
    startTransition(async () => {
      await checkOutReservation(id)
      toast.success(`${name} checked out`)
    })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <LogIn className="h-4 w-4 text-chart-2" />
            Arrivals Today
          </CardTitle>
          <span className="rounded-full bg-chart-2/10 px-2.5 py-0.5 text-xs font-medium text-chart-2">
            {arrivals.length}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {arrivals.length === 0 && <EmptyRow label="No arrivals scheduled" />}
          {arrivals.map((a) => (
            <div
              key={a.reservation_id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-xs">{initials(a.guest_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{a.guest_name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.group_name} &middot; Room {a.room_number}
                </p>
              </div>
              <Button
                size="sm"
                variant={a.status === "checked_in" ? "secondary" : "default"}
                disabled={isPending || a.status === "checked_in"}
                onClick={() => handleCheckIn(a.reservation_id, a.guest_name)}
              >
                {a.status === "checked_in" ? "Checked in" : "Check in"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-4 w-4 text-chart-4" />
            Departures Today
          </CardTitle>
          <span className="rounded-full bg-chart-4/10 px-2.5 py-0.5 text-xs font-medium text-chart-4">
            {departures.length}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {departures.length === 0 && <EmptyRow label="No departures scheduled" />}
          {departures.map((d) => (
            <div
              key={d.reservation_id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-xs">{initials(d.guest_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{d.guest_name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.group_name} &middot; Room {d.room_number}
                </p>
              </div>
              <Button
                size="sm"
                variant={d.status === "checked_out" ? "secondary" : "outline"}
                disabled={isPending || d.status === "checked_out"}
                onClick={() => handleCheckOut(d.reservation_id, d.guest_name)}
              >
                {d.status === "checked_out" ? "Checked out" : "Check out"}
                {d.status !== "checked_out" && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
      {label}
    </div>
  )
}
