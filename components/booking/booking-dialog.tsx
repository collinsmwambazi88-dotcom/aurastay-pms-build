"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { RoomGroup, RatePlan, Addon } from "@/lib/types"

export function BookingDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  propertyId: number
  roomGroups: RoomGroup[]
  ratePlans: RatePlan[]
  addons: Addon[]
  currency: string
  prefill: { roomGroupId?: number; checkIn?: string }
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Booking flow coming soon.</p>
      </DialogContent>
    </Dialog>
  )
}
