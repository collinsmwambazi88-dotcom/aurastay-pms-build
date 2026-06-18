"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { bulkUpdateBaseRates } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { RateCalendarRow } from "@/lib/queries"

interface BulkRateEditorProps {
  propertyId: number
  roomGroups: RateCalendarRow[]
  currency: string
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function BulkRateEditor({ propertyId, roomGroups, currency }: BulkRateEditorProps) {
  const [open, setOpen] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set())
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])) // Default: Mon-Fri
  const [baseRate, setBaseRate] = useState("")
  const [isPending, setIsPending] = useState(false)

  function toggleRoom(roomId: number) {
    const next = new Set(selectedRooms)
    if (next.has(roomId)) {
      next.delete(roomId)
    } else {
      next.add(roomId)
    }
    setSelectedRooms(next)
  }

  function toggleDay(day: number) {
    const next = new Set(selectedDays)
    if (next.has(day)) {
      next.delete(day)
    } else {
      next.add(day)
    }
    setSelectedDays(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedRooms.size === 0) {
      toast.error("Select at least one room type")
      return
    }
    if (!startDate || !endDate) {
      toast.error("Select a date range")
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date")
      return
    }
    if (selectedDays.size === 0) {
      toast.error("Select at least one day of week")
      return
    }
    if (!baseRate || Number(baseRate) < 0) {
      toast.error("Enter a valid base rate")
      return
    }

    setIsPending(true)
    try {
      const res = await bulkUpdateBaseRates({
        propertyId,
        roomGroupIds: Array.from(selectedRooms),
        startDate,
        endDate,
        daysOfWeek: Array.from(selectedDays),
        newBaseRate: Number(baseRate),
      })
      if (res.ok) {
        toast.success(`Updated ${res.updatedCount} rates`, {
          description: `${selectedRooms.size} room type(s) for ${selectedDays.size} day(s)/week`,
        })
        setOpen(false)
        // Reset form
        setSelectedRooms(new Set())
        setStartDate("")
        setEndDate("")
        setSelectedDays(new Set([1, 2, 3, 4, 5]))
        setBaseRate("")
      } else {
        toast.error("Update failed", { description: res.error })
      }
    } catch (err) {
      toast.error("Error updating rates", { description: String(err) })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        Bulk Update Rates
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Update Rates</DialogTitle>
            <DialogDescription>Apply a single base rate across multiple room types, dates, and days of week.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Room Type(s)</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                {roomGroups.map((rg) => (
                  <div key={rg.room_group_id} className="flex items-center gap-2">
                    <Checkbox
                      id={`room-${rg.room_group_id}`}
                      checked={selectedRooms.has(rg.room_group_id)}
                      onCheckedChange={() => toggleRoom(rg.room_group_id)}
                    />
                    <label htmlFor={`room-${rg.room_group_id}`} className="text-sm cursor-pointer">
                      {rg.group_name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Days of Week */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Days of Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAY_NAMES.map((name, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Checkbox
                      id={`day-${i}`}
                      checked={selectedDays.has(i)}
                      onCheckedChange={() => toggleDay(i)}
                    />
                    <label htmlFor={`day-${i}`} className="text-xs cursor-pointer">
                      {name.slice(0, 3)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Base Rate */}
            <div className="space-y-2">
              <Label htmlFor="base-rate" className="text-sm font-medium">
                New Base Rate
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="base-rate"
                  type="number"
                  min="0"
                  step="1"
                  value={baseRate}
                  onChange={(e) => setBaseRate(e.target.value)}
                  placeholder="0"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">{currency}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Bulk Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
