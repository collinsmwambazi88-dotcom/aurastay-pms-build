"use client"

import { useTransition } from "react"
import { Building2, Check, ChevronsUpDown, MapPin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { setActiveProperty } from "@/lib/actions"
import type { Property } from "@/lib/types"

export function PropertySwitcher({
  properties,
  activeId,
}: {
  properties: Property[]
  activeId: number
}) {
  const [isPending, startTransition] = useTransition()
  const active = properties.find((p) => p.id === activeId) ?? properties[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent",
          isPending && "opacity-60",
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-semibold text-foreground">{active?.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {active?.city}
          </span>
        </div>
        <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Your properties</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {properties.map((p) => (
          <DropdownMenuItem
            key={p.id}
            className="flex items-center gap-2.5 py-2"
            onSelect={() =>
              startTransition(async () => {
                await setActiveProperty(p.id)
              })
            }
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-1 flex-col leading-tight">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.city}</span>
            </div>
            {p.id === activeId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
