"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Property, WebsiteConfig, RoomGroup } from "@/lib/types"
import { toast } from "sonner"
import { createPublicBooking } from "@/lib/actions"
import { quoteBooking } from "@/lib/actions"

interface GuestBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
  roomGroup: RoomGroup
  config: WebsiteConfig
}

type DialogStep = "dates" | "details" | "payment" | "success"

export function GuestBookingDialog({
  open,
  onOpenChange,
  property,
  roomGroup,
  config,
}: GuestBookingDialogProps) {
  const { user } = useUser()
  const [step, setStep] = useState<DialogStep>("dates")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingMethod, setBookingMethod] = useState<"confirm" | "pay">("confirm")
  const [reservationId, setReservationId] = useState<number | null>(null)

  // Pre-fill form from Clerk user data when dialog opens
  useEffect(() => {
    if (open && user) {
      setFullName(user.fullName || "")
      setEmail(user.primaryEmailAddress?.emailAddress || "")
      setStep("dates")
      setBookingMethod("confirm")
    }
  }, [open, user])

  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (86400000)) : 0
  const pricePerNight = 150 // Mock price - in production use rate_calendars
  const subtotal = nights * pricePerNight
  const tax = Math.round(subtotal * property.tax_rate * 100) / 10000
  const total = subtotal + tax

  const handleDatesNext = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select both check-in and check-out dates")
      return
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error("Check-out date must be after check-in date")
      return
    }
    setStep("details")
  }

  const handleDetailsNext = () => {
    if (!fullName || !email || !phone) {
      toast.error("Please fill in all guest details")
      return
    }
    setStep("payment")
  }

  const handleConfirmBooking = async () => {
    setIsProcessing(true)
    try {
      const result = await createPublicBooking({
        propertyId: property.id,
        roomGroupId: roomGroup.id,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        checkIn,
        checkOut,
        payNow: false,
      })

      if (!result.ok) {
        toast.error(result.error ?? "Failed to create booking")
        return
      }

      setReservationId(result.reservationId ?? null)
      setStep("success")
      toast.success("Booking confirmed!")
    } catch (err) {
      toast.error("Failed to create booking")
      console.error("[v0] Booking error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayNow = async () => {
    setIsProcessing(true)
    try {
      const result = await createPublicBooking({
        propertyId: property.id,
        roomGroupId: roomGroup.id,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        checkIn,
        checkOut,
        payNow: true,
      })

      if (!result.ok) {
        toast.error(result.error ?? "Failed to create booking")
        return
      }

      // In production: redirect to Stripe payment page or open Stripe Elements modal
      // For now: simulate success
      setReservationId(result.reservationId ?? null)
      setStep("success")
      toast.success("Booking created! Stripe payment coming soon.")
    } catch (err) {
      toast.error("Failed to create booking")
      console.error("[v0] Booking error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset after close
    setTimeout(() => {
      setStep("dates")
      setCheckIn("")
      setCheckOut("")
      setFullName(user?.fullName || "")
      setEmail(user?.primaryEmailAddress?.emailAddress || "")
      setPhone("")
      setReservationId(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Success Screen */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Booking Confirmed</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Your booking is confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                Reservation ID: <span className="font-mono font-semibold">{reservationId}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                A confirmation email has been sent to {email}
              </p>
              <Button onClick={handleClose} className="text-white" style={{ backgroundColor: config?.primaryColor }}>
                Close
              </Button>
            </div>
          </>
        )}

        {/* Dates Step */}
        {step === "dates" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Your Dates</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                />
              </div>

              {nights > 0 && (
                <div className="bg-stone-50 p-4 rounded-lg border border-border">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{roomGroup.name}</span>
                    <span className="font-semibold">${subtotal}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total</span>
                    <span style={{ color: config?.primaryColor }}>
                      {property.currency.toUpperCase()} {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleClose()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDatesNext}
                  disabled={!checkIn || !checkOut}
                  className="flex-1 text-white"
                  style={{ backgroundColor: config?.primaryColor }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Details Step */}
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Your Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 p-4 rounded-lg border border-border">
                <p className="text-sm font-medium mb-1">{roomGroup.name}</p>
                <p className="text-sm text-muted-foreground">
                  {checkIn} to {checkOut} ({nights} nights)
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("dates")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleDetailsNext}
                  disabled={!fullName || !email || !phone}
                  className="flex-1 text-white"
                  style={{ backgroundColor: config?.primaryColor }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Payment Step */}
        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="bg-stone-50 p-4 rounded-lg border border-border">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{roomGroup.name}</span>
                  <span className="font-semibold">${subtotal}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {checkIn} to {checkOut} ({nights} nights)
                </div>
                <div className="space-y-2 border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({property.tax_rate.toFixed(1)}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span style={{ color: config?.primaryColor }}>
                      {property.currency.toUpperCase()} {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                <p><strong>{fullName}</strong></p>
                <p className="text-muted-foreground">{email}</p>
                <p className="text-muted-foreground">{phone}</p>
              </div>

              {!property.stripe_onboarding_complete && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Online payments not yet available. Complete your booking and arrange payment at the hotel.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isProcessing}
                  className="flex-1 text-white"
                  variant="outline"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
                <Button
                  onClick={handlePayNow}
                  disabled={isProcessing || !property.stripe_onboarding_complete}
                  className="flex-1 text-white"
                  style={{ backgroundColor: config?.primaryColor }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
