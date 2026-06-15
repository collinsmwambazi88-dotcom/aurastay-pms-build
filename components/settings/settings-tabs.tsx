import Link from "next/link"
import { Building2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { key: "general", label: "Property", href: "/settings", icon: Building2 },
  { key: "staff", label: "Staff & Access", href: "/settings/staff", icon: Users },
] as const

export function SettingsTabs({ active }: { active: "general" | "staff" }) {
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = tab.key === active
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
