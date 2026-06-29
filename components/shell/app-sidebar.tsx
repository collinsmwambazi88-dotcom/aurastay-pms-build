"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarRange,
  TrendingUp,
  LineChart,
  BedDouble,
  Sparkles,
  Users,
  Settings,
  Hotel,
  ArrowLeftRight,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StaffRole } from "@/lib/types"
import type { PermissionKey, PermissionMap } from "@/lib/permissions"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /**
   * If set, the item is only shown when the user has this permission granted.
   * Undefined means visible to all authenticated users.
   */
  requiredPermission?: PermissionKey
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Operations", icon: LayoutDashboard, requiredPermission: "revenue.kpis" },
  { href: "/reservations", label: "Reservations", icon: CalendarRange, requiredPermission: "reservations.view" },
  { href: "/inventory", label: "Inventory", icon: BedDouble },
  { href: "/housekeeping", label: "Housekeeping", icon: Sparkles, requiredPermission: "housekeeping.cleaning" },
  { href: "/guests", label: "Guests", icon: Users, requiredPermission: "reservations.view" },
  { href: "/pricing", label: "Rate Manager", icon: TrendingUp, requiredPermission: "rates.calendar" },
  { href: "/market", label: "Market Intel", icon: LineChart, requiredPermission: "revenue.market" },
  { href: "/website", label: "Website Builder", icon: Globe },
]

export function AppSidebar({ permissions, role }: { permissions: PermissionMap; role: StaffRole | null }) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiredPermission || Boolean(permissions[item.requiredPermission]),
  )

  // Settings and Website Builder: only admin / manager
  const showSettings = !role || role === "admin" || role === "manager"
  const showWebsite = !role || role === "admin"

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <Link href="/dashboard" className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5 hover:bg-sidebar-accent/30 transition-colors">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Hotel className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-sans text-base font-semibold text-sidebar-foreground">Innward</span>
          <span className="text-xs text-muted-foreground">Property Suite</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-3 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Manage
        </p>
        {visibleItems.filter((item) => item.href !== "/website" || showWebsite).map((item) => {
          const active = pathname.startsWith(item.href)
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

      <div className="border-t border-sidebar-border p-3 flex flex-col gap-1">
        {showSettings && (
          <Link
            href="/settings"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </Link>
        )}
        <Link
          href="/portal"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/portal"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <ArrowLeftRight className="h-[18px] w-[18px]" />
          Switch Property
        </Link>
      </div>
    </aside>
  )
}
