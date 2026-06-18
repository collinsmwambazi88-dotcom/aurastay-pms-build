"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, weekday } from "@/lib/format"

interface MarketTableProps {
  dates: string[]
  ourRates: Record<string, number>
  competitorRates: Record<string, Record<string, number>>
  selected: string[]
  colorFor: Map<string, string>
  currency: string
}

/**
 * Breakdown of individual competitor prices for a single selected date,
 * benchmarked against our own rate.
 */
export function MarketTable({ dates, ourRates, competitorRates, selected, colorFor, currency }: MarketTableProps) {
  const [activeDate, setActiveDate] = useState(() => dates[0] ?? "")

  const ours = ourRates[activeDate]
  const rows = selected
    .map((hotel) => ({ hotel, price: competitorRates[activeDate]?.[hotel] }))
    .filter((r): r is { hotel: string; price: number } => r.price != null)
    .sort((a, b) => a.price - b.price)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">Competitor Breakdown</h3>
          <p className="text-xs text-muted-foreground">Individual rates for the selected stay date</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Date</span>
          <select
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {formatDate(d)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">vs. Your Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ours != null && (
            <TableRow className="bg-primary/5">
              <TableCell className="font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground" />
                  Your Rate
                </span>
              </TableCell>
              <TableCell className="text-right font-sans font-semibold">{formatCurrency(ours, currency)}</TableCell>
              <TableCell className="text-right text-muted-foreground">—</TableCell>
            </TableRow>
          )}
          {rows.map((r) => {
            const diff = ours != null ? r.price - ours : 0
            return (
              <TableRow key={r.hotel}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorFor.get(r.hotel) ?? "var(--muted-foreground)" }} />
                    <span className="truncate" title={r.hotel}>{r.hotel}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right font-sans">{formatCurrency(r.price, currency)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-sans font-medium",
                    ours == null
                      ? "text-muted-foreground"
                      : diff > 0
                        ? "text-info"
                        : diff < 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                  )}
                >
                  {ours == null ? "—" : `${diff > 0 ? "+" : ""}${formatCurrency(diff, currency)}`}
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                {selected.length === 0 ? "Select competitors to compare." : "No competitor data for this date."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {activeDate && (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {weekday(activeDate)} &middot; {rows.length} competitor{rows.length === 1 ? "" : "s"} shown
        </p>
      )}
    </div>
  )
}
