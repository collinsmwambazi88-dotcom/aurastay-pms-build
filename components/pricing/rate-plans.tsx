import { Coffee, Percent, RefreshCcw, Tag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RatePlan } from "@/lib/types"

export function RatePlans({ plans }: { plans: RatePlan[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const isDiscount = plan.adjustment_value < 0
        const sign = plan.adjustment_value > 0 ? "+" : ""
        const adjustmentLabel =
          plan.adjustment_type === "percentage"
            ? `${sign}${plan.adjustment_value}%`
            : `${sign}$${plan.adjustment_value}`
        return (
          <Card key={plan.id} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Tag className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "rounded-md px-2 py-1 font-sans text-sm font-semibold",
                  plan.adjustment_value === 0
                    ? "bg-muted text-muted-foreground"
                    : isDiscount
                      ? "bg-success/15 text-success"
                      : "bg-info/15 text-info",
                )}
              >
                {adjustmentLabel}
              </span>
            </div>
            <div>
              <h3 className="font-sans text-base font-semibold text-foreground">{plan.name}</h3>
              {plan.description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{plan.description}</p>}
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Percent className="h-3 w-3" />
                {plan.adjustment_type === "percentage" ? "Percentage" : "Fixed"}
              </Badge>
              {plan.includes_breakfast && (
                <Badge variant="outline" className="gap-1 text-success">
                  <Coffee className="h-3 w-3" />
                  Breakfast
                </Badge>
              )}
              <Badge variant="outline" className={cn("gap-1", plan.refundable ? "text-info" : "text-muted-foreground")}>
                <RefreshCcw className="h-3 w-3" />
                {plan.refundable ? "Refundable" : "Non-refundable"}
              </Badge>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
