"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatDateShort } from "@/lib/format"
import type { MarketPoint } from "@/lib/types"

const config = {
  our_price: { label: "Our Rate", color: "var(--chart-1)" },
  competitor_price: { label: "Market Avg", color: "var(--chart-4)" },
} satisfies ChartConfig

export function MarketPulse({ data, city }: { data: MarketPoint[]; city: string }) {
  const chartData = data.map((d) => ({
    date: formatDateShort(d.stay_date),
    our_price: d.our_price,
    competitor_price: d.competitor_price,
  }))

  const avgOurs = data.length ? data.reduce((s, d) => s + d.our_price, 0) / data.length : 0
  const avgMarket = data.length ? data.reduce((s, d) => s + d.competitor_price, 0) / data.length : 0
  const delta = avgMarket ? ((avgOurs - avgMarket) / avgMarket) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Market Pulse</CardTitle>
            <CardDescription>
              Your rates vs. competitor average in {city} &middot; next 14 days
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Rate position</p>
            <p
              className={`font-sans text-lg font-semibold ${
                delta >= 0 ? "text-chart-2" : "text-destructive"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[260px] w-full">
          <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fillOurs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-our_price)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-our_price)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillMarket" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-competitor_price)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-competitor_price)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={44}
              fontSize={12}
              tickFormatter={(v) => `$${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              type="monotone"
              dataKey="competitor_price"
              stroke="var(--color-competitor_price)"
              fill="url(#fillMarket)"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="our_price"
              stroke="var(--color-our_price)"
              fill="url(#fillOurs)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
