"use client"

import { useState, useTransition, useMemo } from "react"
import { Loader2, TrendingDown, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { dayOfMonth, formatCurrency, weekday, formatDateShort } from "@/lib/format"
import { updateRate, bulkAdjustRates } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import type { RateCalendarRow } from "@/lib/queries"

interface RateCalendarProps {
  dates: string[]
  rows: RateCalendarRow[]
  currency: string
  horizon?: number
}

export function RateCalendar({ dates, rows, currency, horizon = 30 }: RateCalendarProps) {
  // Build month headers for 30+ day views
  const monthHeaders = useMemo(() => {
    if (horizon < 30 || dates.length === 0) return null

    const monthSpans: { month: string; startIdx: number; count: number }[] = []
    let currentMonth = ""
    let currentStart = 0

    dates.forEach((date, idx) => {
      const month = format(new Date(date), "MMMM yyyy")
      if (month !== currentMonth) {
        if (currentMonth && monthSpans.length > 0) {
          monthSpans[monthSpans.length - 1].count = idx - currentStart
        }
        currentMonth = month
        currentStart = idx
        monthSpans.push({ month, startIdx: idx, count: 1 })
      }
    })

    if (monthSpans.length > 0) {
      monthSpans[monthSpans.length - 1].count = dates.length - currentStart
    }

    return monthSpans
  }, [dates, horizon])

  const isCompact = horizon === 365
  const cellPx = isCompact ? "px-1" : "px-2"
  const cellPy = isCompact ? "py-1" : "py-3"
  const textSize = isCompact ? "text-xs" : "text-xs"
  const daySize = isCompact ? "text-xs" : "text-sm"
  const dateColWidth = isCompact ? "min-w-[40px]" : "min-w-[60px]"

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-max border-collapse">
          <thead>
            {/* Month Headers (for 30+ day views) */}
            {monthHeaders && monthHeaders.length > 0 && (
              <tr className="border-b border-border">
                <th className="sticky left-0 z-20 w-44 bg-card" />
                {monthHeaders.map((month, idx) => {
                  const isWeekend = ["Sat", "Sun"].includes(
                    weekday(dates[month.startIdx] || new Date().toISOString().split("T")[0]),
                  )
                  return (
                    <th
                      key={`${month.month}-${idx}`}
                      colSpan={month.count}
                      className={cn(
                        "border-r border-border px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider",
                        isWeekend ? "bg-muted/20" : "bg-muted/5",
                      )}
                    >
                      {month.month}
                    </th>
                  )
                })}
              </tr>
            )}

            {/* Day Headers */}
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
                      `${cellPx} ${cellPy} text-center ${textSize} font-medium ${dateColWidth}`,
                      isWeekend ? "bg-muted/30 text-foreground" : "text-muted-foreground",
                      i === 0 && "bg-primary/5",
                    )}
                  >
                    <div className="uppercase">{weekday(d)}</div>
                    <div className={cn("font-sans font-semibold text-foreground", daySize)}>
                      {dayOfMonth(d)}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RateRow
                key={row.room_group_id}
                row={row}
                dates={dates}
                currency={currency}
                isCompact={isCompact}
                cellPx={cellPx}
                cellPy={cellPy}
                dateColWidth={dateColWidth}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RateRow({
  row,
  dates,
  currency,
  isCompact,
  cellPx,
  cellPy,
  dateColWidth,
}: {
  row: RateCalendarRow
  dates: string[]
  currency: string
  isCompact: boolean
  cellPx: string
  cellPy: string
  dateColWidth: string
}) {
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
          cellPx={cellPx}
          cellPy={cellPy}
          isCompact={isCompact}
          dateColWidth={dateColWidth}
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
  cellPx,
  cellPy,
  isCompact,
  dateColWidth,
}: {
  roomGroupId: number
  stayDate: string
  value: number
  currency: string
  isWeekend: boolean
  isToday: boolean
  cellPx: string
  cellPy: string
  isCompact: boolean
  dateColWidth: string
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

  const inputWidth = isCompact ? "w-10" : "w-16"

  return (
    <td
      className={cn(
        `${cellPx} ${cellPy} text-center ${dateColWidth}`,
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
          className={cn(
            "rounded-md border border-primary bg-background px-1 py-1 text-center font-sans text-sm outline-none",
            inputWidth,
          )}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(value))
            setEditing(true)
          }}
          className={cn(
            "rounded-md px-1 py-1 font-sans text-sm font-medium text-foreground transition-colors hover:bg-accent",
            inputWidth,
            isPending && "opacity-50",
          )}
        >
          {value > 0 ? formatCurrency(value, currency) : "—"}
        </button>
      )}
    </td>
  )
}
