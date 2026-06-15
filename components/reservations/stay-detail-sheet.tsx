"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CalendarCheck, CalendarX, DoorOpen, FileText, Loader2, Moon, User } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, nightsBetween } from "@/lib/format"
import { reservationStatusMeta } from "@/lib/status"
import { checkInReservation, checkOutReservation } from "@/lib/actions"
import type { GanttStay } from "@/lib/types"

export function StayDetailSheet({
  stay,
  onOpenChange,
}: {
  stay: GanttStay | null
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<"in" | "out" | null>(null)

  if (!stay) return <Sheet open={false} onOpenChange={onOpenChange} />

  const meta = reservationStatusMeta[stay.status]
  const nights = nightsBetween(stay.check_in, stay.check_out)
  const total = stay.nightly_rate * nights

  function handleCheckIn() {
    setAction("in")
    startTransition(async () => {
      await checkInReservation(stay!.reservation_id)
      toast.success(`${stay!.guest_name} checked in`, { description: `Room ${stay!.room_number} is now occupied` })
      onOpenChange(false)
      setAction(null)
    })
  }

  function handleCheckOut() {
    setAction("out")
    startTransition(async () => {
      await checkOutReservation(stay!.reservation_id)
      toast.success(`${stay!.guest_name} checked out`, { description: `Room ${stay!.room_number} flagged for housekeeping` })
      onOpenChange(false)
      setAction(null)
    })
  }

  return (
    <Sheet open={!!stay} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-left">{stay.guest_name}</SheetTitle>
              <SheetDescription className="text-left">
                Reservation #{stay.reservation_id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div>
            <Badge variant="outline" className={cn("gap-1.5", meta.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailTile icon={DoorOpen} label="Room" value={`${stay.room_number}`} sub={stay.group_name} />
            <DetailTile icon={Moon} label="Nights" value={String(nights)} sub={`${stay.guests_count} guest${stay.guests_count > 1 ? "s" : ""}`} />
            <DetailTile icon={CalendarCheck} label="Check-in" value={formatDate(stay.check_in)} />
            <DetailTile icon={CalendarX} label="Check-out" value={formatDate(stay.check_out)} />
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg bg-muted/60 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Nightly rate</p>
              <p className="font-sans text-sm font-medium text-foreground">{formatCurrency(stay.nightly_rate)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Estimated total</p>
              <p className="font-sans text-lg font-semibold text-foreground">{formatCurrency(total)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {stay.status === "confirmed" && (
              <Button onClick={handleCheckIn} disabled={isPending} className="w-full">
                {isPending && action === "in" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Check in guest
              </Button>
            )}
            {stay.status === "checked_in" && (
              <Button onClick={handleCheckOut} disabled={isPending} className="w-full">
                {isPending && action === "out" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarX className="h-4 w-4" />}
                Check out guest
              </Button>
            )}
            <Button
              variant="outline"
              nativeButton={false}
              className="w-full bg-transparent"
              render={
                <Link href={`/reservations/${stay.reservation_id}`}>
                  <FileText className="h-4 w-4" />
                  View folio
                </Link>
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-sans text-sm font-medium text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
