"use client"

import { useState, useTransition } from "react"
import { Loader2, TrendingDown, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { dayOfMonth, formatCurrency, weekday } from "@/lib/format"
import { updateRate, bulkAdjustRates } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import type { RateCalendarRow } from "@/lib/queries"

interface RateCalendarProps {
  dates: string[]
  rows: RateCalendarRow[]
  currency: string
}

export function RateCalendar({ dates, rows, currency }: RateCalendarProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 w-44 bg-card px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Room Type
              </th>
              {dates.map((d, i) => {
                const isWeekend = ["Sat", "Sun"].includes(weekday(d))
                return (
                  <th
                    key={d}
                    className={cn(
                      "px-2 py-3 text-center text-xs font-medium",
                      isWeekend ? "bg-muted/40 text-foreground" : "text-muted-foreground",
                      i === 0 && "bg-primary/5",
                    )}
                  >
                    <div className="uppercase">{weekday(d)}</div>
                    <div className="font-sans text-sm font-semibold text-foreground">{dayOfMonth(d)}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RateRow key={row.room_group_id} row={row} dates={dates} currency={currency} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RateRow({ row, dates, currency }: { row: RateCalendarRow; dates: string[]; currency: string }) {
  const [isPending, startTransition] = useTransition()
  const rateMap = new Map(row.rates.map((r) => [r.stay_date, r.base_rate]))
  const values = dates.map((d) => rateMap.get(d) ?? 0)
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0

  function handleBulk(percent: number) {
    startTransition(async () => {
      await bulkAdjustRates(row.room_group_id, percent)
      toast.success(`${row.group_name} rates ${percent > 0 ? "raised" : "lowered"} by ${Math.abs(percent)}%`)
    })
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="sticky left-0 z-10 bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{row.group_name}</p>
            <p className="text-xs text-muted-foreground">avg {formatCurrency(avg, currency)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={isPending}
              onClick={() => handleBulk(-5)}
              aria-label={`Lower ${row.group_name} rates 5%`}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={isPending}
              onClick={() => handleBulk(5)}
              aria-label={`Raise ${row.group_name} rates 5%`}
            >
              <TrendingUp className="h-3 w-3 text-success" />
            </Button>
          </div>
        </div>
      </td>
      {dates.map((d, i) => (
        <RateCell
          key={d}
          roomGroupId={row.room_group_id}
          stayDate={d}
          value={rateMap.get(d) ?? 0}
          currency={currency}
          isWeekend={["Sat", "Sun"].includes(weekday(d))}
          isToday={i === 0}
        />
      ))}
    </tr>
  )
}

function RateCell({
  roomGroupId,
  stayDate,
  value,
  currency,
  isWeekend,
  isToday,
}: {
  roomGroupId: number
  stayDate: string
  value: number
  currency: string
  isWeekend: boolean
  isToday: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const [isPending, startTransition] = useTransition()

  function commit() {
    setEditing(false)
    const next = Number(draft)
    if (!Number.isFinite(next) || next === value) {
      setDraft(String(value))
      return
    }
    startTransition(async () => {
      await updateRate(roomGroupId, stayDate, next)
      toast.success("Rate updated", { description: `${formatCurrency(next, currency)} on ${stayDate}` })
    })
  }

  return (
    <td
      className={cn(
        "px-1 py-2 text-center",
        isWeekend && "bg-muted/30",
        isToday && "bg-primary/5",
      )}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") {
              setDraft(String(value))
              setEditing(false)
            }
          }}
          className="w-16 rounded-md border border-primary bg-background px-1 py-1 text-center font-sans text-sm outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(value))
            setEditing(true)
          }}
          className={cn(
            "w-16 rounded-md px-1 py-1 font-sans text-sm font-medium text-foreground transition-colors hover:bg-accent",
            isPending && "opacity-50",
          )}
        >
          {value > 0 ? formatCurrency(value, currency) : "—"}
        </button>
      )}
    </td>
  )
}
