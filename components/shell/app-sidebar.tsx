"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarRange,
  TrendingUp,
  LineChart,
  Settings,
  Hotel,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Operations", icon: LayoutDashboard },
  { href: "/reservations", label: "Reservations", icon: CalendarRange },
  { href: "/pricing", label: "Rate Manager", icon: TrendingUp },
  { href: "/market", label: "Market Intel", icon: LineChart },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Hotel className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-sans text-base font-semibold text-sidebar-foreground">AuraStay</span>
          <span className="text-xs text-muted-foreground">Property Suite</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Manage
        </p>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </button>
      </div>
    </aside>
  )
}
