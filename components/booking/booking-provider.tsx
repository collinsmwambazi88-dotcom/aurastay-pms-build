"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { BookingDialog } from "@/components/booking/booking-dialog"
import type { RoomGroup, RatePlan, Addon } from "@/lib/types"

interface BookingPrefill {
  roomGroupId?: number
  checkIn?: string
}

interface BookingContextValue {
  open: (prefill?: BookingPrefill) => void
  close: () => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error("useBooking must be used within BookingProvider")
  return ctx
}

export function BookingProvider({
  children,
  propertyId,
  roomGroups,
  ratePlans,
  addons,
  currency,
}: {
  children: ReactNode
  propertyId: number
  roomGroups: RoomGroup[]
  ratePlans: RatePlan[]
  addons: Addon[]
  currency: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [prefill, setPrefill] = useState<BookingPrefill>({})

  const open = (p?: BookingPrefill) => {
    setPrefill(p ?? {})
    setIsOpen(true)
  }
  const close = () => setIsOpen(false)

  return (
    <BookingContext.Provider value={{ open, close }}>
      {children}
      <BookingDialog
        isOpen={isOpen}
        onClose={close}
        propertyId={propertyId}
        roomGroups={roomGroups}
        ratePlans={ratePlans}
        addons={addons}
        currency={currency}
        prefill={prefill}
      />
    </BookingContext.Provider>
  )
}
