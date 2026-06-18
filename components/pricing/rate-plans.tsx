"use client"

import { useState, useTransition } from "react"
import { Coffee, Edit2, Percent, RefreshCcw, Tag, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { deleteRatePlan } from "@/lib/actions"
import { RatePlanDialog } from "@/components/pricing/rate-plan-dialog"
import type { RatePlan } from "@/lib/types"

export function RatePlans({ plans, propertyId }: { plans: RatePlan[]; propertyId: number }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | undefined>()
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    setSelectedPlan(undefined)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const handleEdit = (plan: RatePlan) => {
    setSelectedPlan(plan)
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const handleDelete = (plan: RatePlan) => {
    startTransition(async () => {
      const result = await deleteRatePlan(plan.id, propertyId)
      if (result.ok) {
        toast.success("Rate Plan deleted")
      } else {
        toast.error(result.error ?? "Failed to delete rate plan")
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-foreground">Rate Plans</h3>
        <Button size="sm" onClick={handleAdd} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rate Plan
        </Button>
      </div>

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
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(plan)}
                    disabled={isPending}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(plan)}
                    disabled={isPending}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-sans text-base font-semibold text-foreground">{plan.name}</h3>
                  {plan.description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{plan.description}</p>}
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 font-sans text-sm font-semibold whitespace-nowrap",
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

      <RatePlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialPlan={selectedPlan}
        propertyId={propertyId}
      />
    </>
  )
}
