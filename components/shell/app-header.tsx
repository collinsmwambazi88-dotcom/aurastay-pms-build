"use client"

import { CalendarDays, Plus, Search } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { PropertySwitcher } from "@/components/shell/property-switcher"
import { useBooking } from "@/components/booking/booking-provider"
import type { Property } from "@/lib/types"

export function AppHeader({
  properties,
  activeId,
  title,
}: {
  properties: Property[]
  activeId: number
  title: string
}) {
  const { open } = useBooking()
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-4">
        <PropertySwitcher properties={properties} activeId={activeId} />
        <div className="hidden h-8 w-px bg-border lg:block" />
        <h1 className="hidden text-lg font-semibold text-foreground lg:block">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
          <CalendarDays className="h-4 w-4" />
          {today}
        </div>
        <Button variant="outline" size="icon" className="hidden sm:inline-flex bg-transparent" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
        <Button onClick={() => open()} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Booking</span>
        </Button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  )
}
