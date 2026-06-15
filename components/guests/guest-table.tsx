"use client"

import { useMemo, useState } from "react"
import { Search, Mail, Phone, Crown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { GuestWithStats } from "@/lib/types"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function GuestTable({
  guests,
  currency,
}: {
  guests: GuestWithStats[]
  currency: string
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return guests
    return guests.filter(
      (g) =>
        g.full_name.toLowerCase().includes(q) ||
        (g.email?.toLowerCase().includes(q) ?? false) ||
        (g.phone?.toLowerCase().includes(q) ?? false),
    )
  }, [guests, search])

  // The single highest-value guest gets a VIP marker.
  const topValue = guests.reduce((max, g) => Math.max(max, g.lifetime_value), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests by name, email or phone"
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Stays</TableHead>
              <TableHead className="text-center">Nights</TableHead>
              <TableHead>Last stay</TableHead>
              <TableHead className="text-right">Lifetime value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  {guests.length === 0 ? "No guests recorded yet." : "No guests match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((g) => {
                const isVip = g.lifetime_value > 0 && g.lifetime_value === topValue
                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                            {initials(g.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{g.full_name}</span>
                          {isVip && (
                            <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
                              <Crown className="h-3 w-3" />
                              VIP
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {g.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            {g.email}
                          </span>
                        )}
                        {g.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3" />
                            {g.phone}
                          </span>
                        )}
                        {!g.email && !g.phone && <span>—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{g.total_stays}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{g.total_nights}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.last_stay ? formatDate(g.last_stay) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-sans text-sm font-semibold tabular-nums",
                          g.lifetime_value > 0 ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {formatCurrency(g.lifetime_value, currency)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
