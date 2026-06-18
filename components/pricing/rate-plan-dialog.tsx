"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createRatePlan, updateRatePlan, type CreateRatePlanInput, type UpdateRatePlanInput } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { RatePlan } from "@/lib/types"

interface RatePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialPlan?: RatePlan
  propertyId: number
}

export function RatePlanDialog({ open, onOpenChange, mode, initialPlan, propertyId }: RatePlanDialogProps) {
  const [name, setName] = useState(initialPlan?.name ?? "")
  const [description, setDescription] = useState(initialPlan?.description ?? "")
  const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">(initialPlan?.adjustment_type ?? "percentage")
  const [adjustmentValue, setAdjustmentValue] = useState(String(initialPlan?.adjustment_value ?? 0))
  const [includesBreakfast, setIncludesBreakfast] = useState(initialPlan?.includes_breakfast ?? false)
  const [refundable, setRefundable] = useState(initialPlan?.refundable ?? true)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const value = Number(adjustmentValue)
    if (!Number.isFinite(value)) {
      toast.error("Invalid adjustment value")
      return
    }

    startTransition(async () => {
      let result

      if (mode === "create") {
        const input: CreateRatePlanInput = {
          propertyId,
          name,
          description,
          adjustmentType,
          adjustmentValue: value,
          includesBreakfast,
          refundable,
        }
        result = await createRatePlan(input)
      } else if (initialPlan) {
        const input: UpdateRatePlanInput = {
          id: initialPlan.id,
          propertyId,
          name,
          description,
          adjustmentType,
          adjustmentValue: value,
          includesBreakfast,
          refundable,
        }
        result = await updateRatePlan(input)
      }

      if (result?.ok) {
        toast.success(mode === "create" ? "Rate Plan created" : "Rate Plan updated")
        onOpenChange(false)
        // Reset form
        setName("")
        setDescription("")
        setAdjustmentType("percentage")
        setAdjustmentValue("0")
        setIncludesBreakfast(false)
        setRefundable(true)
      } else {
        toast.error(result?.error ?? "Something went wrong")
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen !== open) {
      if (!newOpen && !isPending) {
        // Reset form when closing
        setName(initialPlan?.name ?? "")
        setDescription(initialPlan?.description ?? "")
        setAdjustmentType(initialPlan?.adjustment_type ?? "percentage")
        setAdjustmentValue(String(initialPlan?.adjustment_value ?? 0))
        setIncludesBreakfast(initialPlan?.includes_breakfast ?? false)
        setRefundable(initialPlan?.refundable ?? true)
      }
      onOpenChange(newOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Rate Plan" : "Edit Rate Plan"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new rate plan" : "Update the rate plan details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Honeymoon Special"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Plan details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={3}
              className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(value) => setAdjustmentType(value as "percentage" | "fixed")} disabled={isPending}>
              <SelectTrigger id="adjustment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed ($)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Value */}
          <div className="space-y-2">
            <Label htmlFor="adjustment-value">Adjustment Value</Label>
            <Input
              id="adjustment-value"
              type="number"
              step="0.01"
              placeholder="e.g., -10 or 50"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Negative for discounts (e.g., -10 for 10% off), positive for markups
            </p>
          </div>

          {/* Switches */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="breakfast">Includes Breakfast</Label>
              <Switch
                id="breakfast"
                checked={includesBreakfast}
                onCheckedChange={setIncludesBreakfast}
                disabled={isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="refundable">Refundable</Label>
              <Switch id="refundable" checked={refundable} onCheckedChange={setRefundable} disabled={isPending} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Create"
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
