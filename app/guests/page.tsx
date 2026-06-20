import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { GuestTable } from "@/components/guests/guest-table"
import { getActiveProperty } from "@/lib/property"
import { getGuestsWithStats } from "@/lib/queries"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { hasRole } from "@/lib/auth-utils"

export default async function GuestsPage() {
  if (!(await hasRole("admin", "manager", "front_desk", "accounting"))) {
    redirect("/unauthorized")
  }

  const property = await getActiveProperty()
  const guests = await getGuestsWithStats(property.id)

  const totalLtv = guests.reduce((sum, g) => sum + g.lifetime_value, 0)
  const repeatGuests = guests.filter((g) => g.total_stays > 1).length

  const stats = [
    { label: "Total Guests", value: String(guests.length), dot: "bg-foreground" },
    { label: "Repeat Guests", value: String(repeatGuests), dot: "bg-primary" },
    { label: "Lifetime Value", value: formatCurrency(totalLtv, property.currency), dot: "bg-success" },
  ]

  return (
    <AppShell title="Guests">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Guest Database</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every guest who has stayed at {property.name}, ranked by lifetime value.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <span className="font-sans text-2xl font-semibold text-foreground">{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <GuestTable guests={guests} currency={property.currency} />
      </div>
    </AppShell>
  )
}
