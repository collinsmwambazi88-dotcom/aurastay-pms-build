import type { ReactNode } from "react"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { AppHeader } from "@/components/shell/app-header"
import { BookingProvider } from "@/components/booking/booking-provider"
import { getActiveProperty, getProperties } from "@/lib/property"
import { getRoomGroups, getRatePlans, getAddons } from "@/lib/queries"

export async function AppShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const [properties, active] = await Promise.all([getProperties(), getActiveProperty()])
  const [roomGroups, ratePlans, addons] = await Promise.all([
    getRoomGroups(active.id),
    getRatePlans(active.id),
    getAddons(active.id),
  ])

  return (
    <BookingProvider
      propertyId={active.id}
      roomGroups={roomGroups}
      ratePlans={ratePlans}
      addons={addons}
      currency={active.currency}
    >
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader properties={properties} activeId={active.id} title={title} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </BookingProvider>
  )
}
