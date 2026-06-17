"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, BarChart3, CheckCircle2, Download, LineChart as LineChartIcon, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MarketTable } from "@/components/market/market-table"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateShort } from "@/lib/format"
import type { MarketIntel } from "@/lib/types"

/** Distinct, light-mode-friendly palette for competitor series. */
const COMPETITOR_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#0ea5e9", // sky
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#a855f7", // purple
]
const OUR_COLOR = "#1e293b" // slate-800, bold primary line

const VOLATILITY_GREEN = "#10b981"

function formatScrapedAt(iso: string | null): string {
  if (!iso) return "Awaiting first sync"
  const then = new Date(iso)
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function MarketIntelView({ intel, currency }: { intel: MarketIntel; currency: string }) {
  const { dates, hotels, ourRates, competitorRates, volatility } = intel

  // Default-select the first four competitors (matches the "4 SEL" reference).
  const [selected, setSelected] = useState<string[]>(() => hotels.slice(0, 4))

  const colorFor = useMemo(() => {
    const map = new Map<string, string>()
    hotels.forEach((h, i) => map.set(h, COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]))
    return map
  }, [hotels])

  function toggle(hotel: string) {
    setSelected((prev) => (prev.includes(hotel) ? prev.filter((h) => h !== hotel) : [...prev, hotel]))
  }

  // Line chart data: one row per date with our rate + each selected competitor.
  const lineData = useMemo(() => {
    return dates.map((date) => {
      const row: Record<string, number | string> = { date, label: formatDateShort(date) }
      if (ourRates[date] != null) row.__our = ourRates[date]
      for (const hotel of selected) {
        const price = competitorRates[date]?.[hotel]
        if (price != null) row[hotel] = price
      }
      return row
    })
  }, [dates, selected, ourRates, competitorRates])

  // Candlestick data spans the FULL scraped set (independent of selection).
  const candleData = useMemo(() => {
    return dates
      .filter((d) => volatility[d])
      .map((date) => {
        const v = volatility[date]
        return {
          date,
          label: formatDateShort(date),
          range: [v.min, v.max] as [number, number],
          ...v,
        }
      })
  }, [dates, volatility])

  function exportCsv() {
    const header = ["Date", "Our Rate", ...selected]
    const lines = dates.map((date) => {
      const cells = [
        date,
        ourRates[date] != null ? String(ourRates[date]) : "",
        ...selected.map((h) => (competitorRates[date]?.[h] != null ? String(competitorRates[date][h]) : "")),
      ]
      return cells.join(",")
    })
    const csv = [header.join(","), ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `market-intel-${intel.city.toLowerCase().replace(/\s+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      {/* ---------- Sidebar ---------- */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market View</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5 text-left"
              aria-pressed="true"
            >
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground">Booking.com</span>
              <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
            </button>
            <p className="mt-2 text-xs text-muted-foreground">Primary competitive data source</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competitors</h2>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {selected.length} SEL
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[320px] pr-3">
              <div className="flex flex-col gap-1">
                {hotels.map((hotel) => {
                  const isSelected = selected.includes(hotel)
                  return (
                    <label
                      key={hotel}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-muted",
                      )}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggle(hotel)} />
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: isSelected ? colorFor.get(hotel) : "var(--muted-foreground)" }}
                      />
                      <span
                        className={cn(
                          "truncate font-medium",
                          isSelected ? "text-foreground" : "text-muted-foreground",
                        )}
                        title={hotel}
                      >
                        {hotel}
                      </span>
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </aside>

      {/* ---------- Main panel ---------- */}
      <div className="flex min-w-0 flex-col gap-4">
        <Tabs defaultValue="trend">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="trend">
                <LineChartIcon className="h-3.5 w-3.5" /> Trend Analysis
              </TabsTrigger>
              <TabsTrigger value="volatility">
                <BarChart3 className="h-3.5 w-3.5" /> Price Volatility
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: VOLATILITY_GREEN }} /> Low Volatility
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Optimal Pricing
              </span>
            </div>
          </div>

          {/* Trend Analysis */}
          <TabsContent value="trend">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between border-b border-border">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">Price Performance</h3>
                  <p className="text-sm text-muted-foreground">Daily price comparison across selected filters</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 bg-transparent">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={lineData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} minTickGap={16} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={52}
                        fontSize={12}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                        content={<TrendTooltip currency={currency} colorFor={colorFor} />}
                      />
                      <Line
                        type="monotone"
                        dataKey="__our"
                        name="Your Rate"
                        stroke={OUR_COLOR}
                        strokeWidth={3}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls
                      />
                      {selected.map((hotel) => (
                        <Line
                          key={hotel}
                          type="monotone"
                          dataKey={hotel}
                          name={hotel}
                          stroke={colorFor.get(hotel)}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend selected={selected} colorFor={colorFor} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Price Volatility */}
          <TabsContent value="volatility">
            <Card>
              <CardHeader className="border-b border-border">
                <h3 className="font-heading text-lg font-semibold text-foreground">Price Shifts &amp; History</h3>
                <p className="text-sm text-muted-foreground">Visualizing price spread across the market</p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[420px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={candleData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} minTickGap={16} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={52}
                        fontSize={12}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<CandleTooltip currency={currency} />} />
                      <Bar dataKey="range" shape={<Candle />} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold text-foreground">Understanding Candles:</span> The vertical line is the
                    full price range (min to max) found that date. The solid block is the &quot;Market Momentum&quot; — the
                    interquartile range (25th–75th percentile) where most competitors price.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Breakdown table for a chosen date */}
        <MarketTable
          dates={dates}
          ourRates={ourRates}
          competitorRates={competitorRates}
          selected={selected}
          colorFor={colorFor}
          currency={currency}
        />
      </div>
    </div>
  )
}

/* ---------- Custom recharts pieces ---------- */

interface CandleShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: { min: number; max: number; p25: number; p75: number }
}

/** Candlestick: wick = min..max (full y/height), body = p25..p75. */
function Candle({ x = 0, y = 0, width = 0, height = 0, payload }: CandleShapeProps) {
  if (!payload) return null
  const { min, max, p25, p75 } = payload
  const span = max - min
  const centerX = x + width / 2
  const valueToY = (v: number) => (span <= 0 ? y + height / 2 : y + (max - v) * (height / span))
  const bodyTop = valueToY(p75)
  const bodyBottom = valueToY(p25)
  const bodyHeight = Math.max(2, bodyBottom - bodyTop)
  const bodyWidth = Math.min(28, Math.max(10, width * 0.55))

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={VOLATILITY_GREEN} strokeWidth={2} />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        rx={2}
        fill={VOLATILITY_GREEN}
      />
    </g>
  )
}

interface TooltipPayloadItem {
  dataKey: string
  name: string
  value: number
  payload: Record<string, number | string>
}

function TrendTooltip({
  active,
  payload,
  currency,
  colorFor,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  currency: string
  colorFor: Map<string, string>
}) {
  if (!active || !payload || payload.length === 0) return null
  const date = payload[0]?.payload?.date as string
  const rows = payload
    .filter((p) => p.value != null)
    .map((p) => ({
      key: p.dataKey,
      label: p.dataKey === "__our" ? "Your Rate" : p.dataKey,
      value: p.value,
      color: p.dataKey === "__our" ? OUR_COLOR : colorFor.get(p.dataKey) ?? "var(--muted-foreground)",
      isOurs: p.dataKey === "__our",
    }))
    .sort((a, b) => a.value - b.value)

  return (
    <div className="min-w-[220px] rounded-xl border border-border bg-popover p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {date ? formatDateShort(date) : ""}
      </p>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className={cn("truncate", r.isOurs ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {r.label}
              </span>
            </span>
            <span className="font-sans font-semibold tabular-nums text-foreground">
              {formatCurrency(r.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandleTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { payload: { date: string; min: number; max: number; p25: number; p75: number; median: number } }[]
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0].payload
  const rows = [
    { label: "High", value: d.max },
    { label: "75th pct", value: d.p75 },
    { label: "Median", value: d.median },
    { label: "25th pct", value: d.p25 },
    { label: "Low", value: d.min },
  ]
  return (
    <div className="min-w-[200px] rounded-xl border border-border bg-popover p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {formatDateShort(d.date)}
      </p>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-sans font-semibold tabular-nums text-foreground">
              {formatCurrency(r.value, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartLegend({ selected, colorFor }: { selected: string[]; colorFor: Map<string, string> }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      <span className="flex items-center gap-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OUR_COLOR }} />
        <span className="font-semibold text-foreground">Your Rate</span>
      </span>
      {selected.map((hotel) => (
        <span key={hotel} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorFor.get(hotel) }} />
          {hotel}
        </span>
      ))}
    </div>
  )
}
