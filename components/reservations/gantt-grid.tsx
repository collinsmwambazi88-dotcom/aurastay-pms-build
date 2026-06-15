"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { dateRange, dayDiff, dayOfMonth, todayISO, weekday } from "@/lib/format"
import { reservationStatusMeta } from "@/lib/status"
import type { GanttStay, Room, RoomGroup } from "@/lib/types"
import { StayDetailSheet } from "./stay-detail-sheet"

const DAYS = 14
const COL_WIDTH = 116 // px per day column
const ROW_HEIGHT = 52

interface GanttGridProps {
  groups: RoomGroup[]
  rooms: Room[]
  stays: GanttStay[]
}

export function GanttGrid({ groups, rooms, stays }: GanttGridProps) {
  const start = todayISO()
  const days = useMemo(() => dateRange(start, DAYS), [start])
  const [selected, setSelected] = useState<GanttStay | null>(null)
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const staysByRoom = useMemo(() => {
    const map = new Map<number, GanttStay[]>()
    for (const s of stays) {
      const arr = map.get(s.room_id) ?? []
      arr.push(s)
      map.set(s.room_id, arr)
    }
    return map
  }, [stays])

  const roomsByGroup = useMemo(() => {
    const map = new Map<number, Room[]>()
    for (const r of rooms) {
      const arr = map.get(r.room_group_id) ?? []
      arr.push(r)
      map.set(r.room_group_id, arr)
    }
    return map
  }, [rooms])

  const gridWidth = DAYS * COL_WIDTH

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex">
          {/* Sticky room label column */}
          <div className="w-44 shrink-0 border-r border-border bg-card">
            <div className="flex h-12 items-center border-b border-border px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rooms
            </div>
            {groups.map((group) => {
              const groupRooms = roomsByGroup.get(group.id) ?? []
              const isCollapsed = collapsed[group.id]
              return (
                <div key={group.id}>
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))}
                    className="flex h-9 w-full items-center gap-1.5 bg-muted/60 px-3 text-left text-xs font-semibold text-foreground"
                  >
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")}
                    />
                    <span className="truncate">{group.name}</span>
                    <span className="ml-auto text-muted-foreground">{groupRooms.length}</span>
                  </button>
                  {!isCollapsed &&
                    groupRooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center border-b border-border px-4"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <span className="font-sans text-sm font-medium text-foreground">{room.room_number}</span>
                        <span className="ml-2 text-xs text-muted-foreground">Fl {room.floor}</span>
                      </div>
                    ))}
                </div>
              )
            })}
          </div>

          {/* Scrollable timeline */}
          <div className="overflow-x-auto">
            <div style={{ width: gridWidth }}>
              {/* Date header */}
              <div className="flex h-12 border-b border-border">
                {days.map((d, i) => {
                  const isToday = i === 0
                  const isWeekend = ["Sat", "Sun"].includes(weekday(d))
                  return (
                    <div
                      key={d}
                      className={cn(
                        "flex flex-col items-center justify-center border-r border-border text-center",
                        isWeekend && "bg-muted/40",
                        isToday && "bg-primary/5",
                      )}
                      style={{ width: COL_WIDTH }}
                    >
                      <span className={cn("text-[11px] uppercase", isToday ? "text-primary" : "text-muted-foreground")}>
                        {weekday(d)}
                      </span>
                      <span
                        className={cn(
                          "font-sans text-sm font-semibold",
                          isToday ? "text-primary" : "text-foreground",
                        )}
                      >
                        {dayOfMonth(d)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Body */}
              {groups.map((group) => {
                const groupRooms = roomsByGroup.get(group.id) ?? []
                const isCollapsed = collapsed[group.id]
                return (
                  <div key={group.id}>
                    <div className="h-9 border-b border-border bg-muted/60" style={{ width: gridWidth }} />
                    {!isCollapsed &&
                      groupRooms.map((room) => (
                        <div
                          key={room.id}
                          className="relative border-b border-border"
                          style={{ height: ROW_HEIGHT, width: gridWidth }}
                        >
                          {/* day cell backgrounds */}
                          <div className="absolute inset-0 flex">
                            {days.map((d, i) => (
                              <div
                                key={d}
                                className={cn(
                                  "border-r border-border",
                                  ["Sat", "Sun"].includes(weekday(d)) && "bg-muted/30",
                                  i === 0 && "bg-primary/5",
                                )}
                                style={{ width: COL_WIDTH }}
                              />
                            ))}
                          </div>
                          {/* reservation bars */}
                          {(staysByRoom.get(room.id) ?? []).map((stay) => {
                            const offset = Math.max(0, dayDiff(start, stay.check_in))
                            const rawEnd = dayDiff(start, stay.check_out)
                            const clampedEnd = Math.min(DAYS, rawEnd)
                            const span = Math.max(1, clampedEnd - offset)
                            const meta = reservationStatusMeta[stay.status]
                            // half-day insets so check-in/out align to mid-cell convention
                            const left = offset * COL_WIDTH + COL_WIDTH / 2
                            const width = span * COL_WIDTH - COL_WIDTH
                            return (
                              <button
                                key={stay.stay_id}
                                type="button"
                                onClick={() => setSelected(stay)}
                                className={cn(
                                  "absolute top-1.5 flex items-center gap-1.5 overflow-hidden rounded-md border px-2 text-left shadow-sm transition-all hover:shadow-md hover:brightness-[0.98]",
                                  meta.bar,
                                )}
                                style={{ left, width: Math.max(width, COL_WIDTH - 16), height: ROW_HEIGHT - 12 }}
                              >
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                                <span className="truncate text-xs font-medium">{stay.guest_name}</span>
                                <span className="ml-auto hidden shrink-0 items-center gap-0.5 text-[11px] opacity-70 sm:flex">
                                  <Users className="h-3 w-3" />
                                  {stay.guests_count}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <StayDetailSheet stay={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  )
}
