"use client"

import { useTransition } from "react"
import { CheckCircle2, Loader2, Wrench, Sparkles, BedDouble, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { setHousekeepingStatus } from "@/lib/actions"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { HousekeepingRoom } from "@/lib/types"

export function HousekeepingBoard({ rooms }: { rooms: HousekeepingRoom[] }) {
  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
            <Sparkles className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <p className="text-sm text-muted-foreground">
              Every room is clean and ready. Nothing in the housekeeping queue.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <HousekeepingCard key={room.id} room={room} />
      ))}
    </div>
  )
}

function HousekeepingCard({ room }: { room: HousekeepingRoom }) {
  const [isPending, startTransition] = useTransition()
  const isOOO = room.status === "out_of_order"

  function update(status: "clean" | "dirty" | "out_of_order", message: string) {
    startTransition(async () => {
      await setHousekeepingStatus(room.id, status)
      toast.success(message)
    })
  }

  return (
    <Card className={cn(isPending && "opacity-60")}>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isOOO ? "bg-destructive/10" : "bg-warning/15",
              )}
            >
              <BedDouble className={cn("h-5 w-5", isOOO ? "text-destructive" : "text-warning")} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sans text-lg font-semibold text-foreground">
                Room {room.room_number}
              </span>
              <span className="text-xs text-muted-foreground">
                {room.group_name} &middot; Floor {room.floor}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", isOOO ? "bg-destructive" : "bg-warning")} />
            <span className={isOOO ? "text-destructive" : "text-warning"}>
              {isOOO ? "Out of Order" : "Needs Cleaning"}
            </span>
          </Badge>
        </div>

        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last guest</span>
            <span className="font-medium text-foreground">{room.current_guest ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Checked out</span>
            <span className="font-medium text-foreground">
              {room.last_checkout ? formatDate(room.last_checkout) : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOOO ? (
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => update("dirty", `Room ${room.room_number} returned to the cleaning queue`)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Return to queue
            </Button>
          ) : (
            <>
              <Button
                className="flex-1"
                onClick={() => update("clean", `Room ${room.room_number} marked clean & ready`)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Mark Clean
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent"
                onClick={() => update("out_of_order", `Room ${room.room_number} flagged out of order`)}
                disabled={isPending}
                aria-label={`Flag room ${room.room_number} out of order`}
              >
                <Wrench className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
