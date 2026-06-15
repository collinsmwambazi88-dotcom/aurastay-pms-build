import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, weekday } from "@/lib/format"
import type { MarketPoint } from "@/lib/types"

export function MarketTable({ data, currency }: { data: MarketPoint[]; currency: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Your Rate</TableHead>
            <TableHead className="text-right">Market Avg</TableHead>
            <TableHead className="text-right">Difference</TableHead>
            <TableHead className="text-right">Position</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d) => {
            const diff = d.our_price - d.competitor_price
            const pct = d.competitor_price ? (diff / d.competitor_price) * 100 : 0
            const isWeekend = ["Sat", "Sun"].includes(weekday(d.stay_date))
            return (
              <TableRow key={d.stay_date} className={cn(isWeekend && "bg-muted/30")}>
                <TableCell className="font-medium">
                  {formatDate(d.stay_date)}
                  {isWeekend && <span className="ml-2 text-xs text-muted-foreground">Weekend</span>}
                </TableCell>
                <TableCell className="text-right font-sans font-medium">{formatCurrency(d.our_price, currency)}</TableCell>
                <TableCell className="text-right font-sans text-muted-foreground">
                  {formatCurrency(d.competitor_price, currency)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-sans font-medium",
                    diff > 0 ? "text-info" : diff < 0 ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {diff > 0 ? "+" : ""}
                  {formatCurrency(diff, currency)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                      pct > 2
                        ? "bg-info/15 text-info"
                        : pct < -2
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {pct > 2 ? <ArrowUp className="h-3 w-3" /> : pct < -2 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {Math.abs(pct).toFixed(0)}%
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
